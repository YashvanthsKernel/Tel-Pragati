# Model Card — Dynamometer Classifier

| Field | Value |
|---|---|
| **Version** | `1.0.0` |
| **Generated** | 2026-08-27T10:20:20Z |
| **MLflow Run ID** | `67431353dc0a409fa5e699bd08e716d2` |
| **Label Source Validated On** | `ground_truth` |
| **Passed Promotion Thresholds** | ✅ **Yes** |

---

## Metrics

| Metric | Value |
|---|---|
| `temperature` | 0.1164 |
| `test_macro_f1` | 0.9783 |
| `test_rod_floating_recall` | 1.0000 |
| `training_seconds` | 26.4000 |

---

## Promotion Thresholds

| Threshold | Value |
|---|---|
| `macro_f1_min` | `0.85` |
| `rod_floating_recall_min` | `0.9` |

---

## Evaluation Notes

_No per-horizon/scenario breakdown._

---

## Known Limitations

- All evaluation is against **synthetic ground-truth** data unless noted otherwise.
- Real-data performance is **calibration-checked only** until OIL historian data arrives.
- Per §5 of the architecture spec: confidence scores on real data carry the label `weak`, not `ground_truth`.

---

## Intended Use

Condition classification surfaced on `/diagnostics` card overlay. Advisory only; Safety Interlock Engine has final veto.

---

> **Governance note:** This card was auto-generated from MLflow run `67431353dc0a409fa5e699bd08e716d2`. 
> Human approval gate required before promotion to Production stage (§8.2).
