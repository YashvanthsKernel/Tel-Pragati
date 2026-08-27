"""
Baghewala Digital Twin — Shared Feature Engineering Module
This is the SINGLE implementation used by both training and serving to prevent train/serve skew.
Per architecture spec §6.3: every feature is point-in-time correct (trailing windows only).
"""
from __future__ import annotations

import logging
from typing import List, Tuple

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# ── Canonical feature groups (Section 6.1) ───────────────────────────────────

THERMAL_FEATURES = [
    "surface_temp_c", "bht_estimate_c", "dBHT_dt_1h", "dBHT_dt_6h",
    "viscosity_cp_physics", "visc_ratio_vs_peak", "thermal_viscosity_index",
]

MECHANICAL_FEATURES = [
    "spm", "stroke_len_in", "vfd_pct", "motor_current_a",
    "motor_current_rolling_std_1h", "spm_x_visc_interaction",
]

DYNAMOMETER_FEATURES = [
    "pprl_lbs", "mprl_lbs", "card_area_in_lbs", "card_compression_frac",
    "fmi", "downstroke_compression_index",
    "fourier_h1", "fourier_h2", "fourier_h3", "fourier_h4",
]

PRODUCTION_FEATURES = [
    "flow_bopd", "flow_bopd_lag_1h", "flow_bopd_lag_6h", "flow_bopd_lag_24h",
    "flow_bopd_rolling_mean_24h", "flow_bopd_rolling_std_24h", "water_cut_pct",
]

CSS_CONTEXT_FEATURES = [
    "days_since_injection", "cumulative_steam_volume_m3",
    "prior_cycle_peak_bht_c", "time_since_last_phase_transition_h",
    "phase_transition_active",
]

HISTORY_FEATURES = [
    "days_since_last_failure", "failure_count_trailing_180d", "well_age_days",
]

QUALITY_FEATURES = [
    "sensor_quality_score", "cross_sensor_residual", "missingness_rate_1h",
]

# ── Feature sets by model (model → which groups) ─────────────────────────────

MODEL_FEATURE_SETS = {
    "production_forecaster": (
        THERMAL_FEATURES + MECHANICAL_FEATURES + PRODUCTION_FEATURES + CSS_CONTEXT_FEATURES
    ),
    "viscosity_corrector": (
        THERMAL_FEATURES + MECHANICAL_FEATURES
    ),
    "dynamometer_classifier": (
        DYNAMOMETER_FEATURES + ["viscosity_cp_physics", "spm", "stroke_len_in"]
    ),
    "failure_risk": (
        MECHANICAL_FEATURES + DYNAMOMETER_FEATURES + HISTORY_FEATURES
    ),
    "anomaly_detector": (
        QUALITY_FEATURES + MECHANICAL_FEATURES + THERMAL_FEATURES
    ),
}


def get_feature_columns(model_name: str, available_cols: List[str]) -> List[str]:
    """
    Return the intersection of a model's feature spec and available columns.
    Warns (doesn't crash) on missing columns, per the architecture's resilience principle.
    """
    wanted = MODEL_FEATURE_SETS.get(model_name, [])
    missing = [c for c in wanted if c not in available_cols]
    if missing:
        logger.warning("[%s] Missing feature columns (will be skipped): %s", model_name, missing)
    return [c for c in wanted if c in available_cols]


def add_phase_dummies(df: pd.DataFrame) -> pd.DataFrame:
    """
    One-hot encode the 'phase' column (drop_first avoids perfect collinearity).
    Returns a copy with phase_* columns added and original 'phase' dropped.
    """
    if "phase" not in df.columns:
        return df
    phase_dummies = pd.get_dummies(df["phase"], prefix="phase", drop_first=True, dtype=float)
    return pd.concat([df.drop(columns=["phase"]), phase_dummies], axis=1)


def impute_median(df: pd.DataFrame, cols: List[str]) -> pd.DataFrame:
    """Impute NaNs in specified numeric columns with per-column training-set median."""
    for c in cols:
        if c in df.columns and df[c].isna().any():
            df[c] = df[c].fillna(df[c].median())
    return df


def build_feature_matrix(
    df: pd.DataFrame,
    model_name: str,
    include_phase: bool = True,
) -> Tuple[pd.DataFrame, List[str]]:
    """
    Build (X, final_feature_names) for a given model from a canonical WellState DataFrame.
    This is the shared implementation — call it identically in training and serving.

    Returns:
        X                 : imputed, ready-to-train feature matrix
        final_feat_names  : column names in X (for SHAP explainability)
    """
    feat_cols = get_feature_columns(model_name, list(df.columns))
    X = df[feat_cols].copy()

    # Phase dummies added for all models except dynamometer (pure card features)
    if include_phase and "phase" in df.columns and model_name != "dynamometer_classifier":
        phase_dummies = pd.get_dummies(df["phase"], prefix="phase", drop_first=True, dtype=float)
        X = pd.concat([X, phase_dummies], axis=1)

    X = impute_median(X, list(X.columns))
    return X, list(X.columns)


# ── Dynamometer: special path for raw card curves ────────────────────────────

def parse_card_curve(raw_str: str) -> np.ndarray:
    """
    Parse a card trace stored as a stringified list, e.g. '[1.2, 3.4, ...]'.
    Returns an ndarray; empty array on parse error.
    """
    try:
        import ast
        vals = ast.literal_eval(raw_str)
        return np.array(vals, dtype=np.float32)
    except Exception:
        return np.array([], dtype=np.float32)


def resample_card(arr: np.ndarray, n_points: int = 200) -> np.ndarray:
    """
    Resample a 1-D card trace to exactly n_points using linear interpolation.
    Per spec §7.3: every card → fixed 200-point sequence for CNN challenger.
    """
    if len(arr) == 0:
        return np.zeros(n_points, dtype=np.float32)
    x_old = np.linspace(0, 1, len(arr))
    x_new = np.linspace(0, 1, n_points)
    return np.interp(x_new, x_old, arr).astype(np.float32)
