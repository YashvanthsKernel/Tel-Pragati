import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

np.random.seed(42)

def generate_css_cycles():
    wells = ['BGW-04', 'BGW-05', 'BGW-08', 'BGW-11', 'BGW-15']
    records = []
    
    for well in wells:
        start_time = datetime(2025, 1, 1)
        for cycle_num in range(1, 4):
            inject_dur = np.random.uniform(5, 21)
            soak_dur = np.random.uniform(2, 10)
            produce_dur = np.random.uniform(30, 90)
            
            inject_start = start_time
            inject_end = inject_start + timedelta(days=inject_dur)
            soak_start = inject_end
            soak_end = soak_start + timedelta(days=soak_dur)
            produce_start = soak_end
            produce_end = produce_start + timedelta(days=produce_dur)
            
            total_days = inject_dur + soak_dur + produce_dur
            
            steam_vol = np.random.uniform(500, 3000)
            total_oil = np.random.uniform(1000, 5000)
            
            record = {
                'cycle_id': f"CYC-{np.random.randint(100, 999)}",
                'well_id': well,
                'cycle_number': cycle_num,
                'inject_start': inject_start.strftime('%Y-%m-%dT%H:%M:%SZ'),
                'inject_end': inject_end.strftime('%Y-%m-%dT%H:%M:%SZ'),
                'soak_start': soak_start.strftime('%Y-%m-%dT%H:%M:%SZ'),
                'soak_end': soak_end.strftime('%Y-%m-%dT%H:%M:%SZ'),
                'produce_start': produce_start.strftime('%Y-%m-%dT%H:%M:%SZ'),
                'produce_end': produce_end.strftime('%Y-%m-%dT%H:%M:%SZ'),
                'inject_duration_days': round(inject_dur, 2),
                'soak_duration_days': round(soak_dur, 2),
                'produce_duration_days': round(produce_dur, 2),
                'total_cycle_days': round(total_days, 2),
                'steam_volume_m3': round(steam_vol, 2),
                'steam_temp_c': round(np.random.uniform(250, 320), 1),
                'steam_pressure_kg_cm2': round(np.random.uniform(80, 120), 1),
                'steam_quality_pct': round(np.random.uniform(65, 85), 1),
                'peak_bht_c': round(np.random.uniform(140, 220), 1),
                'thermal_tau_days': round(np.random.uniform(10, 18), 1),
                'total_oil_produced_bbl': round(total_oil, 2),
                'total_water_produced_bbl': round(total_oil * np.random.uniform(0.5, 2.0), 2),
                'cycle_sor': round((steam_vol * 6.29) / total_oil, 2), # approx bbl steam / bbl oil
                'peak_oil_rate_bopd': round(total_oil / produce_dur * 2, 2),
                'cutoff_oil_rate_bopd': round(np.random.uniform(10, 30), 2),
                'cutoff_reason': np.random.choice(['economic', 'rod_risk', 'scheduled', 'manual']),
                'energy_consumed_kwh': round(np.random.uniform(5000, 20000), 2),
                'cycle_net_value_inr': round(np.random.uniform(100000, 500000), 2),
                'source': 'synthetic'
            }
            records.append(record)
            start_time = produce_end + timedelta(days=np.random.uniform(10, 30))
            
    df = pd.DataFrame(records)
    
    header = '''# Dataset: Baghewala Digital Twin - CSS Cycle Configuration Records
# Version: 1.3.0
# Generated: 2026-08-27T13:55:00Z
# Description: CSS cycle-level configuration and performance records
# Schema: WellState Canonical v1.0 (Episodic Domain)
# Field: Baghewala, Jaisalmer, Rajasthan
# Wells: BGW-04, BGW-05, BGW-08, BGW-11, BGW-15
# Random Seed: 42
'''
    os.makedirs(r'D:\Tel Pragati\dataset', exist_ok=True)
    with open(r'D:\Tel Pragati\dataset\css_cycle_records.csv', 'w', newline='') as f:
        f.write(header)
        df.to_csv(f, index=False)

if __name__ == '__main__':
    generate_css_cycles()
