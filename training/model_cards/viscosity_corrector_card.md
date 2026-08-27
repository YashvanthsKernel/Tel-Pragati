# Model Card — Viscosity Corrector

| Field | Value |
|---|---|
| **Version** | `1.0.0` |
| **Generated** | 2026-08-27T10:19:53Z |
| **MLflow Run ID** | `67431353dc0a409fa5e699bd08e716d2` |
| **Label Source Validated On** | `ground_truth` |
| **Passed Promotion Thresholds** | ❌ **No** |

---

## Metrics

| Metric | Value |
|---|---|
| `all_scenarios_pass` | False |
| `improvement_pct` | -1.1900 |
| `test_corrected_mae` | 19.3214 |
| `test_physics_mae` | 19.0950 |
| `training_seconds` | 53.3000 |

---

## Promotion Thresholds

| Threshold | Value |
|---|---|
| `mae_improvement_vs_physics_pct` | `10.0` |

---

## Evaluation Notes

- **synthetic**: ❌ corrected_mae=229.3601, improvement=-0.5%

---

## Known Limitations

- All evaluation is against **synthetic ground-truth** data unless noted otherwise.
- Real-data performance is **calibration-checked only** until OIL historian data arrives.
- Per §5 of the architecture spec: confidence scores on real data carry the label `weak`, not `ground_truth`.

---

## Intended Use

Residual correction of physics viscosity estimate, shown on `/physics`. Never sole author of control action.

---

> **Governance note:** This card was auto-generated from MLflow run `67431353dc0a409fa5e699bd08e716d2`. 
> Human approval gate required before promotion to Production stage (§8.2).
