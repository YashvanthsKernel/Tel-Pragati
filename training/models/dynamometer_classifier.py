"""
Baghewala Digital Twin — Model 3: Dynamometer Condition Classifier
XGBoost multi-class classifier (5 card classes) with temperature-scaled calibration.
Spec: §7.3 of Baghewala_Digital_Twin_AIML_Architecture.md
"""
from __future__ import annotations

import logging
from typing import Dict, Tuple

import mlflow
import mlflow.xgboost
import numpy as np
import optuna
import pandas as pd
import shap
import xgboost as xgb
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    recall_score,
)
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import label_binarize

from config import (
    OPTUNA_N_TRIALS, OPTUNA_TIMEOUT_SECONDS,
    RANDOM_SEED, THRESHOLDS, XGB_DEVICE,
)
from data_loader import (
    CLASS_MAP, DYNO_SCALAR_COLS, dyno_train_val_test_split, load_dynamometer,
)

optuna.logging.set_verbosity(optuna.logging.WARNING)
logger = logging.getLogger(__name__)

MODEL_NAME     = "dynamometer_classifier"
N_CLASSES      = len(CLASS_MAP)
# Decision threshold for rod_floating class (asymmetric per spec §7.3 — miss is costlier than false alarm)
ROD_FLOAT_CLASS = CLASS_MAP["Rod_Floating"]
ROD_FLOAT_THRESHOLD = 0.35  # lower threshold biases toward recall for this class
INVERSE_CLASS_MAP = {v: k for k, v in CLASS_MAP.items()}


# ── Temperature scaling (Platt-style calibration) ───────────────────────────

class TemperatureScaler:
    """
    Scales logits by a single temperature parameter T.
    Minimizes NLL on a held-out set. Per §7.3 spec.
    """

    def __init__(self):
        self.temperature: float = 1.0

    def fit(self, logits: np.ndarray, y_true: np.ndarray) -> "TemperatureScaler":
        from scipy.optimize import minimize_scalar
        from scipy.special import log_softmax

        def nll(T: float) -> float:
            if T <= 0:
                return 1e9
            scaled = logits / T
            log_probs = log_softmax(scaled, axis=1)
            return -log_probs[np.arange(len(y_true)), y_true].mean()

        result = minimize_scalar(nll, bounds=(0.05, 10.0), method="bounded")
        self.temperature = float(result.x)
        logger.info("  Temperature scaling: T=%.4f", self.temperature)
        return self

    def predict_proba(self, logits: np.ndarray) -> np.ndarray:
        from scipy.special import softmax
        return softmax(logits / self.temperature, axis=1)


# ── Optuna objective ─────────────────────────────────────────────────────────

def _make_xgb_objective(
    X_tr: pd.DataFrame, y_tr: pd.Series,
    X_va: pd.DataFrame, y_va: pd.Series,
) -> optuna.study.ObjectiveFuncType:
    def objective(trial: optuna.Trial) -> float:
        params = {
            "n_estimators":       trial.suggest_int("n_estimators", 200, 800),
            "learning_rate":      trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
            "max_depth":          trial.suggest_int("max_depth", 3, 8),
            "min_child_weight":   trial.suggest_int("min_child_weight", 1, 20),
            "subsample":          trial.suggest_float("subsample", 0.5, 1.0),
            "colsample_bytree":   trial.suggest_float("colsample_bytree", 0.5, 1.0),
            "reg_alpha":          trial.suggest_float("reg_alpha", 1e-8, 10.0, log=True),
            "reg_lambda":         trial.suggest_float("reg_lambda", 1e-8, 10.0, log=True),
            "objective":          "multi:softprob",
            "num_class":          N_CLASSES,
            "tree_method":        "hist",
            "device":             XGB_DEVICE,
            "eval_metric":        "mlogloss",
            "verbosity":          0,
            "random_state":       RANDOM_SEED,
            "early_stopping_rounds": 50,
        }
        dtrain = xgb.DMatrix(X_tr, label=y_tr)
        dval   = xgb.DMatrix(X_va, label=y_va)
        bst = xgb.train(params, dtrain, num_boost_round=params.pop("n_estimators"),
                         evals=[(dval, "val")], verbose_eval=False)
        preds    = bst.predict(dval).reshape(-1, N_CLASSES)
        y_pred   = preds.argmax(axis=1)
        return 1 - f1_score(y_va, y_pred, average="macro", zero_division=0)

    return objective


# ── Main train function ───────────────────────────────────────────────────────

def train_dynamometer_classifier(run_name: str = "dynamometer_classifier") -> Dict:
    """
    Loads the dynamometer dataset, runs Optuna HPO, trains XGBoost,
    applies temperature scaling calibration, evaluates, logs to MLflow.
    """
    logger.info("=== Training Dynamometer Condition Classifier ===")

    X, y = load_dynamometer()
    X_tr, X_va, X_te, y_tr, y_va, y_te = dyno_train_val_test_split(X, y)
    logger.info("  Split sizes — tr:%d va:%d te:%d", len(y_tr), len(y_va), len(y_te))
    logger.info("  Class distribution (test): %s", dict(y_te.value_counts()))

    thresholds = THRESHOLDS[MODEL_NAME]

    with mlflow.start_run(run_name=run_name, nested=True):
        mlflow.set_tag("model_family", MODEL_NAME)
        mlflow.set_tag("label_source_validated_on", "ground_truth")
        mlflow.log_param("n_classes", N_CLASSES)
        mlflow.log_param("rod_float_threshold", ROD_FLOAT_THRESHOLD)

        # ── Optuna HPO ────────────────────────────────────────────────────────
        logger.info("  Optuna HPO (%d trials)", OPTUNA_N_TRIALS)
        study = optuna.create_study(direction="minimize",
                                    sampler=optuna.samplers.TPESampler(seed=RANDOM_SEED))
        study.optimize(
            _make_xgb_objective(X_tr, y_tr, X_va, y_va),
            n_trials=OPTUNA_N_TRIALS,
            timeout=OPTUNA_TIMEOUT_SECONDS,
        )
        best_params = {
            **study.best_params,
            "objective": "multi:softprob",
            "num_class": N_CLASSES,
            "tree_method": "hist",
            "device": XGB_DEVICE,
            "eval_metric": "mlogloss",
            "verbosity": 0,
            "random_state": RANDOM_SEED,
        }
        mlflow.log_params({k: v for k, v in best_params.items()
                           if k not in ("objective", "eval_metric", "device", "verbosity")})

        # ── Train final model ─────────────────────────────────────────────────
        logger.info("  Training final model with best params")
        n_est = best_params.pop("n_estimators", 400)
        dtrain_full = xgb.DMatrix(pd.concat([X_tr, X_va]), label=pd.concat([y_tr, y_va]))
        bst = xgb.train(best_params, dtrain_full, num_boost_round=n_est, verbose_eval=False)

        # ── Temperature scaling ───────────────────────────────────────────────
        logits_va = bst.predict(xgb.DMatrix(X_va)).reshape(-1, N_CLASSES)
        scaler = TemperatureScaler()
        scaler.fit(logits_va, y_va.values)
        mlflow.log_param("temperature", scaler.temperature)

        # ── Evaluate on test set ──────────────────────────────────────────────
        logits_te = bst.predict(xgb.DMatrix(X_te)).reshape(-1, N_CLASSES)
        probs_te  = scaler.predict_proba(logits_te)

        # Apply asymmetric threshold for rod_floating
        y_pred_argmax = probs_te.argmax(axis=1)
        rod_float_prob = probs_te[:, ROD_FLOAT_CLASS]
        y_pred = np.where(
            rod_float_prob >= ROD_FLOAT_THRESHOLD,
            ROD_FLOAT_CLASS,
            y_pred_argmax,
        )

        macro_f1    = f1_score(y_te, y_pred, average="macro", zero_division=0)
        rod_recall  = recall_score(
            y_te, y_pred,
            labels=[ROD_FLOAT_CLASS],
            average="micro",
            zero_division=0,
        )
        class_report_dict = classification_report(
            y_te, y_pred,
            target_names=[INVERSE_CLASS_MAP[i] for i in range(N_CLASSES)],
            output_dict=True,
            zero_division=0,
        )
        conf_matrix = confusion_matrix(y_te, y_pred).tolist()

        mlflow.log_metrics({
            "test_macro_f1": macro_f1,
            "test_rod_floating_recall": rod_recall,
        })
        mlflow.log_dict(class_report_dict, "classification_report.json")
        mlflow.log_dict({"confusion_matrix": conf_matrix}, "confusion_matrix.json")

        logger.info("  Macro-F1: %.4f | Rod-Float Recall: %.4f", macro_f1, rod_recall)

        # ── SHAP ─────────────────────────────────────────────────────────────
        try:
            explainer = shap.TreeExplainer(bst)
            shap_vals = explainer.shap_values(X_te[:300])
            # Multi-class XGBoost: shap_vals may be a list of 2-D arrays (one per class)
            # or a single 3-D array depending on SHAP version — normalise to ndarray
            if isinstance(shap_vals, list):
                arr = np.array(shap_vals)          # shape: (n_classes, n_samples, n_features)
            else:
                arr = shap_vals                    # shape: (n_samples, n_features, n_classes) or similar
            mean_abs_shap = np.abs(arr).mean(axis=tuple(range(arr.ndim - 1)))  # mean over all but last axis
            if mean_abs_shap.ndim == 0 or len(mean_abs_shap) != len(list(X_te.columns)):
                # Fallback: flatten over first two dims if shape is unexpected
                mean_abs_shap = np.abs(arr).reshape(-1, arr.shape[-1]).mean(axis=0) if arr.ndim == 3 else np.abs(arr).mean(axis=0)
            feat_importance = dict(zip(list(X_te.columns), mean_abs_shap.tolist()))
            mlflow.log_dict(
                {k: round(float(v), 6) for k, v in sorted(feat_importance.items(), key=lambda x: -x[1])},
                "shap_feature_importance.json",
            )
        except Exception as e:
            logger.warning("SHAP computation failed (non-critical): %s", e)

        # ── Promotion decision ────────────────────────────────────────────────
        passed = (
            macro_f1   >= thresholds["macro_f1_min"]
            and rod_recall >= thresholds["rod_floating_recall_min"]
        )
        report = {
            "model": MODEL_NAME,
            "test_macro_f1": round(float(macro_f1), 4),
            "test_rod_floating_recall": round(float(rod_recall), 4),
            "temperature": scaler.temperature,
            "passed_promotion": passed,
            "classification_report": class_report_dict,
        }
        if not passed:
            logger.warning("  [%s] FAILED: macro_f1=%.4f (need ≥%.2f), rod_recall=%.4f (need ≥%.2f)",
                           MODEL_NAME, macro_f1, thresholds["macro_f1_min"],
                           rod_recall, thresholds["rod_floating_recall_min"])
        else:
            logger.info("  [%s] PASSED: macro_f1=%.4f, rod_recall=%.4f", MODEL_NAME, macro_f1, rod_recall)

        mlflow.log_dict(report, "evaluation_report.json")
        mlflow.set_tag("passed_promotion", str(passed))
        mlflow.xgboost.log_model(bst, artifact_path="dynamometer_classifier",
                                 registered_model_name="baghewala_dynamometer_classifier")

        # Persist temperature scaler alongside the model
        import pickle, tempfile, os
        with tempfile.NamedTemporaryFile(suffix=".pkl", delete=False) as f:
            pickle.dump(scaler, f)
            tmp = f.name
        mlflow.log_artifact(tmp, artifact_path="dynamometer_classifier")
        os.unlink(tmp)

    return report
