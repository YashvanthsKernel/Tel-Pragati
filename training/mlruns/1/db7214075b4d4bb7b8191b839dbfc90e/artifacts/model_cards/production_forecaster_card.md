# Model Card — Production Forecaster

| Field | Value |
|---|---|
| **Version** | `1.0.0` |
| **Generated** | 2026-08-27T10:12:51Z |
| **MLflow Run ID** | `db7214075b4d4bb7b8191b839dbfc90e` |
| **Label Source Validated On** | `ground_truth` |
| **Passed Promotion Thresholds** | ❌ **No** |

---

## Metrics

| Metric | Value |
|---|---|
| `training_seconds` | 60.5000 |

---

## Promotion Thresholds

| Threshold | Value |
|---|---|
| `p50_mae_improvement_vs_persistence_pct` | `15.0` |
| `coverage_interval_low_pct` | `80.0` |
| `coverage_interval_high_pct` | `96.0` |

---

## Evaluation Notes

- **1h**: ❌ improvement=18.12%, coverage=66.0%
- **6h**: ❌ improvement=13.71%, coverage=57.5%
- **24h**: ❌ improvement=24.8%, coverage=61.0%

---

## Known Limitations

- All evaluation is against **synthetic ground-truth** data unless noted otherwise.
- Real-data performance is **calibration-checked only** until OIL historian data arrives.
- Per §5 of the architecture spec: confidence scores on real data carry the label `weak`, not `ground_truth`.

---

## Intended Use

Advisory oil-rate forecast surfaced on `/twin` page. Not authorized for Automated-tier dispatch.

---

> **Governance note:** This card was auto-generated from MLflow run `db7214075b4d4bb7b8191b839dbfc90e`. 
> Human approval gate required before promotion to Production stage (§8.2).
