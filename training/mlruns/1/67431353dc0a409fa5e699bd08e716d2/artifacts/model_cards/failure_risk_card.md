# Model Card — Failure Risk

| Field | Value |
|---|---|
| **Version** | `1.0.0` |
| **Generated** | 2026-08-27T10:20:26Z |
| **MLflow Run ID** | `67431353dc0a409fa5e699bd08e716d2` |
| **Label Source Validated On** | `ground_truth` |
| **Passed Promotion Thresholds** | ❌ **No** |

---

## Metrics

| Metric | Value |
|---|---|
| `training_seconds` | 6.5000 |

---

## Promotion Thresholds

| Threshold | Value |
|---|---|
| `auc_min` | `0.8` |
| `brier_score_max` | `0.15` |

---

## Evaluation Notes

- **7d**: ❌ improvement=?%, coverage=?%
- **30d**: ❌ improvement=?%, coverage=?%

---

## Known Limitations

- All evaluation is against **synthetic ground-truth** data unless noted otherwise.
- Real-data performance is **calibration-checked only** until OIL historian data arrives.
- Per §5 of the architecture spec: confidence scores on real data carry the label `weak`, not `ground_truth`.

---

## Intended Use

Risk probability shown on `/diagnostics` / `/control`. Per-prediction SHAP explanation always accompanies output.

---

> **Governance note:** This card was auto-generated from MLflow run `67431353dc0a409fa5e699bd08e716d2`. 
> Human approval gate required before promotion to Production stage (§8.2).
