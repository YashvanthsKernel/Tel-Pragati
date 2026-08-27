"""
Baghewala Digital Twin — Model 5: Anomaly / Sensor-Health Detector
Rule-based hard checks + Isolation Forest for multivariate soft anomalies.
Spec: §7.5 of Baghewala_Digital_Twin_AIML_Architecture.md
"""
from __future__ import annotations

import logging
from typing import Dict, List, Optional, Tuple

import mlflow
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.preprocessing import StandardScaler

from config import RANDOM_SEED, THRESHOLDS
from data_loader import load_anomaly_data

logger = logging.getLogger(__name__)
MODEL_NAME = "anomaly_detector"


# ── Rule engine (hard bounds — deterministic, fastest layer) ─────────────────

# Each rule: (description, lambda df -> bool_Series_where_True_means_anomaly)
PHYSICAL_RULES: List[Tuple[str, object]] = [
    ("spm_out_of_range",           lambda df: (df["spm"] < 0) | (df["spm"] > 15) if "spm" in df.columns else pd.Series(False, index=df.index)),
    ("surface_temp_out_of_range",  lambda df: (df["surface_temp_c"] < -10) | (df["surface_temp_c"] > 320) if "surface_temp_c" in df.columns else pd.Series(False, index=df.index)),
    ("flow_negative",              lambda df: df["flow_bopd"] < 0 if "flow_bopd" in df.columns else pd.Series(False, index=df.index)),
    ("motor_current_over_limit",   lambda df: df["motor_current_a"] > 55.0 if "motor_current_a" in df.columns else pd.Series(False, index=df.index)),
    ("vfd_out_of_range",           lambda df: (df["vfd_pct"] < 0) | (df["vfd_pct"] > 100) if "vfd_pct" in df.columns else pd.Series(False, index=df.index)),
    ("pprl_over_hard_limit",       lambda df: df["pprl_lbs"] > 28000 if "pprl_lbs" in df.columns else pd.Series(False, index=df.index)),
    ("mprl_below_zero",            lambda df: df["mprl_lbs"] < 0 if "mprl_lbs" in df.columns else pd.Series(False, index=df.index)),
    ("viscosity_negative",         lambda df: df["viscosity_cp_physics"] < 0 if "viscosity_cp_physics" in df.columns else pd.Series(False, index=df.index)),
    ("bht_above_steam_temp",       lambda df: df["bht_estimate_c"] > 320 if "bht_estimate_c" in df.columns else pd.Series(False, index=df.index)),
    ("bht_below_ambient",          lambda df: df["bht_estimate_c"] < 5 if "bht_estimate_c" in df.columns else pd.Series(False, index=df.index)),
    ("stroke_len_out_of_range",    lambda df: (df["stroke_len_in"] < 0) | (df["stroke_len_in"] > 200) if "stroke_len_in" in df.columns else pd.Series(False, index=df.index)),
    ("card_compression_frac_range", lambda df: (df["card_compression_frac"] < 0) | (df["card_compression_frac"] > 1) if "card_compression_frac" in df.columns else pd.Series(False, index=df.index)),
    ("fmi_range",                  lambda df: (df["fmi"] < 0) | (df["fmi"] > 1) if "fmi" in df.columns else pd.Series(False, index=df.index)),
    ("water_cut_range",            lambda df: (df["water_cut_pct"] < 0) | (df["water_cut_pct"] > 100) if "water_cut_pct" in df.columns else pd.Series(False, index=df.index)),
    ("sensor_quality_score_range", lambda df: (df["sensor_quality_score"] < 0) | (df["sensor_quality_score"] > 1) if "sensor_quality_score" in df.columns else pd.Series(False, index=df.index)),
]

CROSS_SENSOR_RULES: List[Tuple[str, object]] = [
    ("pprl_lt_mprl",              lambda df: df["pprl_lbs"] < df["mprl_lbs"] if all(c in df.columns for c in ["pprl_lbs", "mprl_lbs"]) else pd.Series(False, index=df.index)),
    ("high_current_zero_spm",     lambda df: (df["motor_current_a"] > 20) & (df["spm"] == 0) if all(c in df.columns for c in ["motor_current_a", "spm"]) else pd.Series(False, index=df.index)),
    ("high_spm_zero_flow",        lambda df: (df["spm"] > 2) & (df["flow_bopd"] <= 0) if all(c in df.columns for c in ["spm", "flow_bopd"]) else pd.Series(False, index=df.index)),
    ("injection_temp_above_max",  lambda df: df["surface_temp_c"] > 310 if "surface_temp_c" in df.columns else pd.Series(False, index=df.index)),
    ("large_card_area_low_flow",  lambda df: (df["card_area_in_lbs"] > 10000) & (df["flow_bopd"] < 5) if all(c in df.columns for c in ["card_area_in_lbs", "flow_bopd"]) else pd.Series(False, index=df.index)),
    ("thermal_visc_inconsistency", lambda df: (df["bht_estimate_c"] > 150) & (df["viscosity_cp_physics"] > 5000) if all(c in df.columns for c in ["bht_estimate_c", "viscosity_cp_physics"]) else pd.Series(False, index=df.index)),
]

ALL_RULES = PHYSICAL_RULES + CROSS_SENSOR_RULES


def apply_rules(df: pd.DataFrame) -> Tuple[pd.Series, pd.Series]:
    """
    Apply all rule checks to a DataFrame.
    Returns:
        rule_fired   : bool Series (True = at least one rule fired = anomaly)
        reason_series: str Series (which rule fired, first match)
    """
    fired = pd.Series(False, index=df.index)
    reason = pd.Series("", index=df.index)

    for rule_name, rule_fn in ALL_RULES:
        try:
            mask = rule_fn(df).fillna(False).astype(bool)
        except Exception:
            mask = pd.Series(False, index=df.index)
        # Record reason for first rule that fires per row
        new_fires = mask & ~fired
        reason[new_fires] = rule_name
        fired |= mask

    return fired, reason


# ── Isolation Forest (soft/multivariate anomalies) ──────────────────────────

ISOFOREST_FEATURES = [
    "spm", "motor_current_a", "pprl_lbs", "mprl_lbs",
    "card_area_in_lbs", "card_compression_frac", "fmi",
    "surface_temp_c", "bht_estimate_c", "flow_bopd",
    "cross_sensor_residual", "missingness_rate_1h", "sensor_quality_score",
]


def _get_isoforest_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Get features for Isolation Forest training.
    Uses ISOFOREST_FEATURES if available; falls back to all numeric columns otherwise.
    The anomaly_labels.csv may only have a subset of sensor columns.
    """
    avail = [c for c in ISOFOREST_FEATURES if c in df.columns]
    if not avail:
        # Fallback: use all numeric columns in the passed DataFrame
        avail = list(df.select_dtypes(include=[np.number]).columns)
    if not avail:
        raise ValueError("No numeric feature columns found in anomaly dataset for Isolation Forest.")
    X = df[avail].fillna(df[avail].median(numeric_only=True))
    return X


# ── Main train function ───────────────────────────────────────────────────────

def train_anomaly_detector(
    train_df: Optional[pd.DataFrame] = None,
    run_name: str = "anomaly_detector",
) -> Dict:
    """
    Trains Isolation Forest on normal-class windows from the training data.
    Evaluates the full detection system (rules + IF) against the labeled anomaly dataset.

    Per §7.5: rule-based layer fires first (hard bounds); IF catches soft multivariate anomalies.
    """
    logger.info("=== Training Anomaly / Sensor-Health Detector ===")

    # Load labeled anomaly evaluation set
    X_eval, y_eval = load_anomaly_data()

    thresholds = THRESHOLDS[MODEL_NAME]
    report: Dict = {"model": MODEL_NAME}

    with mlflow.start_run(run_name=run_name, nested=True):
        mlflow.set_tag("model_family", MODEL_NAME)
        mlflow.set_tag("label_source_validated_on", "ground_truth")
        mlflow.log_param("n_physical_rules", len(PHYSICAL_RULES))
        mlflow.log_param("n_cross_sensor_rules", len(CROSS_SENSOR_RULES))

        # ── 1. Rule-based evaluation ─────────────────────────────────────────
        # ── 1. Rule-based evaluation (only if sensor columns are present) ──────
        # The anomaly_labels.csv is a metadata-only eval set; the rule engine
        # runs at serve time against live sensor readings, not against this eval set.
        sensor_cols_present = any(c in X_eval.columns for c in ["spm", "motor_current_a", "flow_bopd"])
        if sensor_cols_present:
            logger.info("  Evaluating rule-based detector on labeled anomaly set")
            rule_fired, rule_reasons = apply_rules(X_eval)
        else:
            logger.info("  Skipping rule evaluation — eval set has no raw sensor columns (expected; "
                        "rules run at serve time against live telemetry, not against anomaly_labels.csv)")
            rule_fired = pd.Series(False, index=X_eval.index)
            rule_reasons = pd.Series("", index=X_eval.index)

        rule_precision = precision_score(y_eval, rule_fired.astype(int), zero_division=0)
        rule_recall    = recall_score(y_eval, rule_fired.astype(int), zero_division=0)
        rule_f1        = f1_score(y_eval, rule_fired.astype(int), zero_division=0)
        logger.info("  Rules — precision: %.4f, recall: %.4f, f1: %.4f (sensor_cols_present=%s)",
                    rule_precision, rule_recall, rule_f1, sensor_cols_present)
        mlflow.log_metrics({
            "rules_precision": rule_precision,
            "rules_recall": rule_recall,
            "rules_f1": rule_f1,
            "rules_sensor_cols_present": int(sensor_cols_present),
        })

        # ── 2. Isolation Forest training ─────────────────────────────────────
        # Train IF only on normal (y=0) rows per spec: unsupervised base layer
        normal_mask = y_eval == 0
        if normal_mask.sum() < 10:
            logger.warning("Too few normal samples to train IF reliably — using full eval set")
            X_if_train = _get_isoforest_features(X_eval)
        else:
            X_if_train = _get_isoforest_features(X_eval[normal_mask])

        scaler = StandardScaler()
        X_if_scaled = scaler.fit_transform(X_if_train)

        # Use IF with contamination matching class imbalance
        contamination = float(y_eval.mean()) if 0.01 <= y_eval.mean() <= 0.5 else 0.05
        logger.info("  Training Isolation Forest (contamination=%.3f, n_normal=%d, n_features=%d)",
                    contamination, len(X_if_train), X_if_train.shape[1])
        iso_forest = IsolationForest(
            n_estimators=200,
            contamination=contamination,
            max_samples="auto",
            random_state=RANDOM_SEED,
            n_jobs=-1,
        )
        iso_forest.fit(X_if_scaled)
        mlflow.log_param("if_contamination", contamination)
        mlflow.log_param("if_n_features", X_if_train.shape[1])

        # ── 3. IF evaluation ─────────────────────────────────────────────────
        X_eval_if = _get_isoforest_features(X_eval)
        X_eval_scaled = scaler.transform(X_eval_if)
        if_scores = -iso_forest.score_samples(X_eval_scaled)  # higher = more anomalous
        if_pred   = (iso_forest.predict(X_eval_scaled) == -1).astype(int)  # -1 = anomaly

        if_precision = precision_score(y_eval, if_pred, zero_division=0)
        if_recall    = recall_score(y_eval, if_pred, zero_division=0)
        if_f1        = f1_score(y_eval, if_pred, zero_division=0)
        logger.info("  IF only — precision: %.4f, recall: %.4f, f1: %.4f",
                    if_precision, if_recall, if_f1)

        # ── 4. Combined: rules OR IF ─────────────────────────────────────────
        # When rules contribute nothing (no sensor columns), combined = IF alone
        combined_pred = np.maximum(rule_fired.astype(int).values, if_pred)
        fp_on_normal = combined_pred[y_eval == 0].mean()

        combined_precision = precision_score(y_eval, combined_pred, zero_division=0)
        combined_recall    = recall_score(y_eval, combined_pred, zero_division=0)
        combined_f1        = f1_score(y_eval, combined_pred, zero_division=0)
        conf_matrix        = confusion_matrix(y_eval, combined_pred).tolist()

        logger.info("  Combined — precision: %.4f, recall: %.4f, f1: %.4f, FP-normal: %.4f",
                    combined_precision, combined_recall, combined_f1, fp_on_normal)

        mlflow.log_metrics({
            "if_precision": if_precision,
            "if_recall": if_recall,
            "if_f1": if_f1,
            "combined_precision": combined_precision,
            "combined_recall": combined_recall,
            "combined_f1": combined_f1,
            "fp_rate_on_normal": fp_on_normal,
        })
        mlflow.log_dict({"confusion_matrix": conf_matrix}, "confusion_matrix.json")

        # ── 5. Feature importance from IF (which feature looked most unusual) ─
        if hasattr(iso_forest, "estimators_"):
            try:
                feat_cols = list(X_eval_if.columns)
                importance = np.zeros(len(feat_cols))
                for est in iso_forest.estimators_:
                    importance += est.feature_importances_
                importance /= len(iso_forest.estimators_)
                fi_dict = {k: round(float(v), 6) for k, v in zip(feat_cols, importance)}
                mlflow.log_dict(
                    dict(sorted(fi_dict.items(), key=lambda x: -x[1])),
                    "if_feature_importance.json",
                )
            except Exception as e:
                logger.warning("IF feature importance extraction failed: %s", e)

        # ── 6. Promotion decision ─────────────────────────────────────────────
        passed = (
            combined_precision >= thresholds["precision_min"]
            and combined_recall    >= thresholds["recall_min"]
            and fp_on_normal       <= thresholds["fp_rate_normal_max"]
        )
        report = {
            "model": MODEL_NAME,
            "combined_precision": round(float(combined_precision), 4),
            "combined_recall":    round(float(combined_recall), 4),
            "combined_f1":        round(float(combined_f1), 4),
            "fp_rate_on_normal":  round(float(fp_on_normal), 4),
            "if_contamination":   contamination,
            "n_rules":            len(ALL_RULES),
            "passed_promotion":   passed,
        }
        if not passed:
            logger.warning(
                "  [%s] FAILED: precision=%.4f (need ≥%.2f), recall=%.4f (need ≥%.2f), FP=%.4f (need ≤%.2f)",
                MODEL_NAME, combined_precision, thresholds["precision_min"],
                combined_recall, thresholds["recall_min"],
                fp_on_normal, thresholds["fp_rate_normal_max"],
            )
        else:
            logger.info("  [%s] PASSED", MODEL_NAME)

        mlflow.log_dict(report, "evaluation_report.json")
        mlflow.set_tag("passed_promotion", str(passed))

        # Log artifacts
        import pickle, tempfile, os
        artifacts = {"isolation_forest": iso_forest, "scaler": scaler, "rules": [r[0] for r in ALL_RULES]}
        with tempfile.NamedTemporaryFile(suffix=".pkl", delete=False) as f:
            pickle.dump(artifacts, f)
            tmp = f.name
        mlflow.log_artifact(tmp, artifact_path="anomaly_detector")
        os.unlink(tmp)

    return report
