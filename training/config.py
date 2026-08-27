"""
Baghewala Digital Twin — Training Pipeline Configuration
All dataset paths, GPU settings, HPO budgets, and promotion thresholds in one place.
"""
from pathlib import Path
import os

# ── Root paths ──────────────────────────────────────────────────────────────
REPO_ROOT     = Path("D:/Tel Pragati")
DATASET_DIR   = REPO_ROOT / "dataset"
TRAINING_DIR  = REPO_ROOT / "training"
MODELS_DIR    = TRAINING_DIR / "models"
REPORTS_DIR   = TRAINING_DIR / "reports"
MODEL_CARDS_DIR = TRAINING_DIR / "model_cards"

# ── Dataset files ────────────────────────────────────────────────────────────
ML_FEATURES_CSV      = DATASET_DIR / "ml_training_features.csv"
DYNO_CARDS_CSV       = DATASET_DIR / "srp_dynamometer_cards.csv"
ANOMALY_LABELS_CSV   = DATASET_DIR / "anomaly_labels.csv"
MAINTENANCE_CSV      = DATASET_DIR / "maintenance_failure_logs.csv"
SENSOR_TELEMETRY_CSV = DATASET_DIR / "sensor_telemetry_5min.csv"
CSS_PRODUCTION_CSV   = DATASET_DIR / "css_production_daily.csv"
WELL_METADATA_CSV    = DATASET_DIR / "well_metadata.csv"
CSS_CYCLES_CSV       = DATASET_DIR / "css_cycle_records.csv"
OPTIMIZATION_CSV     = DATASET_DIR / "optimization_scenarios.csv"

# ── MLflow ───────────────────────────────────────────────────────────────────
MLFLOW_TRACKING_URI  = f"sqlite:///{TRAINING_DIR / 'mlflow.db'}"   # SQLite backend (MLflow 3.x compatible)
EXPERIMENT_NAME      = "baghewala_digital_twin"

# ── GPU / Device ─────────────────────────────────────────────────────────────
# XGBoost: "hist" on CPU, "hist" + device="cuda" on GPU
# LightGBM: device="cpu" or "gpu" (requires LightGBM built with GPU support)
# Auto-detect: set FORCE_CPU=1 env var to disable GPU
def _xgb_device() -> str:
    if os.environ.get("FORCE_CPU", "0") == "1":
        return "cpu"
    try:
        import xgboost as xgb
        d = xgb.DMatrix([[1, 2]], label=[0])
        xgb.train({"tree_method": "hist", "device": "cuda", "verbosity": 0}, d, num_boost_round=1)
        return "cuda"
    except Exception:
        return "cpu"

def _lgb_device() -> str:
    if os.environ.get("FORCE_CPU", "0") == "1":
        return "cpu"
    try:
        import lightgbm as lgb
        ds = lgb.Dataset([[1, 2]], label=[0])
        lgb.train({"device": "gpu", "num_leaves": 4, "verbose": -1}, ds, num_boost_round=1)
        return "gpu"
    except Exception:
        return "cpu"

# Resolved once at import time — avoids repeated GPU probing
XGB_DEVICE = _xgb_device()
LGB_DEVICE = _lgb_device()

# ── Optuna HPO ───────────────────────────────────────────────────────────────
OPTUNA_N_TRIALS        = 50
OPTUNA_TIMEOUT_SECONDS = 3600          # 1-hour hard cap per model
OPTUNA_DIRECTION       = "minimize"    # objectives are all loss/error metrics
RANDOM_SEED            = 42

# ── Train / Val / Test split ratios ──────────────────────────────────────────
TRAIN_RATIO = 0.70
VAL_RATIO   = 0.15
TEST_RATIO  = 0.15

# ── Promotion thresholds (per architecture spec) ──────────────────────────────
THRESHOLDS = {
    "production_forecaster": {
        "p50_mae_improvement_vs_persistence_pct": 15.0,
        "coverage_interval_low_pct": 80.0,
        "coverage_interval_high_pct": 96.0,
    },
    "viscosity_corrector": {
        "mae_improvement_vs_physics_pct": 10.0,
    },
    "dynamometer_classifier": {
        "macro_f1_min": 0.85,
        "rod_floating_recall_min": 0.90,
    },
    "failure_risk": {
        "auc_min": 0.80,
        "brier_score_max": 0.15,
    },
    "anomaly_detector": {
        "precision_min": 0.90,
        "recall_min": 0.85,
        "fp_rate_normal_max": 0.02,
    },
}
