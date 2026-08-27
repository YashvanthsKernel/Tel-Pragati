"""
Baghewala Digital Twin — Data Loader
Loads and validates each dataset, enforces point-in-time correctness for splits.
"""
from __future__ import annotations

import logging
import warnings
from pathlib import Path
from typing import Tuple, Dict, Any

import numpy as np
import pandas as pd

from config import (
    ML_FEATURES_CSV, DYNO_CARDS_CSV, ANOMALY_LABELS_CSV,
    MAINTENANCE_CSV, SENSOR_TELEMETRY_CSV, TRAIN_RATIO, VAL_RATIO,
    RANDOM_SEED,
)

logger = logging.getLogger(__name__)

# ── Helper ────────────────────────────────────────────────────────────────────

def _read(path: Path, **kwargs) -> pd.DataFrame:
    """Skip metadata comment lines (lines starting with '#')."""
    df = pd.read_csv(path, comment="#", **kwargs)
    df.columns = df.columns.str.strip()
    return df


# ── Main feature dataset ──────────────────────────────────────────────────────

FEATURE_COLS = [
    # Thermal
    "surface_temp_c", "bht_estimate_c", "dBHT_dt_1h", "dBHT_dt_6h",
    "viscosity_cp_physics", "visc_ratio_vs_peak", "thermal_viscosity_index",
    # Mechanical
    "spm", "stroke_len_in", "vfd_pct", "motor_current_a",
    "motor_current_rolling_std_1h", "spm_x_visc_interaction",
    # Dynamometer
    "pprl_lbs", "mprl_lbs", "card_area_in_lbs", "card_compression_frac",
    "fmi", "downstroke_compression_index",
    "fourier_h1", "fourier_h2", "fourier_h3", "fourier_h4",
    # Production
    "flow_bopd", "flow_bopd_lag_1h", "flow_bopd_lag_6h", "flow_bopd_lag_24h",
    "flow_bopd_rolling_mean_24h", "flow_bopd_rolling_std_24h", "water_cut_pct",
    # CSS context
    "days_since_injection", "cumulative_steam_volume_m3",
    "prior_cycle_peak_bht_c", "time_since_last_phase_transition_h",
    "phase_transition_active",
    # History
    "days_since_last_failure", "failure_count_trailing_180d", "well_age_days",
    # Quality
    "sensor_quality_score", "cross_sensor_residual", "missingness_rate_1h",
]

TARGET_COLS = [
    "target_flow_bopd_1h", "target_flow_bopd_6h", "target_flow_bopd_24h",
    "target_viscosity_residual", "target_card_class",
    "target_failure_7d", "target_failure_30d", "target_rod_floating_risk",
]

# One-hot encode the phase column separately
CATEGORICAL_COLS = ["phase"]


def load_ml_features() -> pd.DataFrame:
    """Load ml_training_features.csv, do basic sanity checks, return full df."""
    logger.info("Loading ML features from %s", ML_FEATURES_CSV)
    df = _read(ML_FEATURES_CSV)

    # Basic sanity
    assert "split" in df.columns, "Expected a 'split' column in ml_training_features.csv"
    missing_feats = [c for c in FEATURE_COLS if c not in df.columns]
    if missing_feats:
        warnings.warn(f"Missing feature columns (will be skipped): {missing_feats}")
        FEATURE_COLS[:] = [c for c in FEATURE_COLS if c in df.columns]

    missing_targets = [c for c in TARGET_COLS if c not in df.columns]
    if missing_targets:
        warnings.warn(f"Missing target columns: {missing_targets}")

    logger.info("ML features shape: %s", df.shape)
    return df


def get_feature_matrix(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, pd.Series]]:
    """
    Returns (X, targets_dict) where X has numeric features + phase dummies,
    and targets_dict maps target_name → Series.
    """
    # Phase one-hot (drop_first avoids collinearity)
    phase_dummies = pd.get_dummies(df["phase"], prefix="phase", drop_first=True)

    avail_feats = [c for c in FEATURE_COLS if c in df.columns]
    X = pd.concat([df[avail_feats].copy(), phase_dummies], axis=1)
    X = X.fillna(X.median(numeric_only=True))   # impute remaining NaNs

    targets = {t: df[t] for t in TARGET_COLS if t in df.columns}
    return X, targets


def split_by_predefined(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Use the 'split' column baked into the dataset (train / val / test)."""
    train = df[df["split"] == "train"].copy()
    val   = df[df["split"] == "val"].copy()
    test  = df[df["split"] == "test"].copy()
    logger.info("Split sizes — train: %d, val: %d, test: %d", len(train), len(val), len(test))
    return train, val, test


# ── Dynamometer dataset ───────────────────────────────────────────────────────

DYNO_SCALAR_COLS = [
    "pprl_lbs", "mprl_lbs", "card_area_in_lbs", "card_compression_frac",
    "fmi", "fourier_h1", "fourier_h2", "fourier_h3", "fourier_h4",
    "spm", "stroke_length_in", "viscosity_cp_estimated",
    "downstroke_compression_index",
]
DYNO_TARGET_COL = "downhole_card_class"  # from dataset; map aliases below

CLASS_MAP = {
    "Normal": 0,
    "Rod_Floating": 1,
    "Fluid_Pound": 2,
    "Gas_Interference": 3,
    "Traveling_Valve_Leak": 4,
}


def load_dynamometer() -> Tuple[pd.DataFrame, pd.Series]:
    """Returns (X_scalar, y_encoded) for the dynamometer classifier."""
    logger.info("Loading dynamometer cards from %s", DYNO_CARDS_CSV)
    df = _read(DYNO_CARDS_CSV)

    # Find the class column (may be named differently)
    class_col = next(
        (c for c in df.columns if "class" in c.lower() or "condition" in c.lower()),
        None,
    )
    if class_col is None:
        raise ValueError(f"No class column found in dyno dataset. Columns: {list(df.columns)}")

    avail_scalar = [c for c in DYNO_SCALAR_COLS if c in df.columns]
    X = df[avail_scalar].fillna(df[avail_scalar].median(numeric_only=True))

    # Encode labels
    y_raw = df[class_col].astype(str).str.strip()
    y = y_raw.map(CLASS_MAP)
    if y.isna().any():
        unknown = y_raw[y.isna()].unique()
        logger.warning("Unknown class labels: %s — dropping those rows", unknown)
        mask = ~y.isna()
        X, y = X[mask], y[mask]

    logger.info("Dyno dataset shape: X=%s, classes=%s", X.shape, y.value_counts().to_dict())
    return X.reset_index(drop=True), y.astype(int).reset_index(drop=True)


def dyno_train_val_test_split(X: pd.DataFrame, y: pd.Series):
    """Stratified split on class labels."""
    from sklearn.model_selection import train_test_split
    X_tr, X_tmp, y_tr, y_tmp = train_test_split(
        X, y, test_size=(1 - TRAIN_RATIO), random_state=RANDOM_SEED, stratify=y
    )
    val_frac = VAL_RATIO / (VAL_RATIO + 0.15)
    X_va, X_te, y_va, y_te = train_test_split(
        X_tmp, y_tmp, test_size=0.5, random_state=RANDOM_SEED, stratify=y_tmp
    )
    return X_tr, X_va, X_te, y_tr, y_va, y_te


# ── Anomaly dataset ───────────────────────────────────────────────────────────

def load_anomaly_data(telemetry_df: pd.DataFrame | None = None) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Returns (X_anomaly, y_binary) where y=1 means anomaly.
    Uses the pre-labeled anomaly_labels.csv as the evaluation set.
    For Isolation Forest training we use sensor_telemetry (normal windows).
    """
    logger.info("Loading anomaly labels from %s", ANOMALY_LABELS_CSV)
    df = _read(ANOMALY_LABELS_CSV)

    feature_cols = [c for c in df.columns if c not in
                    ["anomaly_id", "well_id", "ts_start", "ts_end",
                     "anomaly_type", "affected_sensor", "is_anomaly",
                     "rule_triggered", "description", "label_source"]]
    X = df[feature_cols].select_dtypes(include=[np.number])
    X = X.fillna(X.median(numeric_only=True))
    y = df["is_anomaly"].astype(int)

    logger.info("Anomaly dataset: %s (anomaly=%d, normal=%d)", X.shape, y.sum(), (y == 0).sum())
    return X, y


# ── Maintenance / Failure dataset ─────────────────────────────────────────────

FAILURE_FEATURE_COLS = [
    "preceding_fmi", "preceding_viscosity_cp", "preceding_spm",
    "preceding_motor_current_a",
]


def load_failure_data() -> Tuple[pd.DataFrame, pd.Series]:
    """Simple failure-risk feature set from maintenance logs (weak labels)."""
    logger.info("Loading maintenance logs from %s", MAINTENANCE_CSV)
    df = _read(MAINTENANCE_CSV)
    avail = [c for c in FAILURE_FEATURE_COLS if c in df.columns]
    X = df[avail].fillna(df[avail].median(numeric_only=True))

    # Binary: critical event = 1 (rod_failure or tubing_split), else 0
    if "severity" in df.columns:
        y = df["severity"].str.lower().str.contains("critical").astype(int)
    elif "event_type" in df.columns:
        y = df["event_type"].str.lower().isin(["rod_failure", "tubing_split"]).astype(int)
    else:
        y = pd.Series(np.zeros(len(df), dtype=int))

    logger.info("Failure dataset: %d samples (failure=%d)", len(df), y.sum())
    return X.reset_index(drop=True), y.reset_index(drop=True)
