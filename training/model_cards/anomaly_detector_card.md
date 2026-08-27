# Model Card — Anomaly Detector

| Field | Value |
|---|---|
| **Version** | `1.0.0` |
| **Generated** | 2026-08-27T10:20:27Z |
| **MLflow Run ID** | `67431353dc0a409fa5e699bd08e716d2` |
| **Label Source Validated On** | `ground_truth` |
| **Passed Promotion Thresholds** | ❌ **No** |

---

## Metrics

| Metric | Value |
|---|---|
| `combined_f1` | 0.8258 |
| `combined_precision` | 0.9561 |
| `combined_recall` | 0.7267 |
| `fp_rate_on_normal` | 0.0500 |
| `if_contamination` | 0.0500 |
| `n_rules` | 21 |
| `training_seconds` | 0.4000 |

---

## Promotion Thresholds

| Threshold | Value |
|---|---|
| `precision_min` | `0.9` |
| `recall_min` | `0.85` |
| `fp_rate_normal_max` | `0.02` |

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

Sensor-health gating — output short-circuits downstream inference when `quarantined`. Not a control recommendation.

---

> **Governance note:** This card was auto-generated from MLflow run `67431353dc0a409fa5e699bd08e716d2`. 
> Human approval gate required before promotion to Production stage (§8.2).
