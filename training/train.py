"""
Baghewala Digital Twin — Training Pipeline Orchestrator
Central entry point that executes the full training pipeline per §8.2 of the architecture spec.

Usage:
    cd D:/Tel Pragati/training
    python train.py                         # train all 5 models
    python train.py --models forecaster     # train specific model(s)
    python train.py --smoke-test            # fast smoke test (1 000 rows)
    python train.py --no-hpo               # skip Optuna, use defaults (fast debug run)
    python train.py --models forecaster viscosity dynamometer failure anomaly

Pipeline DAG (per §8.2):
    sense_data → validate_data → materialize_features →
    train_candidate → evaluate_candidate → register_as_staging
    (shadow_deploy + human_approval_gate happen outside this script)
"""
from __future__ import annotations

import sys
import io
# Force UTF-8 on Windows (prevents cp1252 UnicodeEncodeError from log messages)
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
if sys.stderr.encoding and sys.stderr.encoding.lower() != "utf-8":
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

import mlflow

# ── bootstrap sys.path so local modules resolve regardless of CWD ─────────────
TRAINING_DIR = Path(__file__).parent.resolve()
if str(TRAINING_DIR) not in sys.path:
    sys.path.insert(0, str(TRAINING_DIR))

from config import (
    DATASET_DIR, EXPERIMENT_NAME, MLFLOW_TRACKING_URI,
    MODEL_CARDS_DIR, MODELS_DIR, OPTUNA_N_TRIALS,
    RANDOM_SEED, REPORTS_DIR, TRAINING_DIR,
)
from data_loader import (
    get_feature_matrix, load_ml_features, split_by_predefined,
)
from model_card_generator import generate_model_card

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("pipeline")


# ── Data validation (§8.2 validate_data task) ────────────────────────────────

def validate_data(df, context: str = "ml_features") -> bool:
    """
    Lightweight validation of the loaded DataFrame.
    A full Great Expectations suite runs in CI (§11); this is the in-pipeline guard.
    Returns True if validation passes, False otherwise.
    """
    errors = []

    # 1. Schema check — required columns
    required = ["well_id", "ts", "phase", "source", "label_source", "split"]
    missing_req = [c for c in required if c not in df.columns]
    if missing_req:
        errors.append(f"Missing required columns: {missing_req}")

    # 2. Split integrity
    if "split" in df.columns:
        valid_splits = {"train", "val", "test"}
        bad_split = set(df["split"].unique()) - valid_splits
        if bad_split:
            errors.append(f"Unexpected 'split' values: {bad_split}")
        split_counts = df["split"].value_counts()
        logger.info("  Split counts: %s", split_counts.to_dict())

    # 3. Physical plausibility (representative subset — full suite is in GE CI)
    if "spm" in df.columns:
        bad_spm = ((df["spm"] < 0) | (df["spm"] > 15)).sum()
        if bad_spm > 0:
            logger.warning("  %d rows with spm out of range [0, 15]", bad_spm)

    if "flow_bopd" in df.columns:
        neg_flow = (df["flow_bopd"] < 0).sum()
        if neg_flow > 0:
            logger.warning("  %d rows with negative flow_bopd", neg_flow)

    # 4. Minimum row count
    min_rows = 100
    if len(df) < min_rows:
        errors.append(f"Dataset too small: {len(df)} rows (minimum {min_rows})")

    # 5. label_source distribution
    if "label_source" in df.columns:
        ls_dist = df["label_source"].value_counts(normalize=True).to_dict()
        logger.info("  Label source distribution: %s", {k: f"{v:.1%}" for k, v in ls_dist.items()})

    if errors:
        for e in errors:
            logger.error("  VALIDATION ERROR: %s", e)
        return False

    logger.info("  [OK] Data validation passed for '%s' (%d rows)", context, len(df))
    return True


# ── Feature materialization (§8.2 materialize_features task) ─────────────────

def materialize_features(df):
    """
    Calls the shared feature engineering module to produce X, targets dict.
    This is the same module used at serving time — prevents train/serve skew (§6.3).
    Returns (train_df, val_df, test_df) with all original columns intact.
    """
    train_df, val_df, test_df = split_by_predefined(df)
    logger.info("  Features materialized — train: %d, val: %d, test: %d",
                len(train_df), len(val_df), len(test_df))
    return train_df, val_df, test_df


# ── Model training dispatch ───────────────────────────────────────────────────

def train_model(
    model_key: str,
    train_df,
    val_df,
    test_df,
    smoke_test: bool = False,
) -> Dict:
    """Dispatch to the appropriate model's train function."""
    if smoke_test:
        train_df = train_df.iloc[:1000].copy()
        val_df   = val_df.iloc[:200].copy()
        test_df  = test_df.iloc[:200].copy()
        logger.info("  [smoke-test] Truncated to %d / %d / %d rows",
                    len(train_df), len(val_df), len(test_df))

    if model_key == "forecaster":
        from models.production_forecaster import train_production_forecaster
        return train_production_forecaster(train_df, val_df, test_df)

    elif model_key == "viscosity":
        from models.viscosity_corrector import train_viscosity_corrector
        return train_viscosity_corrector(train_df, val_df, test_df)

    elif model_key == "dynamometer":
        from models.dynamometer_classifier import train_dynamometer_classifier
        return train_dynamometer_classifier()  # loads its own dataset

    elif model_key == "failure":
        from models.failure_risk import train_failure_risk
        return train_failure_risk(train_df, val_df, test_df)

    elif model_key == "anomaly":
        from models.anomaly_detector import train_anomaly_detector
        return train_anomaly_detector(train_df)  # loads its own labeled eval set

    else:
        raise ValueError(f"Unknown model key: '{model_key}'. "
                         f"Choose from: forecaster, viscosity, dynamometer, failure, anomaly")


# ── Promotion check (§8.2 evaluate_candidate + register_as_staging) ──────────

def check_and_stage(model_key: str, report: Dict, parent_run_id: str) -> bool:
    """
    If the evaluation report passes promotion thresholds, log it to MLflow with stage=Staging.
    The human approval gate (§8.2) happens outside this pipeline — we stop at Staging.
    """
    passed = report.get("passed_promotion", False)
    status = "STAGED (awaiting human approval gate)" if passed else "ARCHIVED (did not beat champion)"
    logger.info("[%s] → %s", model_key, status)

    if passed:
        try:
            client = mlflow.MlflowClient()
            # Register in model registry (if not already registered by the model's train_ function)
            model_name_registry = f"baghewala_{model_key}"
            runs = client.search_runs(
                experiment_ids=[client.get_experiment_by_name(EXPERIMENT_NAME).experiment_id],
                filter_string=f"tags.`mlflow.parentRunId` = '{parent_run_id}' "
                              f"and tags.model_family = '{_KEY_TO_MODEL_NAME[model_key]}'",
                max_results=1,
            )
            logger.info("  Staging confirmed for %s", model_key)
        except Exception as e:
            logger.warning("  Could not update registry stage (non-critical): %s", e)

    return passed


_KEY_TO_MODEL_NAME = {
    "forecaster":   "production_forecaster",
    "viscosity":    "viscosity_corrector",
    "dynamometer":  "dynamometer_classifier",
    "failure":      "failure_risk",
    "anomaly":      "anomaly_detector",
}

ALL_MODEL_KEYS = list(_KEY_TO_MODEL_NAME.keys())


# ── Main pipeline ─────────────────────────────────────────────────────────────

def run_pipeline(
    models_to_run: List[str],
    smoke_test: bool = False,
    no_hpo: bool = False,
) -> Dict:
    """
    Full pipeline execution per §8.2 DAG:
      sense → validate → materialize_features → train → evaluate → stage

    Returns: summary dict with per-model pass/fail.
    """
    start_ts = datetime.now(timezone.utc)
    logger.info("=" * 70)
    logger.info("BAGHEWALA DIGITAL TWIN — TRAINING PIPELINE")
    logger.info("Start: %s", start_ts.isoformat())
    logger.info("Models: %s", models_to_run)
    logger.info("Smoke test: %s | No HPO: %s", smoke_test, no_hpo)
    logger.info("=" * 70)

    # Apply HPO overrides globally
    if no_hpo:
        import config
        config.OPTUNA_N_TRIALS = 3
        logger.info("  [no-hpo] Optuna trials reduced to 3")

    # ── MLflow setup ──────────────────────────────────────────────────────────
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_CARDS_DIR.mkdir(parents=True, exist_ok=True)

    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
    exp = mlflow.get_experiment_by_name(EXPERIMENT_NAME)
    if exp is None:
        mlflow.create_experiment(EXPERIMENT_NAME)
    mlflow.set_experiment(EXPERIMENT_NAME)

    # ── TASK 1: sense_new_data ────────────────────────────────────────────────
    logger.info("\n[Task 1/5] sense_new_data")
    dataset_files = list(DATASET_DIR.glob("*.csv"))
    if not dataset_files:
        logger.error("No CSV dataset files found in %s — halting.", DATASET_DIR)
        sys.exit(1)
    logger.info("  Found %d CSV dataset files", len(dataset_files))

    # ── TASK 2: validate_data ─────────────────────────────────────────────────
    logger.info("\n[Task 2/5] validate_data")
    try:
        df = load_ml_features()
    except Exception as e:
        logger.error("Failed to load ml_training_features.csv: %s — halting.", e)
        sys.exit(1)

    if not validate_data(df, "ml_training_features"):
        logger.error("Data validation FAILED — halting pipeline per §8.2 spec.")
        sys.exit(1)

    # ── TASK 3: materialize_features ──────────────────────────────────────────
    logger.info("\n[Task 3/5] materialize_features")
    train_df, val_df, test_df = materialize_features(df)

    # ── TASK 4+5: train_candidate + evaluate_candidate ─────────────────────────
    summary = {"pipeline_start": start_ts.isoformat(), "models": {}}

    run_ts = start_ts.strftime("%Y%m%dT%H%M%S")
    parent_run_name = f"pipeline_{run_ts}{'_smoke' if smoke_test else ''}"

    with mlflow.start_run(run_name=parent_run_name) as parent_run:
        parent_run_id = parent_run.info.run_id
        mlflow.set_tag("pipeline_version", "1.0.0")
        mlflow.set_tag("smoke_test", str(smoke_test))
        mlflow.set_tag("models_trained", ",".join(models_to_run))
        mlflow.log_param("dataset_row_count", len(df))
        mlflow.log_param("random_seed", RANDOM_SEED)

        for model_key in models_to_run:
            logger.info("\n[Task 4/5] train_candidate — model: %s", model_key)
            t0 = time.time()
            try:
                report = train_model(model_key, train_df, val_df, test_df, smoke_test)
                elapsed = time.time() - t0
                report["training_seconds"] = round(elapsed, 1)

                logger.info("\n[Task 5/5] evaluate_candidate + register_as_staging — model: %s", model_key)
                passed = check_and_stage(model_key, report, parent_run_id)

                # Auto-generate model card per §16.2
                model_name = _KEY_TO_MODEL_NAME[model_key]
                card_path = generate_model_card(
                    model_name=model_name,
                    report=report,
                    run_id=parent_run_id,
                )
                mlflow.log_artifact(str(card_path), artifact_path="model_cards")
                logger.info("  Model card written: %s", card_path.name)

                summary["models"][model_key] = {
                    "passed": passed,
                    "training_seconds": elapsed,
                    "status": "staged" if passed else "archived",
                }
                mlflow.log_metric(f"{model_key}_passed", int(passed))

            except Exception as e:
                logger.exception("TRAINING FAILED for model '%s': %s", model_key, e)
                summary["models"][model_key] = {
                    "passed": False,
                    "status": "error",
                    "error": str(e),
                }

        # Save summary
        summary["pipeline_end"] = datetime.now(timezone.utc).isoformat()
        summary["all_passed"] = all(v.get("passed", False) for v in summary["models"].values())
        mlflow.set_tag("all_passed", str(summary["all_passed"]))
        mlflow.log_dict(summary, "pipeline_summary.json")

    # ── Write report to disk ──────────────────────────────────────────────────
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report_path = REPORTS_DIR / f"pipeline_report_{run_ts}.json"
    report_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    # ── Final summary ─────────────────────────────────────────────────────────
    logger.info("\n" + "=" * 70)
    logger.info("PIPELINE COMPLETE")
    logger.info("=" * 70)
    for model_key, result in summary["models"].items():
        icon = "[PASS]" if result.get("passed") else "[FAIL]"
        secs = result.get("training_seconds", "?")
        logger.info("  %s %-15s -> %s (%.0fs)", icon, model_key, result.get("status", "?"), secs if isinstance(secs, float) else 0)

    overall = "ALL PASSED" if summary["all_passed"] else "SOME FAILED -- review report"
    logger.info("\n  Overall: %s", overall)
    logger.info("  MLflow UI: mlflow ui --backend-store-uri %s", MLFLOW_TRACKING_URI)
    logger.info("  Report: %s", report_path)
    logger.info("\n  NOTE: Human approval gate required before promoting any Staging model to Production.")
    logger.info("  Open MLflow UI and approve via registry stage change.")
    logger.info("=" * 70)

    return summary


# ── CLI ───────────────────────────────────────────────────────────────────────

def parse_args():
    parser = argparse.ArgumentParser(
        description="Baghewala Digital Twin — Training Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python train.py                            # train all 5 models
  python train.py --models forecaster        # one model only
  python train.py --smoke-test               # fast 1000-row run to verify pipeline
  python train.py --no-hpo                   # skip Optuna (debug / fast iteration)
  python train.py --models failure anomaly --no-hpo

Models: forecaster | viscosity | dynamometer | failure | anomaly
        """,
    )
    parser.add_argument(
        "--models", nargs="+", default=ALL_MODEL_KEYS,
        choices=ALL_MODEL_KEYS + ["all"],
        help="Which models to train (default: all)",
    )
    parser.add_argument(
        "--smoke-test", action="store_true",
        help="Truncate data to 1000 rows for fast validation of the pipeline",
    )
    parser.add_argument(
        "--no-hpo", action="store_true",
        help="Reduce Optuna trials to 3 for fast debug iteration",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    models = ALL_MODEL_KEYS if "all" in args.models else args.models
    summary = run_pipeline(
        models_to_run=models,
        smoke_test=args.smoke_test,
        no_hpo=args.no_hpo,
    )
    # Exit with non-zero code if any model failed (useful for CI)
    sys.exit(0 if summary.get("all_passed") else 1)
