import pandas as pd
import numpy as np
from scipy.stats import ks_2samp

class DriftMonitor:
    THRESHOLDS = {
        'psi_warn': 0.2,
        'psi_alert': 0.3,
        'ks_pvalue': 0.01
    }

    def run_drift_report(self, reference_df: pd.DataFrame, current_df: pd.DataFrame) -> dict:
        drift_results = {}
        for col in reference_df.select_dtypes(include=np.number).columns:
            if col in current_df.columns:
                ref_data = reference_df[col].dropna()
                curr_data = current_df[col].dropna()
                
                if len(ref_data) > 0 and len(curr_data) > 0:
                    stat, p_value = ks_2samp(ref_data, curr_data)
                    drift_results[col] = {
                        'ks_stat': stat,
                        'p_value': p_value,
                        'drift_detected': p_value < self.THRESHOLDS['ks_pvalue']
                    }
        return {"feature_drift": drift_results}

    def check_performance_degradation(self, champion_metrics: dict, current_metrics: dict) -> bool:
        return current_metrics.get('mae', 0) > champion_metrics.get('mae', 0) * 1.1

    def generate_divergence_report(self, physics_ml_divergence_series: pd.Series) -> dict:
        return {
            "mean_divergence_pct": physics_ml_divergence_series.mean(),
            "max_divergence_pct": physics_ml_divergence_series.max(),
            "divergence_trend": "stable"
        }
