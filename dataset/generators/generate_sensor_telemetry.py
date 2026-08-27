import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import uuid

np.random.seed(42)

def generate_telemetry():
    wells = ['BGW-08', 'BGW-11']
    records = []
    
    start_time = datetime(2026, 1, 1, 0, 0, 0)
    
    for well_id in wells:
        cycle_id = f"CYC-{np.random.randint(100, 999)}"
        
        # Inject: 10 days, Soak: 5 days, Produce: 30 days
        phases = [
            ('inject', 10),
            ('soak', 5),
            ('produce', 30)
        ]
        
        current_time = start_time
        
        t_peak = np.random.uniform(140, 220)
        t_amb = 47.0
        tau = np.random.uniform(12, 15)
        
        for phase_name, duration_days in phases:
            num_steps = int(duration_days * 24 * 60 / 5)
            
            for i in range(num_steps):
                ts = current_time + timedelta(minutes=i*5)
                cycle_day = (ts - start_time).total_seconds() / (24 * 3600)
                
                # Default noise
                noise = lambda val: val * (1 + np.random.uniform(-0.02, 0.02))
                
                if phase_name == 'inject':
                    temp_1 = noise(np.random.uniform(80, 95))
                    temp_2 = noise(temp_1 * 0.9)
                    pressure_in = noise(np.random.uniform(200, 500))
                    pressure_out = noise(np.random.uniform(20, 50))
                    flow = 0.0
                    tank = noise(np.random.uniform(10, 30))
                    spm = 0.0
                    stroke_len = 0.0
                    vfd = 0.0
                    motor_cur = 0.0
                    motor_torq = 0.0
                    rod_peak = 0.0
                    rod_min = 0.0
                    vib = noise(np.random.uniform(0.1, 0.5))
                elif phase_name == 'soak':
                    temp_1 = noise(t_peak)
                    temp_2 = noise(t_peak * 0.85)
                    pressure_in = noise(np.random.uniform(50, 100))
                    pressure_out = noise(np.random.uniform(20, 50))
                    flow = 0.0
                    tank = noise(np.random.uniform(10, 30))
                    spm = 0.0
                    stroke_len = 0.0
                    vfd = 0.0
                    motor_cur = 0.0
                    motor_torq = 0.0
                    rod_peak = 0.0
                    rod_min = 0.0
                    vib = noise(np.random.uniform(0.1, 0.5))
                else:
                    # produce
                    t_prod = cycle_day - 15  # days since produce start
                    temp_1 = t_amb + (t_peak - t_amb) * np.exp(-t_prod / tau)
                    temp_1 = noise(temp_1)
                    temp_2 = noise(temp_1 * 0.8)
                    
                    pressure_in = noise(50 * np.exp(-t_prod / tau) + 20)
                    pressure_out = noise(30)
                    
                    flow = noise(300 * np.exp(-t_prod / tau) + 50)
                    tank = min(95.0, noise(20 + t_prod * 2.5))
                    
                    spm = noise(6.0)
                    stroke_len = noise(120.0)
                    vfd = noise(80.0)
                    
                    # Viscosity rises as temp drops
                    viscosity_proxy = 1.0 / (temp_1 + 1)
                    motor_cur = noise(20 + viscosity_proxy * 1000)
                    motor_torq = noise(500 + viscosity_proxy * 5000)
                    
                    rod_peak = noise(15000 + viscosity_proxy * 100000)
                    rod_min = noise(8000 - viscosity_proxy * 50000)
                    
                    vib = noise(np.random.uniform(2.0, 5.0))
                
                records.append({
                    'telemetry_id': f"TEL-{uuid.uuid4().hex[:8].upper()}",
                    'well_id': well_id,
                    'cycle_id': cycle_id,
                    'ts': ts.strftime('%Y-%m-%dT%H:%M:%SZ'),
                    'cycle_day': round(cycle_day, 3),
                    'phase': phase_name,
                    'temp_1_c': temp_1,
                    'temp_2_c': temp_2,
                    'pressure_in_psi': pressure_in,
                    'pressure_out_psi': pressure_out,
                    'flow_rate_bopd': flow,
                    'tank_level_pct': tank,
                    'spm': spm,
                    'stroke_len_in': stroke_len,
                    'vfd_pct': vfd,
                    'motor_current_a': motor_cur,
                    'motor_torque_nm': motor_torq,
                    'rod_load_peak_lb': rod_peak,
                    'rod_load_min_lb': rod_min,
                    'vibration_mm_s': vib,
                    'source': 'synthetic',
                    'quality_flag': 'ok'
                })
            
            current_time += timedelta(days=duration_days)
            
    df = pd.DataFrame(records)
    
    # Inject anomalies
    n_rows = len(df)
    
    # dropout (1.5%)
    dropout_idx = np.random.choice(n_rows, int(n_rows * 0.015), replace=False)
    df.loc[dropout_idx, 'quality_flag'] = 'missing'
    for col in ['temp_1_c', 'pressure_in_psi', 'flow_rate_bopd']:
        df.loc[dropout_idx, col] = np.nan
        
    # stuck_at (0.5%)
    stuck_idx = np.random.choice(n_rows, int(n_rows * 0.005), replace=False)
    df.loc[stuck_idx, 'quality_flag'] = 'out_of_range'
    for idx in stuck_idx:
        # freeze next 6-24 steps (30-120 min)
        freeze_len = np.random.randint(6, 25)
        end_idx = min(idx + freeze_len, n_rows)
        val = df.loc[idx, 'temp_1_c']
        df.loc[idx:end_idx-1, 'temp_1_c'] = val
        df.loc[idx:end_idx-1, 'quality_flag'] = 'out_of_range'
        
    # bias_drift (1%)
    bias_idx = np.random.choice(n_rows, int(n_rows * 0.01), replace=False)
    df.loc[bias_idx, 'quality_flag'] = 'ok'
    df.loc[bias_idx, 'temp_1_c'] += 5.0
    
    header = '''# Dataset: Baghewala Digital Twin - High-Resolution Sensor Telemetry Stream
# Version: 1.3.0
# Generated: 2026-08-27T13:55:00Z
# Description: 5-minute interval sensor telemetry for 2 wells across 1 CSS cycle each
# Schema: WellState Canonical v1.0 (Meso Domain - Streaming)
# Sampling: 5-minute intervals (~25,920 total records)
# Anomaly Injection: 1.5% dropout, 0.5% stuck-at, 1% bias drift
# Field: Baghewala, Jaisalmer, Rajasthan
# Random Seed: 42
'''
    os.makedirs(r'D:\Tel Pragati\dataset', exist_ok=True)
    with open(r'D:\Tel Pragati\dataset\sensor_telemetry_5min.csv', 'w', newline='') as f:
        f.write(header)
        df.to_csv(f, index=False)

if __name__ == '__main__':
    generate_telemetry()
