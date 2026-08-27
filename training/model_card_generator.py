"""
Baghewala Digital Twin — Model-Card Generator
Auto-generates a Markdown model card from an MLflow run's logged metadata.
Per §9 / §16.2: model cards must be derived from tracked metadata, not hand-written.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Optional

import mlflow

from config import MODEL_CARDS_DIR, THRESHOLDS

logger = logging.getLogger(__name__)

CARD_TEMPLATE = """\
# Model Card — {model_name}

| Field | Value |
|---|---|
| **Version** | `{version}` |
| **Generated** | {generated_at} |
| **MLflow Run ID** | `{run_id}` |
| **Label Source Validated On** | `{label_source}` |
| **Passed Promotion Thresholds** | {passed_icon} **{passed_str}** |

---

## Metrics

{metrics_table}

---

## Promotion Thresholds

{thresholds_table}

---

## Evaluation Notes

{eval_notes}

---

## Known Limitations

- All evaluation is against **synthetic ground-truth** data unless noted otherwise.
- Real-data performance is **calibration-checked only** until OIL historian data arrives.
- Per §5 of the architecture spec: confidence scores on real data carry the label `weak`, not `ground_truth`.

---

## Intended Use

{intended_use}

---

> **Governance note:** This card was auto-generated from MLflow run `{run_id}`. 
> Human approval gate required before promotion to Production stage (§8.2).
"""


def _format_metrics_table(metrics: Dict) -> str:
    rows = ["| Metric | Value |", "|---|---|"]
    for k, v in sorted(metrics.items()):
        if isinstance(v, float):
            cell = f"{v:.4f}"
        elif isinstance(v, bool):
            cell = str(v)
        elif isinstance(v, int):
            cell = str(v)
        else:
            cell = str(v)
        rows.append(f"| `{k}` | {cell} |")
    return "\n".join(rows)


def _format_thresholds_table(model_name: str) -> str:
    thresh = THRESHOLDS.get(model_name, {})
    if not thresh:
        return "_No promotion thresholds defined._"
    rows = ["| Threshold | Value |", "|---|---|"]
    for k, v in thresh.items():
        rows.append(f"| `{k}` | `{v}` |")
    return "\n".join(rows)


INTENDED_USE_MAP = {
    "production_forecaster":    "Advisory oil-rate forecast surfaced on `/twin` page. Not authorized for Automated-tier dispatch.",
    "viscosity_corrector":      "Residual correction of physics viscosity estimate, shown on `/physics`. Never sole author of control action.",
    "dynamometer_classifier":   "Condition classification surfaced on `/diagnostics` card overlay. Advisory only; Safety Interlock Engine has final veto.",
    "failure_risk":             "Risk probability shown on `/diagnostics` / `/control`. Per-prediction SHAP explanation always accompanies output.",
    "anomaly_detector":         "Sensor-health gating — output short-circuits downstream inference when `quarantined`. Not a control recommendation.",
}


def generate_model_card(
    model_name: str,
    report: Dict,
    run_id: Optional[str] = None,
    version: str = "1.0.0",
) -> Path:
    """
    Writes a Markdown model card to MODEL_CARDS_DIR/{model_name}_card.md.

    Args:
        model_name : model key (matches THRESHOLDS keys)
        report     : evaluation report dict returned by each model's train_ function
        run_id     : MLflow run ID (optional, included if provided)
        version    : semantic version string

    Returns:
        Path to the written card file.
    """
    MODEL_CARDS_DIR.mkdir(parents=True, exist_ok=True)
    card_path = MODEL_CARDS_DIR / f"{model_name}_card.md"

    # Extract flat metrics from report
    metrics = {k: v for k, v in report.items()
               if isinstance(v, (int, float)) and k not in ("passed_promotion",)}

    passed = report.get("passed_promotion", False)
    passed_icon = "✅" if passed else "❌"
    passed_str = "Yes" if passed else "No"
    label_source = report.get("label_source_validated_on", "ground_truth")
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Eval notes: include any per-scenario or horizon breakdown
    eval_notes_parts = []
    if "horizons" in report:
        for h, hd in report["horizons"].items():
            symbol = "✅" if hd.get("passed") else "❌"
            eval_notes_parts.append(
                f"- **{h}**: {symbol} improvement={hd.get('improvement_pct','?')}%, "
                f"coverage={hd.get('coverage_pct','?')}%"
            )
    elif "per_scenario" in report:
        for scen, sd in report["per_scenario"].items():
            symbol = "✅" if sd.get("passed") else "❌"
            eval_notes_parts.append(
                f"- **{scen}**: {symbol} corrected_mae={sd.get('corrected_mae','?')}, "
                f"improvement={sd.get('improvement_pct','?')}%"
            )

    eval_notes = "\n".join(eval_notes_parts) if eval_notes_parts else "_No per-horizon/scenario breakdown._"

    card_content = CARD_TEMPLATE.format(
        model_name=model_name.replace("_", " ").title(),
        version=version,
        generated_at=generated_at,
        run_id=run_id or "unknown",
        label_source=label_source,
        passed_icon=passed_icon,
        passed_str=passed_str,
        metrics_table=_format_metrics_table(metrics),
        thresholds_table=_format_thresholds_table(model_name),
        eval_notes=eval_notes,
        intended_use=INTENDED_USE_MAP.get(model_name, "See architecture spec."),
    )

    card_path.write_text(card_content, encoding="utf-8")
    logger.info("Model card written to %s", card_path)
    return card_path
