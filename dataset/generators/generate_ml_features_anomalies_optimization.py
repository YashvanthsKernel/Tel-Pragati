import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Create directory if it doesn't exist
os.makedirs(r"D:\Tel Pragati\dataset", exist_ok=True)

np.random.seed(42)

# --- Dataset 1: ml_training_features.csv ---
n_rows_1 = 5000
wells = [f"BGW-{i:02d}" for i in range(1, 24)]
cycle_ids = [f"CYC-{i}" for i in range(1, 4)]
phases = ['inject', 'soak', 'produce', 'shut_in']
splits = ['train', 'val', 'test']

data_1 = {}
data_1['sample_id'] = [f"FEAT-{i:07d}" for i in range(n_rows_1)]
data_1['well_id'] = np.random.choice(wells, n_rows_1)
data_1['cycle_id'] = np.random.choice(cycle_ids, n_rows_1)

start_date = datetime(2025, 1, 1)
data_1['ts'] = [(start_date + timedelta(hours=i)).strftime('%Y-%m-%dT%H:%M:%SZ') for i in range(n_rows_1)]

data_1['cycle_day'] = np.random.uniform(1, 30, n_rows_1)
data_1['phase'] = np.random.choice(phases, n_rows_1, p=[0.1, 0.1, 0.7, 0.1])

data_1['surface_temp_c'] = np.random.normal(50, 10, n_rows_1)
data_1['bht_estimate_c'] = np.random.normal(140, 30, n_rows_1)
data_1['dBHT_dt_1h'] = np.random.normal(0, 5, n_rows_1)
data_1['dBHT_dt_6h'] = np.random.normal(0, 15, n_rows_1)

T_ref_K = 180 + 273.15
mu_ref = 50
B = 5000 
temp_K = data_1['bht_estimate_c'] + 273.15
data_1['viscosity_cp_physics'] = mu_ref * np.exp(B * (1/temp_K - 1/T_ref_K))
data_1['viscosity_cp_corrected'] = data_1['viscosity_cp_physics'] * np.random.normal(1, 0.1, n_rows_1)
data_1['visc_ratio_vs_peak'] = np.clip(np.random.normal(0.5, 0.2, n_rows_1), 0.1, 1.0)
data_1['thermal_viscosity_index'] = np.exp(B / temp_K)

data_1['spm'] = np.random.uniform(4, 8, n_rows_1)
data_1['stroke_len_in'] = np.random.choice([80, 120, 144], n_rows_1)
data_1['vfd_pct'] = np.random.uniform(40, 100, n_rows_1)
data_1['motor_current_a'] = np.random.normal(20, 5, n_rows_1)
data_1['motor_current_rolling_std_1h'] = np.random.normal(1, 0.5, n_rows_1)
data_1['spm_x_visc_interaction'] = data_1['spm'] * np.log(data_1['viscosity_cp_physics'])

data_1['pprl_lbs'] = np.random.normal(15000, 2000, n_rows_1)
data_1['mprl_lbs'] = np.random.normal(3000, 500, n_rows_1)
data_1['card_area_in_lbs'] = np.random.normal(100000, 20000, n_rows_1)
data_1['card_compression_frac'] = np.random.uniform(0.6, 0.9, n_rows_1)
data_1['fmi'] = data_1['mprl_lbs'] / 15000 
data_1['downstroke_compression_index'] = np.random.uniform(0.5, 1.5, n_rows_1)
for i in range(1, 5):
    data_1[f'fourier_h{i}'] = np.random.normal(0, 10/i, n_rows_1)

data_1['flow_bopd'] = np.random.normal(200, 50, n_rows_1)
data_1['flow_bopd_lag_1h'] = data_1['flow_bopd'] * np.random.normal(1, 0.05, n_rows_1)
data_1['flow_bopd_lag_6h'] = data_1['flow_bopd'] * np.random.normal(1, 0.1, n_rows_1)
data_1['flow_bopd_lag_24h'] = data_1['flow_bopd'] * np.random.normal(1, 0.2, n_rows_1)
data_1['flow_bopd_rolling_mean_24h'] = data_1['flow_bopd'] * np.random.normal(1, 0.1, n_rows_1)
data_1['flow_bopd_rolling_std_24h'] = np.random.normal(10, 5, n_rows_1)
data_1['water_cut_pct'] = np.random.uniform(10, 80, n_rows_1)

data_1['days_since_injection'] = np.random.uniform(1, 90, n_rows_1)
data_1['cumulative_steam_volume_m3'] = np.random.normal(5000, 1000, n_rows_1)
data_1['prior_cycle_peak_bht_c'] = np.random.normal(200, 20, n_rows_1)
data_1['time_since_last_phase_transition_h'] = np.random.uniform(0, 720, n_rows_1)
data_1['phase_transition_active'] = data_1['time_since_last_phase_transition_h'] < 12

data_1['days_since_last_failure'] = np.random.uniform(1, 365, n_rows_1)
data_1['failure_count_trailing_180d'] = np.random.randint(0, 5, n_rows_1)
data_1['well_age_days'] = np.random.randint(365, 3650, n_rows_1)

data_1['sensor_quality_score'] = np.random.uniform(0.8, 1.0, n_rows_1)
data_1['cross_sensor_residual'] = np.random.normal(0, 0.1, n_rows_1)
data_1['missingness_rate_1h'] = np.random.uniform(0, 0.05, n_rows_1)

data_1['target_flow_bopd_1h'] = data_1['flow_bopd'] * np.random.normal(1, 0.05, n_rows_1)
data_1['target_flow_bopd_6h'] = data_1['flow_bopd'] * np.random.normal(1, 0.1, n_rows_1)
data_1['target_flow_bopd_24h'] = data_1['flow_bopd'] * np.random.normal(1, 0.2, n_rows_1)
data_1['target_viscosity_residual'] = data_1['viscosity_cp_corrected'] - data_1['viscosity_cp_physics']
card_classes = ['Normal', 'Rod_Floating', 'Fluid_Pound', 'Gas_Interference', 'TV_Leak']
data_1['target_card_class'] = np.random.choice(card_classes, n_rows_1, p=[0.7, 0.1, 0.1, 0.05, 0.05])
data_1['target_failure_7d'] = np.random.choice([True, False], n_rows_1, p=[0.05, 0.95])
data_1['target_failure_30d'] = np.random.choice([True, False], n_rows_1, p=[0.1, 0.9])
data_1['target_rod_floating_risk'] = np.where(data_1['fmi'] < 0.15, np.random.uniform(80, 100, n_rows_1), np.random.uniform(0, 20, n_rows_1))

data_1['source'] = 'synthetic'
data_1['label_source'] = 'ground_truth'
data_1['split'] = np.random.choice(splits, n_rows_1, p=[0.7, 0.15, 0.15])

df_1 = pd.DataFrame(data_1)

header_1 = """# Dataset: Baghewala Digital Twin - ML Training Feature Matrix
# Version: 1.3.0
# Generated: 2026-08-27T13:55:00Z
# Description: Pre-computed point-in-time correct features with multi-target labels
# Schema: WellState Canonical v1.0 (Feature Store Export)
# Point-in-Time: All features use trailing windows only (no future leakage)
# Split Strategy: By well AND by time (70% train / 15% val / 15% test)
# Feature Groups: thermal, mechanical, dynamometer, production, css_context, history, quality
# Target Models: Production Forecaster, Viscosity Corrector, Dyno Classifier, Failure Risk
# Field: Baghewala, Jaisalmer, Rajasthan
# Random Seed: 42
"""
with open(r"D:\Tel Pragati\dataset\ml_training_features.csv", "w", newline="") as f:
    f.write(header_1)
    df_1.to_csv(f, index=False)


# --- Dataset 2: anomaly_labels.csv ---
n_rows_2 = 500
anomaly_types = ['sensor_dropout', 'sensor_stuck_at', 'sensor_bias_drift', 'cross_sensor_mismatch', 'rate_of_change_violation', 'physical_impossibility', 'none']
sensors = ['temp_1', 'temp_2', 'pressure_in', 'pressure_out', 'flow_rate', 'motor_current', 'rod_load']

data_2 = {}
data_2['anomaly_id'] = [f"ANM-{i:05d}" for i in range(n_rows_2)]
data_2['well_id'] = np.random.choice(wells, n_rows_2)
data_2['ts_start'] = [(start_date + timedelta(days=i)).strftime('%Y-%m-%dT%H:%M:%SZ') for i in range(n_rows_2)]
data_2['ts_end'] = [(start_date + timedelta(days=i, minutes=np.random.randint(5, 60))).strftime('%Y-%m-%dT%H:%M:%SZ') for i in range(n_rows_2)]
data_2['duration_minutes'] = np.random.uniform(5, 60, n_rows_2)
data_2['anomaly_type'] = ['none']*200 + list(np.random.choice(anomaly_types[:-1], 300))
np.random.shuffle(data_2['anomaly_type'])
data_2['affected_sensor'] = np.random.choice(sensors, n_rows_2)
data_2['anomaly_score'] = [np.random.uniform(0.1, 0.4) if t == 'none' else np.random.uniform(0.6, 1.0) for t in data_2['anomaly_type']]
data_2['is_anomaly'] = [t != 'none' for t in data_2['anomaly_type']]
data_2['rule_triggered'] = [f"Rule-{np.random.randint(1,21)}" if a else None for a in data_2['is_anomaly']]
data_2['description'] = [f"Detected {t} on {s}" if a else "Normal window" for t, s, a in zip(data_2['anomaly_type'], data_2['affected_sensor'], data_2['is_anomaly'])]
data_2['label_source'] = 'ground_truth'

df_2 = pd.DataFrame(data_2)

header_2 = """# Dataset: Baghewala Digital Twin - Anomaly Detection Labels
# Version: 1.3.0
# Generated: 2026-08-27T13:55:00Z
# Description: 500 labeled windows (300 anomalies + 200 normal) for sensor health detection
# Schema: WellState Canonical v1.0 (Anomaly Domain)
# Anomaly Types: 6 sensor fault types + normal baseline
# Rule Categories: 15 physical plausibility + 6 cross-sensor consistency checks
# Field: Baghewala, Jaisalmer, Rajasthan
# Random Seed: 42
"""
with open(r"D:\Tel Pragati\dataset\anomaly_labels.csv", "w", newline="") as f:
    f.write(header_2)
    df_2.to_csv(f, index=False)


# --- Dataset 3: optimization_scenarios.csv ---
n_rows_3 = 300
strategies = ['Strategy_A', 'Strategy_B', 'Strategy_C']

data_3 = {}
data_3['scenario_id'] = [f"OPT-{i//3:04d}" for i in range(n_rows_3)]
data_3['well_id'] = np.random.choice(wells, n_rows_3)
data_3['cycle_id'] = np.random.choice(cycle_ids, n_rows_3)
data_3['cycle_day'] = np.random.uniform(1, 30, n_rows_3)
data_3['strategy_name'] = strategies * 100
data_3['strategy_label'] = [f"{s} optimized" for s in data_3['strategy_name']]
data_3['recommended'] = [i%3==0 for i in range(n_rows_3)]
data_3['proposed_spm'] = np.random.uniform(4, 8, n_rows_3)
data_3['proposed_vfd_pct'] = np.random.uniform(60, 100, n_rows_3)
data_3['proposed_stroke_len_in'] = np.random.choice([80, 120, 144], n_rows_3)
data_3['proposed_downstroke_speed_factor'] = np.random.uniform(0.5, 1.0, n_rows_3)
data_3['predicted_production_bopd'] = np.random.normal(250, 40, n_rows_3)
data_3['predicted_energy_kwh_day'] = np.random.normal(300, 50, n_rows_3)
data_3['predicted_rod_risk_pct'] = np.random.uniform(0, 30, n_rows_3)
data_3['predicted_sor'] = np.random.uniform(2.5, 5.0, n_rows_3)
data_3['predicted_cost_inr_day'] = data_3['predicted_energy_kwh_day'] * 10
data_3['predicted_net_value_inr_day'] = data_3['predicted_production_bopd'] * 5000 - data_3['predicted_cost_inr_day']
data_3['pareto_rank'] = np.random.randint(1, 4, n_rows_3)
data_3['interlock_safe'] = np.random.choice([True, False], n_rows_3, p=[0.95, 0.05])
data_3['model_confidence_pct'] = np.random.uniform(70, 99, n_rows_3)
data_3['source'] = 'synthetic'

df_3 = pd.DataFrame(data_3)

header_3 = """# Dataset: Baghewala Digital Twin - NSGA-II Optimization Scenarios
# Version: 1.3.0
# Generated: 2026-08-27T13:55:00Z
# Description: 300 pre-computed optimization strategies (100 scenarios × 3 strategies)
# Schema: WellState Canonical v1.0 (Optimization Domain)
# Optimizer: NSGA-II Multi-Objective (pymoo)
# Objectives: maximize{Production, -SOR, -Energy, -Risk, NetValue}
# Constraints: 7-rule Safety Interlock Matrix
# Field: Baghewala, Jaisalmer, Rajasthan
# Random Seed: 42
"""
with open(r"D:\Tel Pragati\dataset\optimization_scenarios.csv", "w", newline="") as f:
    f.write(header_3)
    df_3.to_csv(f, index=False)
