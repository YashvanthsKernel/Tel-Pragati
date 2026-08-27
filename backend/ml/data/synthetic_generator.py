import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import uuid

class SyntheticDataGenerator:
    def __init__(self, config: dict):
        self.config = config

    def _generate_dynamometer_card(self, bht_c, viscosity_cp, spm, stroke_len):
        n_points = 100
        position = np.linspace(0, stroke_len, n_points)
        base_load = 5000 + (viscosity_cp * 10) + (spm * 50)
        load = base_load + np.sin(position / stroke_len * np.pi) * 2000
        return position.tolist(), load.tolist()

    def _apply_noise_model(self, df: pd.DataFrame, noise_config: dict) -> pd.DataFrame:
        noisy_df = df.copy()
        np.random.seed(42)
        cols = ['bht_c', 'viscosity_cp', 'spm', 'stroke_len_m', 'motor_current_a', 'flow_bopd']
        for col in cols:
            if col in noisy_df.columns:
                noise = np.random.normal(0, noisy_df[col].std() * 0.02, size=len(noisy_df))
                noisy_df[col] += noise
                
                # Dropout 1%
                dropout_mask = np.random.rand(len(noisy_df)) < 0.01
                noisy_df.loc[dropout_mask, col] = np.nan
                
                # Stuck-at 2%
                stuck_mask = np.random.rand(len(noisy_df)) < 0.02
                stuck_values = noisy_df[col].shift(1)
                noisy_df.loc[stuck_mask, col] = stuck_values[stuck_mask]
                
                # Bias drift 3%
                drift_mask = np.random.rand(len(noisy_df)) < 0.03
                noisy_df.loc[drift_mask, col] += noisy_df[col].std() * 0.1
        return noisy_df

    def _inject_fault(self, df: pd.DataFrame, fault_config: dict) -> pd.DataFrame:
        fault_df = df.copy()
        fault_type = fault_config.get('type')
        if fault_type == 'rod_floating':
            fault_df['peak_load_n'] *= 0.5
            fault_df['flow_bopd'] *= 0.2
        elif fault_type == 'fluid_pound':
            fault_df['min_load_n'] *= 0.2
        elif fault_type == 'gas_interference':
            fault_df['flow_bopd'] *= 0.8
        elif fault_type == 'traveling_valve_leak':
            fault_df['peak_load_n'] *= 0.9
            fault_df['flow_bopd'] *= 0.7
        return fault_df

    def generate_dataset(self, n_wells=10, scenarios=None, random_seeds=range(200)) -> pd.DataFrame:
        records = []
        for well_idx in range(n_wells):
            well_id = f"WELL_{well_idx:03d}"
            start_time = datetime(2023, 1, 1)
            for step in range(288 * 30): # 30 days, 5 min intervals
                ts = start_time + timedelta(minutes=5 * step)
                bht = 150.0 - (step / (288*30)) * 50
                visc = 100.0 + (step / (288*30)) * 500
                spm = 5.0
                stroke = 3.0
                pos, load = self._generate_dynamometer_card(bht, visc, spm, stroke)
                
                record = {
                    'timestamp': ts,
                    'well_id': well_id,
                    'bht_c': bht,
                    'viscosity_cp': visc,
                    'spm': spm,
                    'stroke_len_m': stroke,
                    'vfd_pct': 80.0,
                    'motor_current_a': 45.0,
                    'surface_temp_c': 35.0,
                    'peak_load_n': max(load),
                    'min_load_n': min(load),
                    'flow_bopd': 500.0 - (step / (288*30)) * 400,
                    'css_phase': 'PRODUCTION',
                    'cycle_day': step // 288,
                    'quality_flag': 'GOOD',
                    'source': 'synthetic',
                    'label_source': 'ground_truth'
                }
                records.append(record)
                
        df = pd.DataFrame(records)
        df = self._apply_noise_model(df, {})
        
        # Inject some faults randomly
        fault_df = self._inject_fault(df.sample(frac=0.1), {'type': 'rod_floating'})
        df.update(fault_df)
        
        return df

    def register_dataset(self, df: pd.DataFrame, generator_version: str, config_hash: str) -> str:
        dataset_id = str(uuid.uuid4())
        return dataset_id
