"""
Baghewala Digital Twin — Model 4: Failure-Risk Model (Rod / Pump)
XGBoost binary classifier with isotonic calibration for 7-day and 30-day failure risk.
Spec: §7.4 of Baghewala_Digital_Twin_AIML_Architecture.md
"""
from __future__ import annotations

import logging
from typing import Dict

import mlflow
import mlflow.xgboost
import numpy as np
import optuna
import pandas as pd
import shap
import xgboost as xgb
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

from config import (
    OPTUNA_N_TRIALS, OPTUNA_TIMEOUT_SECONDS,
    RANDOM_SEED, THRESHOLDS, XGB_DEVICE,
)
from feature_engineering import build_feature_matrix

optuna.logging.set_verbosity(optuna.logging.WARNING)
logger = logging.getLogger(__name__)

MODEL_NAME = "failure_risk"
HORIZONS   = {
    "7d":  "target_failure_7d",
    "30d": "target_failure_30d",
}


# ── Optuna objective ─────────────────────────────────────────────────────────

def _make_xgb_objective(
    X_tr: pd.DataFrame, y_tr: pd.Series,
    X_va: pd.DataFrame, y_va: pd.Series,
    scale_pos_weight: float,
) -> optuna.study.ObjectiveFuncType:
    def objective(trial: optuna.Trial) -> float:
        params = {
            "n_estimators":         trial.suggest_int("n_estimators", 200, 800),
            "learning_rate":        trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
            "max_depth":            trial.suggest_int("max_depth", 3, 7),
            "min_child_weight":     trial.suggest_int("min_child_weight", 1, 20),
            "subsample":            trial.suggest_float("subsample", 0.5, 1.0),
            "colsample_bytree":     trial.suggest_float("colsample_bytree", 0.5, 1.0),
            "reg_alpha":            trial.suggest_float("reg_alpha", 1e-8, 10.0, log=True),
            "reg_lambda":           trial.suggest_float("reg_lambda", 1e-8, 10.0, log=True),
            "scale_pos_weight":     scale_pos_weight,
            "objective":            "binary:logistic",
            "eval_metric":          "auc",
            "tree_method":          "hist",
            "device":               XGB_DEVICE,
            "verbosity":            0,
            "random_state":         RANDOM_SEED,
            "early_stopping_rounds": 50,
        }
        n_est = params.pop("n_estimators")
        dtrain = xgb.DMatrix(X_tr, label=y_tr)
        dval   = xgb.DMatrix(X_va, label=y_va)
        bst = xgb.train(params, dtrain, num_boost_round=n_est,
                         evals=[(dval, "val")], verbose_eval=False)
        probs = bst.predict(dval)
        return -roc_auc_score(y_va, probs)

    return objective


# ── Calibration curve logging ─────────────────────────────────────────────────

def _log_calibration_metrics(y_true: pd.Series, y_prob: np.ndarray, prefix: str):
    """Compute and log calibration metrics; per §7.4 calibration matters as much as ranking."""
    if len(y_true) < 10 or y_true.nunique() < 2:
        logger.warning("  %s: insufficient samples or no positive class for metrics", prefix)
        return {"auc": 0.0, "brier": 1.0, "ap": 0.0, "ece": 1.0}
    brier = brier_score_loss(y_true, y_prob)
    auc   = roc_auc_score(y_true, y_prob)
    ap    = average_precision_score(y_true, y_prob)
    try:
        frac_pos, mean_pred = calibration_curve(y_true, y_prob, n_bins=10, strategy="uniform")
        ece = float(np.mean(np.abs(frac_pos - mean_pred)))
    except Exception:
        ece = float(np.mean(np.abs(y_prob - y_true.values)))
    mlflow.log_metrics({
        f"{prefix}_auc":   auc,
        f"{prefix}_brier": brier,
        f"{prefix}_ap":    ap,
        f"{prefix}_ece":   ece,
    })
    return {"auc": auc, "brier": brier, "ap": ap, "ece": ece}


# ── Main train function ───────────────────────────────────────────────────────

def train_failure_risk(
    train_df: pd.DataFrame,
    val_df:   pd.DataFrame,
    test_df:  pd.DataFrame,
    run_name: str = "failure_risk",
) -> Dict:
    """
    Trains a binary failure-risk model per horizon (7d, 30d).
    Uses isotonic calibration (as specified in §7.4), and tracks Brier score explicitly.
    """
    logger.info("=== Training Failure Risk Model ===")

    X_tr_full, feat_names = build_feature_matrix(train_df, MODEL_NAME)
    X_va_full, _          = build_feature_matrix(val_df,   MODEL_NAME)
    X_te_full, _          = build_feature_matrix(test_df,  MODEL_NAME)

    thresholds = THRESHOLDS[MODEL_NAME]
    report = {"model": MODEL_NAME, "horizons": {}, "passed_promotion": True}

    with mlflow.start_run(run_name=run_name, nested=True):
        mlflow.set_tag("model_family", MODEL_NAME)
        mlflow.set_tag("label_source_validated_on", "ground_truth+weak")

        for horizon, target_col in HORIZONS.items():
            if target_col not in train_df.columns:
                logger.warning("Missing target %s — skipping horizon %s", target_col, horizon)
                continue

            y_tr = train_df[target_col].dropna().astype(int)
            y_va = val_df[target_col].dropna().astype(int)
            y_te = test_df[target_col].dropna().astype(int)
            X_tr = X_tr_full.loc[y_tr.index]
            X_va = X_va_full.loc[y_va.index]
            X_te = X_te_full.loc[y_te.index]

            pos_count = y_tr.sum()
            neg_count = len(y_tr) - pos_count
            scale_pos_weight = float(neg_count) / (pos_count + 1e-9)
            logger.info("  Horizon %s — pos:%d neg:%d scale_pos_weight:%.2f",
                        horizon, pos_count, neg_count, scale_pos_weight)
            mlflow.log_param(f"{horizon}_scale_pos_weight", scale_pos_weight)

            # ── Optuna HPO ────────────────────────────────────────────────────
            logger.info("  Optuna HPO (%d trials)", OPTUNA_N_TRIALS)
            study = optuna.create_study(direction="minimize",
                                        sampler=optuna.samplers.TPESampler(seed=RANDOM_SEED))
            study.optimize(
                _make_xgb_objective(X_tr, y_tr, X_va, y_va, scale_pos_weight),
                n_trials=OPTUNA_N_TRIALS,
                timeout=OPTUNA_TIMEOUT_SECONDS,
            )
            best_params = {
                **study.best_params,
                "scale_pos_weight": scale_pos_weight,
                "objective": "binary:logistic",
                "eval_metric": "auc",
                "tree_method": "hist",
                "device": XGB_DEVICE,
                "verbosity": 0,
                "random_state": RANDOM_SEED,
            }
            mlflow.log_params({f"{horizon}_{k}": v for k, v in study.best_params.items()})
            n_est = best_params.pop("n_estimators", 400)

            # ── Train final model on train+val ────────────────────────────────
            X_trainval = pd.concat([X_tr, X_va])
            y_trainval = pd.concat([y_tr, y_va])
            dtrain_full = xgb.DMatrix(X_trainval, label=y_trainval)
            bst = xgb.train(best_params, dtrain_full, num_boost_round=n_est, verbose_eval=False)

            # ── Isotonic calibration on val set ───────────────────────────────
            from sklearn.isotonic import IsotonicRegression
            raw_probs_va = bst.predict(xgb.DMatrix(X_va))
            calibrator = IsotonicRegression(out_of_bounds="clip")
            calibrator.fit(raw_probs_va, y_va)
            logger.info("  Isotonic calibration fitted on val set")

            # ── Evaluate on test set ──────────────────────────────────────────
            raw_probs_te = bst.predict(xgb.DMatrix(X_te))
            cal_probs_te = calibrator.transform(raw_probs_te)

            raw_metrics = _log_calibration_metrics(y_te, raw_probs_te, f"{horizon}_raw")
            cal_metrics = _log_calibration_metrics(y_te, cal_probs_te, f"{horizon}_cal")
            logger.info("  [%s] Raw AUC: %.4f | Cal AUC: %.4f | Cal Brier: %.4f",
                        horizon, raw_metrics["auc"], cal_metrics["auc"], cal_metrics["brier"])

            # ── SHAP per prediction (spec §7.4: per-prediction explanation required) ──
            try:
                explainer = shap.TreeExplainer(bst)
                shap_vals = explainer.shap_values(X_te[:500])
                mean_abs_shap = np.abs(shap_vals).mean(axis=0)
                feat_importance = dict(zip(feat_names, mean_abs_shap.tolist()))
                mlflow.log_dict(
                    {k: round(float(v), 6) for k, v in sorted(feat_importance.items(), key=lambda x: -x[1])},
                    f"shap_feature_importance_{horizon}.json",
                )
            except Exception as e:
                logger.warning("SHAP failed for horizon %s: %s", horizon, e)

            # ── Promotion check ───────────────────────────────────────────────
            h_passed = (
                cal_metrics["auc"]   >= thresholds["auc_min"]
                and cal_metrics["brier"] <= thresholds["brier_score_max"]
            )
            report["horizons"][horizon] = {
                "auc_raw":    round(float(raw_metrics["auc"]), 4),
                "auc_cal":    round(float(cal_metrics["auc"]), 4),
                "brier_cal":  round(float(cal_metrics["brier"]), 4),
                "ece_cal":    round(float(cal_metrics["ece"]), 4),
                "passed":     h_passed,
            }
            if not h_passed:
                report["passed_promotion"] = False
                logger.warning("  [failure_risk][%s] FAILED: auc=%.4f (need ≥%.2f), brier=%.4f (need ≤%.2f)",
                               horizon, cal_metrics["auc"], thresholds["auc_min"],
                               cal_metrics["brier"], thresholds["brier_score_max"])
            else:
                logger.info("  [failure_risk][%s] PASSED", horizon)

            # ── Log model artifacts ───────────────────────────────────────────
            import pickle, tempfile, os
            with tempfile.NamedTemporaryFile(suffix=".pkl", delete=False) as f:
                pickle.dump({"calibrator": calibrator}, f)
                tmp = f.name
            mlflow.log_artifact(tmp, artifact_path=f"failure_risk_{horizon}_calibrator")
            os.unlink(tmp)
            mlflow.xgboost.log_model(
                bst,
                artifact_path=f"failure_risk_{horizon}_model",
                registered_model_name=f"baghewala_failure_risk_{horizon}",
            )

        mlflow.log_dict(report, "evaluation_report.json")
        mlflow.set_tag("passed_promotion", str(report["passed_promotion"]))

    logger.info("[%s] Overall passed: %s", MODEL_NAME, report["passed_promotion"])
    return report
