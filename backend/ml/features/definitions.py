import pandas as pd
import numpy as np
from datetime import datetime

class FeatureEngineer:
    FEATURE_GROUPS = {
        'thermal': ['surface_temp_c', 'bht_estimate', 'dBHT_dt_1h', 'dBHT_dt_6h'],
        'mechanical': ['spm', 'stroke_len_m', 'vfd_pct', 'motor_current_a', 'rolling_std_current_1h'],
        'dynamometer': ['peak_load_n', 'min_load_n', 'card_area', 'compression_frac', 'slope_segments'],
        'production': ['flow_bopd', 'lagged_1h', 'lagged_6h', 'lagged_24h', 'rolling_mean_1h'],
        'css_context': ['cycle_day', 'phase_encoded', 'cumulative_steam', 'days_since_injection'],
        'history': ['days_since_last_failure', 'failure_count_180d'],
        'quality': ['sensor_quality_flag', 'missingness_rate_1h'],
        'interaction': ['spm_x_log_visc']
    }

    def compute_features(self, df: pd.DataFrame, as_of_ts: datetime = None) -> pd.DataFrame:
        feat_df = df.copy()
        if as_of_ts:
            feat_df = feat_df[feat_df['timestamp'] <= as_of_ts]
            
        feat_df = feat_df.sort_values(by=['well_id', 'timestamp'])
        
        # Thermal
        feat_df['bht_estimate'] = feat_df['bht_c'].fillna(method='ffill')
        feat_df['dBHT_dt_1h'] = feat_df.groupby('well_id')['bht_estimate'].diff(periods=12) # assuming 5 min intervals
        feat_df['dBHT_dt_6h'] = feat_df.groupby('well_id')['bht_estimate'].diff(periods=72)
        
        # Mechanical
        feat_df['rolling_std_current_1h'] = feat_df.groupby('well_id')['motor_current_a'].rolling(12).std().reset_index(0, drop=True)
        
        # Dynamometer (mocks)
        feat_df['card_area'] = feat_df['peak_load_n'] * feat_df['stroke_len_m'] * 0.5
        feat_df['compression_frac'] = 0.8
        feat_df['slope_segments'] = 1.2
        
        # Production
        feat_df['lagged_1h'] = feat_df.groupby('well_id')['flow_bopd'].shift(12)
        feat_df['lagged_6h'] = feat_df.groupby('well_id')['flow_bopd'].shift(72)
        feat_df['lagged_24h'] = feat_df.groupby('well_id')['flow_bopd'].shift(288)
        feat_df['rolling_mean_1h'] = feat_df.groupby('well_id')['flow_bopd'].rolling(12).mean().reset_index(0, drop=True)
        
        # CSS context
        feat_df['phase_encoded'] = feat_df['css_phase'].astype('category').cat.codes
        feat_df['cumulative_steam'] = 1000.0
        feat_df['days_since_injection'] = feat_df['cycle_day']
        
        # History
        feat_df['days_since_last_failure'] = 30.0
        feat_df['failure_count_180d'] = 1
        
        # Quality
        feat_df['sensor_quality_flag'] = (feat_df['quality_flag'] == 'GOOD').astype(int)
        feat_df['missingness_rate_1h'] = 0.0
        
        # Interaction
        feat_df['spm_x_log_visc'] = feat_df['spm'] * np.log1p(feat_df['viscosity_cp'])
        
        return feat_df

    def compute_online_features(self, latest_reading: dict, redis_cache: dict) -> dict:
        features = latest_reading.copy()
        features['spm_x_log_visc'] = features.get('spm', 0) * np.log1p(features.get('viscosity_cp', 0))
        # Add mock cached features
        features['rolling_std_current_1h'] = redis_cache.get('rolling_std_current_1h', 0.0)
        return features

    def get_feature_list(self, model_name: str) -> list:
        if model_name == 'ProductionForecaster':
            return self.FEATURE_GROUPS['thermal'] + self.FEATURE_GROUPS['mechanical'] + self.FEATURE_GROUPS['production']
        return []
