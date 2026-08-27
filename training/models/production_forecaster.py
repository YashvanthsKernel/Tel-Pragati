"""
Baghewala Digital Twin — Model 1: Production Forecaster
LightGBM quantile regression (p10/p50/p90) for 1h / 6h / 24h oil rate forecast.
Spec: §7.1 of Baghewala_Digital_Twin_AIML_Architecture.md
"""
from __future__ import annotations

import logging
import warnings
from typing import Dict, Tuple

import lightgbm as lgb
import mlflow
import numpy as np
import optuna
import pandas as pd
from sklearn.metrics import mean_absolute_error

from config import (
    LGB_DEVICE, OPTUNA_N_TRIALS, OPTUNA_TIMEOUT_SECONDS,
    RANDOM_SEED, THRESHOLDS,
)
from feature_engineering import build_feature_matrix

optuna.logging.set_verbosity(optuna.logging.WARNING)
logger = logging.getLogger(__name__)

# Quantile → LightGBM alpha param
QUANTILES = {"p10": 0.10, "p50": 0.50, "p90": 0.90}
HORIZONS = ["1h", "6h", "24h"]
TARGET_MAP = {
    "1h":  "target_flow_bopd_1h",
    "6h":  "target_flow_bopd_6h",
    "24h": "target_flow_bopd_24h",
}
MODEL_NAME = "production_forecaster"


# ── Helpers ──────────────────────────────────────────────────────────────────

def _persistence_mae(y_true: pd.Series, y_last: pd.Series) -> float:
    """Naive persistence baseline MAE: predict the last observed value."""
    return mean_absolute_error(y_true, y_last)


def _empirical_coverage(y_true: pd.Series, y_p10: np.ndarray, y_p90: np.ndarray) -> float:
    """What fraction of true values fall inside the [p10, p90] interval?"""
    return float(np.mean((y_true.values >= y_p10) & (y_true.values <= y_p90)))


# ── Optuna objective ─────────────────────────────────────────────────────────

def _make_objective(
    X_tr: pd.DataFrame, y_tr: pd.Series,
    X_va: pd.DataFrame, y_va: pd.Series,
    alpha: float,
) -> optuna.study.ObjectiveFuncType:
    def objective(trial: optuna.Trial) -> float:
        params = {
            "objective": "quantile",
            "alpha": alpha,
            "metric": "quantile",
            "n_estimators": trial.suggest_int("n_estimators", 200, 1000),
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.3, log=True),
            "num_leaves": trial.suggest_int("num_leaves", 20, 150),
            "max_depth": trial.suggest_int("max_depth", 3, 10),
            "min_child_samples": trial.suggest_int("min_child_samples", 10, 100),
            "subsample": trial.suggest_float("subsample", 0.5, 1.0),
            "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),
            "reg_alpha": trial.suggest_float("reg_alpha", 1e-8, 10.0, log=True),
            "reg_lambda": trial.suggest_float("reg_lambda", 1e-8, 10.0, log=True),
            "device": LGB_DEVICE,
            "verbose": -1,
            "random_state": RANDOM_SEED,
        }
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            model = lgb.LGBMRegressor(**params)
            model.fit(
                X_tr, y_tr,
                eval_set=[(X_va, y_va)],
                callbacks=[lgb.early_stopping(50, verbose=False), lgb.log_evaluation(-1)],
            )
        preds = model.predict(X_va)
        # Pinball loss as the objective (alpha-quantile)
        errors = y_va.values - preds
        loss = np.mean(np.where(errors >= 0, alpha * errors, (alpha - 1) * errors))
        return loss

    return objective


# ── Main train function ───────────────────────────────────────────────────────

def train_production_forecaster(
    train_df: pd.DataFrame,
    val_df:   pd.DataFrame,
    test_df:  pd.DataFrame,
    run_name: str = "production_forecaster",
) -> Dict:
    """
    Train 9 LightGBM models (3 horizons × 3 quantiles), log to MLflow, evaluate against
    the promotion thresholds defined in §7.1.

    Returns: evaluation report dict (used by pipeline.py's promote decision).
    """
    logger.info("=== Training Production Forecaster ===")

    X_tr, feat_names = build_feature_matrix(train_df, MODEL_NAME)
    X_va, _          = build_feature_matrix(val_df,   MODEL_NAME)
    X_te, _          = build_feature_matrix(test_df,  MODEL_NAME)

    thresholds = THRESHOLDS[MODEL_NAME]
    report = {"model": MODEL_NAME, "horizons": {}, "passed_promotion": True}

    with mlflow.start_run(run_name=run_name, nested=True):
        mlflow.set_tag("model_family", MODEL_NAME)
        mlflow.set_tag("label_source_validated_on", "ground_truth")

        for horizon in HORIZONS:
            target_col = TARGET_MAP[horizon]
            if target_col not in train_df.columns:
                logger.warning("Missing target %s — skipping horizon %s", target_col, horizon)
                continue

            y_tr = train_df[target_col].dropna()
            X_tr_h = X_tr.loc[y_tr.index]
            y_va = val_df[target_col].dropna()
            X_va_h = X_va.loc[y_va.index]
            y_te = test_df[target_col].dropna()
            X_te_h = X_te.loc[y_te.index]

            horizon_models = {}
            for q_name, alpha in QUANTILES.items():
                logger.info("  Horizon %s | Quantile %s — Optuna HPO (%d trials)",
                            horizon, q_name, OPTUNA_N_TRIALS)
                study = optuna.create_study(direction="minimize",
                                            sampler=optuna.samplers.TPESampler(seed=RANDOM_SEED))
                study.optimize(
                    _make_objective(X_tr_h, y_tr, X_va_h, y_va, alpha),
                    n_trials=OPTUNA_N_TRIALS,
                    timeout=OPTUNA_TIMEOUT_SECONDS,
                    show_progress_bar=False,
                )
                best_params = study.best_params
                best_params.update({
                    "objective": "quantile", "alpha": alpha, "metric": "quantile",
                    "device": LGB_DEVICE, "verbose": -1, "random_state": RANDOM_SEED,
                })
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    final_model = lgb.LGBMRegressor(**best_params)
                    final_model.fit(X_tr_h, y_tr)
                horizon_models[q_name] = final_model
                mlflow.log_params({f"{horizon}_{q_name}_{k}": v for k, v in best_params.items()
                                   if k not in ("objective", "metric", "device", "verbose")})

            # Evaluate on test set
            p10_preds = horizon_models["p10"].predict(X_te_h)
            p50_preds = horizon_models["p50"].predict(X_te_h)
            p90_preds = horizon_models["p90"].predict(X_te_h)

            # Persistence baseline: use the lag column that matches horizon
            lag_col_map = {"1h": "flow_bopd_lag_1h", "6h": "flow_bopd_lag_6h", "24h": "flow_bopd_lag_24h"}
            lag_col = lag_col_map.get(horizon)
            if lag_col and lag_col in test_df.columns:
                y_persistence = test_df.loc[y_te.index, lag_col].fillna(y_te.mean())
                persistence_mae = _persistence_mae(y_te, y_persistence)
            else:
                persistence_mae = float(y_te.mean())  # fallback

            p50_mae = mean_absolute_error(y_te, p50_preds)
            improvement_pct = 100 * (persistence_mae - p50_mae) / (persistence_mae + 1e-9)
            coverage = _empirical_coverage(y_te, p10_preds, p90_preds)
            coverage_pct = 100 * coverage

            # Promotion check
            passed = (
                improvement_pct >= thresholds["p50_mae_improvement_vs_persistence_pct"]
                and thresholds["coverage_interval_low_pct"] <= coverage_pct <= thresholds["coverage_interval_high_pct"]
            )

            mlflow.log_metrics({
                f"{horizon}_p50_mae": p50_mae,
                f"{horizon}_persistence_mae": persistence_mae,
                f"{horizon}_improvement_pct": improvement_pct,
                f"{horizon}_coverage_pct": coverage_pct,
            })

            report["horizons"][horizon] = {
                "p50_mae": round(p50_mae, 4),
                "persistence_mae": round(persistence_mae, 4),
                "improvement_pct": round(improvement_pct, 2),
                "coverage_pct": round(coverage_pct, 2),
                "passed": passed,
            }
            if not passed:
                report["passed_promotion"] = False
                logger.warning("  [%s] Horizon %s FAILED promotion: improvement=%.1f%% (need >=%.1f%%), coverage=%.1f%%",
                               MODEL_NAME, horizon, improvement_pct,
                               thresholds["p50_mae_improvement_vs_persistence_pct"], coverage_pct)
            else:
                logger.info("  [%s] Horizon %s PASSED: improvement=%.1f%%, coverage=%.1f%%",
                            MODEL_NAME, horizon, improvement_pct, coverage_pct)

            # Log models to MLflow
            for q_name, model in horizon_models.items():
                # MLflow 3.x: model name must not contain '/' — use flat naming
                mlflow.lightgbm.log_model(
                    model,
                    artifact_path=f"forecaster_{horizon}_{q_name}",
                    registered_model_name=f"baghewala_forecaster_{horizon}_{q_name}",
                )

        mlflow.log_dict(report, "evaluation_report.json")
        mlflow.set_tag("passed_promotion", str(report["passed_promotion"]))

    logger.info("[%s] Overall passed: %s | Horizon summary: %s",
                MODEL_NAME, report["passed_promotion"],
                {h: d.get("passed") for h, d in report["horizons"].items()})
    return report
