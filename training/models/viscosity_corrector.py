"""
Baghewala Digital Twin — Model 2: Viscosity Residual Corrector
Ridge regression + GBR bootstrap ensemble to correct physics-only viscosity estimate.
Spec: §7.2 of Baghewala_Digital_Twin_AIML_Architecture.md
"""
from __future__ import annotations

import logging
from typing import Dict, List

import mlflow
import numpy as np
import optuna
import pandas as pd
import shap
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error
from sklearn.utils import resample

from config import OPTUNA_N_TRIALS, OPTUNA_TIMEOUT_SECONDS, RANDOM_SEED, THRESHOLDS
from feature_engineering import build_feature_matrix

optuna.logging.set_verbosity(optuna.logging.WARNING)
logger = logging.getLogger(__name__)

MODEL_NAME = "viscosity_corrector"
TARGET_COL = "target_viscosity_residual"
N_BOOTSTRAP = 15  # per spec §7.2


# ── Bootstrap ensemble for uncertainty ───────────────────────────────────────

class BootstrapViscosityEnsemble:
    """
    Train N_BOOTSTRAP GBR models on bootstrap resamples.
    Prediction: mean of ensemble outputs.
    Confidence: std dev of ensemble outputs (per §7.2 spec).
    """

    def __init__(self, n_bootstrap: int = N_BOOTSTRAP, **gbr_params):
        self.n_bootstrap = n_bootstrap
        self.gbr_params = gbr_params
        self.models: List[GradientBoostingRegressor] = []

    def fit(self, X: pd.DataFrame, y: pd.Series) -> "BootstrapViscosityEnsemble":
        self.models = []
        for i in range(self.n_bootstrap):
            X_b, y_b = resample(X, y, random_state=RANDOM_SEED + i)
            m = GradientBoostingRegressor(random_state=RANDOM_SEED + i, **self.gbr_params)
            m.fit(X_b, y_b)
            self.models.append(m)
        return self

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        preds = np.column_stack([m.predict(X) for m in self.models])
        return preds.mean(axis=1)

    def predict_with_std(self, X: pd.DataFrame):
        preds = np.column_stack([m.predict(X) for m in self.models])
        return preds.mean(axis=1), preds.std(axis=1)


# ── Optuna objective (GBR backbone) ──────────────────────────────────────────

def _gbr_objective(X_tr, y_tr, X_va, y_va) -> optuna.study.ObjectiveFuncType:
    def objective(trial: optuna.Trial) -> float:
        params = {
            "n_estimators": trial.suggest_int("n_estimators", 100, 600),
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
            "max_depth": trial.suggest_int("max_depth", 2, 6),
            "subsample": trial.suggest_float("subsample", 0.5, 1.0),
            "min_samples_leaf": trial.suggest_int("min_samples_leaf", 5, 50),
        }
        m = GradientBoostingRegressor(random_state=RANDOM_SEED, **params)
        m.fit(X_tr, y_tr)
        return mean_absolute_error(y_va, m.predict(X_va))
    return objective


# ── Per-scenario evaluation ───────────────────────────────────────────────────

def _eval_per_scenario(
    df: pd.DataFrame,
    X: pd.DataFrame,
    y: pd.Series,
    ensemble: BootstrapViscosityEnsemble,
    physics_col: str = "viscosity_cp_physics",
) -> Dict[str, float]:
    """
    Per §7.2 promotion rule: corrected MAE must beat physics-only on EVERY scenario,
    not just in aggregate.
    """
    scenario_results = {}
    if "source" not in df.columns:
        return scenario_results
    for scenario, grp in df.groupby("source"):
        idx = grp.index.intersection(y.index)
        if len(idx) < 5:
            continue
        y_true_s = y.loc[idx]
        # Corrected estimate = physics + predicted residual
        residual_pred = ensemble.predict(X.loc[idx])
        corrected = df.loc[idx, physics_col].fillna(0) + residual_pred
        phys_mae = mean_absolute_error(y_true_s, df.loc[idx, physics_col].fillna(0))
        corr_mae = mean_absolute_error(y_true_s, corrected)
        scenario_results[str(scenario)] = {
            "physics_mae": round(float(phys_mae), 4),
            "corrected_mae": round(float(corr_mae), 4),
            "improvement_pct": round(100 * (phys_mae - corr_mae) / (phys_mae + 1e-9), 2),
            "passed": corr_mae <= phys_mae,
        }
    return scenario_results


# ── Main train function ───────────────────────────────────────────────────────

def train_viscosity_corrector(
    train_df: pd.DataFrame,
    val_df:   pd.DataFrame,
    test_df:  pd.DataFrame,
    run_name: str = "viscosity_corrector",
) -> Dict:
    logger.info("=== Training Viscosity Residual Corrector ===")

    if TARGET_COL not in train_df.columns:
        logger.error("Target column '%s' not found. Skipping.", TARGET_COL)
        return {"model": MODEL_NAME, "passed_promotion": False, "error": "missing_target"}

    X_tr, feat_names = build_feature_matrix(train_df, MODEL_NAME)
    X_va, _          = build_feature_matrix(val_df,   MODEL_NAME)
    X_te, _          = build_feature_matrix(test_df,  MODEL_NAME)

    y_tr = train_df[TARGET_COL].dropna()
    y_va = val_df[TARGET_COL].dropna()
    y_te = test_df[TARGET_COL].dropna()
    X_tr = X_tr.loc[y_tr.index]
    X_va = X_va.loc[y_va.index]
    X_te = X_te.loc[y_te.index]

    thresholds = THRESHOLDS[MODEL_NAME]
    physics_col = "viscosity_cp_physics"

    with mlflow.start_run(run_name=run_name, nested=True):
        mlflow.set_tag("model_family", MODEL_NAME)
        mlflow.set_tag("label_source_validated_on", "ground_truth")
        mlflow.log_param("n_bootstrap", N_BOOTSTRAP)

        # ── 1. Ridge baseline ─────────────────────────────────────────────────
        logger.info("  Fitting Ridge baseline")
        ridge = Ridge(alpha=1.0, random_state=RANDOM_SEED)
        ridge.fit(X_tr, y_tr)
        ridge_mae = mean_absolute_error(y_te, ridge.predict(X_te))
        mlflow.log_metric("ridge_test_mae", ridge_mae)
        logger.info("    Ridge MAE: %.4f", ridge_mae)

        # ── 2. GBR backbone with Optuna HPO ───────────────────────────────────
        logger.info("  Optuna HPO for GBR backbone (%d trials)", OPTUNA_N_TRIALS)
        study = optuna.create_study(direction="minimize",
                                    sampler=optuna.samplers.TPESampler(seed=RANDOM_SEED))
        study.optimize(
            _gbr_objective(X_tr, y_tr, X_va, y_va),
            n_trials=OPTUNA_N_TRIALS,
            timeout=OPTUNA_TIMEOUT_SECONDS,
        )
        best_gbr_params = study.best_params
        mlflow.log_params({f"gbr_{k}": v for k, v in best_gbr_params.items()})

        # ── 3. Bootstrap ensemble with best params ─────────────────────────────
        logger.info("  Training bootstrap ensemble (N=%d)", N_BOOTSTRAP)
        ensemble = BootstrapViscosityEnsemble(
            n_bootstrap=N_BOOTSTRAP, **best_gbr_params
        )
        ensemble.fit(X_tr, y_tr)

        # ── 4. Aggregate metrics ───────────────────────────────────────────────
        residual_preds, conf_std = ensemble.predict_with_std(X_te)
        corrected_preds = test_df.loc[X_te.index, physics_col].fillna(0).values + residual_preds
        physics_preds   = test_df.loc[X_te.index, physics_col].fillna(0).values
        # The label is the residual; true viscosity = physics + residual_true
        y_te_visc_true = physics_preds + y_te.values  # reconstruct actual viscosity for MAE comparison
        corr_mae  = mean_absolute_error(y_te_visc_true, corrected_preds)
        phys_mae  = mean_absolute_error(y_te_visc_true, physics_preds)
        improvement_pct = 100 * (phys_mae - corr_mae) / (phys_mae + 1e-9)

        mlflow.log_metrics({
            "test_corrected_mae": corr_mae,
            "test_physics_mae": phys_mae,
            "improvement_pct": improvement_pct,
            "mean_confidence_std": float(conf_std.mean()),
        })
        logger.info("  Physics MAE: %.4f → Corrected MAE: %.4f (improvement %.1f%%)",
                    phys_mae, corr_mae, improvement_pct)

        # ── 5. Per-scenario evaluation (hard rule) ─────────────────────────────
        scenario_results = _eval_per_scenario(
            test_df.loc[X_te.index], X_te, y_te, ensemble, physics_col
        )
        all_scenarios_pass = all(v["passed"] for v in scenario_results.values())
        mlflow.log_dict(scenario_results, "per_scenario_metrics.json")
        logger.info("  Per-scenario: %s", {k: v["passed"] for k, v in scenario_results.items()})

        # ── 6. SHAP explainability ─────────────────────────────────────────────
        try:
            explainer = shap.Explainer(ensemble.models[0], X_te)
            shap_vals = explainer(X_te[:200])
            mean_abs_shap = dict(zip(feat_names, np.abs(shap_vals.values).mean(axis=0)))
            mlflow.log_dict(
                {k: round(float(v), 6) for k, v in sorted(mean_abs_shap.items(), key=lambda x: -x[1])},
                "shap_feature_importance.json",
            )
        except Exception as e:
            logger.warning("SHAP computation failed (non-critical): %s", e)

        # ── 7. Promotion decision ──────────────────────────────────────────────
        passed = (
            improvement_pct >= thresholds["mae_improvement_vs_physics_pct"]
            and all_scenarios_pass
        )
        report = {
            "model": MODEL_NAME,
            "test_corrected_mae": round(float(corr_mae), 4),
            "test_physics_mae": round(float(phys_mae), 4),
            "improvement_pct": round(float(improvement_pct), 2),
            "all_scenarios_pass": all_scenarios_pass,
            "per_scenario": scenario_results,
            "passed_promotion": passed,
        }
        mlflow.log_dict(report, "evaluation_report.json")
        mlflow.set_tag("passed_promotion", str(passed))

        # Log the ensemble (using the first member as the pyfunc artifact; full ensemble via pickle)
        import pickle, tempfile, os
        with tempfile.NamedTemporaryFile(suffix=".pkl", delete=False) as f:
            pickle.dump(ensemble, f)
            tmp_path = f.name
        mlflow.log_artifact(tmp_path, artifact_path="viscosity_corrector_ensemble")
        os.unlink(tmp_path)

    logger.info("[%s] Passed: %s", MODEL_NAME, passed)
    return report
