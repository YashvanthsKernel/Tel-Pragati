import os
import random
import datetime
import numpy as np
import pandas as pd

np.random.seed(42)
random.seed(42)

metadata = """# Dataset: Baghewala Digital Twin - Maintenance & Failure Event Log
# Version: 1.3.0
# Generated: 2026-08-27T13:55:00Z
# Description: 150 maintenance/failure events across 5 wells over 3 years
# Schema: WellState Canonical v1.0 (Event Domain)
# Label Source: weak (derived from workover logs, not direct observation)
# Event Types: 8 categories | Severity Levels: critical/warning/info
# Field: Baghewala, Jaisalmer, Rajasthan
# Random Seed: 42
"""

wells = ['BGW-04', 'BGW-05', 'BGW-08', 'BGW-11', 'BGW-15']
event_types = ['rod_failure', 'pump_unseating', 'tubing_split', 'gear_failure', 'valve_replacement', 'workover', 'routine_maintenance', 'interlock_trip']
weights = [30, 15, 3, 2, 8, 7, 20, 15] # percentages

severities = {
    'rod_failure': 'critical',
    'pump_unseating': 'warning',
    'tubing_split': 'critical',
    'gear_failure': 'critical',
    'valve_replacement': 'warning',
    'workover': 'critical',
    'routine_maintenance': 'info',
    'interlock_trip': 'warning'
}

root_causes_map = {
    'rod_failure': ['high_viscosity', 'mechanical_fatigue', 'thermal_stress'],
    'pump_unseating': ['high_viscosity', 'operator_error', 'unknown'],
    'tubing_split': ['corrosion', 'mechanical_fatigue'],
    'gear_failure': ['mechanical_fatigue', 'unknown'],
    'valve_replacement': ['corrosion', 'thermal_stress'],
    'workover': ['high_viscosity', 'unknown'],
    'routine_maintenance': ['unknown'],
    'interlock_trip': ['operator_error', 'unknown']
}

corrective_actions_map = {
    'rod_failure': ['rod_replacement'],
    'pump_unseating': ['pump_reset'],
    'tubing_split': ['tubing_repair'],
    'gear_failure': ['gear_replacement'],
    'valve_replacement': ['valve_swap'],
    'workover': ['parameter_adjustment', 'tubing_repair'],
    'routine_maintenance': ['parameter_adjustment'],
    'interlock_trip': ['parameter_adjustment']
}

start_date = datetime.datetime(2023, 8, 27, tzinfo=datetime.timezone.utc)
end_date = datetime.datetime(2026, 8, 27, tzinfo=datetime.timezone.utc)
total_days = (end_date - start_date).days

events = []
well_last_event_date = {w: None for w in wells}
n_events = 150

# Ensure exactly 150 events
chosen_types = random.choices(event_types, weights=weights, k=n_events)

for i in range(n_events):
    well_id = random.choice(wells)
    
    # Generate timestamp
    days_offset = random.uniform(0, total_days)
    ts = start_date + datetime.timedelta(days=days_offset)
    
    event_type = chosen_types[i]
    severity = severities[event_type]
    
    cycle_id = f"CYC-{random.randint(1, 15):03d}"
    cycle_day = round(random.uniform(5, 60), 1)
    
    failure_depth_m = None
    if event_type == 'rod_failure':
        failure_depth_m = round(random.uniform(200, 1150), 1)
        
    description = f"{event_type.replace('_', ' ').title()} occurred on well {well_id}"
    downtime_hours = round(random.uniform(2, 168), 1)
    repair_cost_inr = round(random.uniform(5000, 500000), 2)
    
    root_cause = random.choice(root_causes_map[event_type])
    corrective_action = random.choice(corrective_actions_map[event_type])
    
    if event_type == 'rod_failure':
        preceding_fmi = round(random.uniform(0.05, 0.14), 3) # critical < 0.15
        preceding_viscosity_cp = round(random.uniform(5000, 12000), 1)
    else:
        preceding_fmi = round(random.uniform(0.15, 0.5), 3)
        preceding_viscosity_cp = round(random.uniform(50, 5000), 1)
        
    preceding_spm = round(random.uniform(4, 8), 1)
    preceding_motor_current_a = round(random.uniform(20, 55), 1)
    
    mtbf_days = None
    if well_last_event_date[well_id] is not None:
        if ts > well_last_event_date[well_id]:
            mtbf_days = round((ts - well_last_event_date[well_id]).total_seconds() / 86400, 1)
        else:
            mtbf_days = round((well_last_event_date[well_id] - ts).total_seconds() / 86400, 1)
            
    if well_last_event_date[well_id] is None or ts > well_last_event_date[well_id]:
        well_last_event_date[well_id] = ts
        
    events.append({
        'event_id': f"EVT-{i+1:05d}",
        'well_id': well_id,
        'cycle_id': cycle_id,
        'ts': ts.strftime('%Y-%m-%dT%H:%M:%SZ'),
        'cycle_day': cycle_day,
        'event_type': event_type,
        'severity': severity,
        'failure_depth_m': failure_depth_m,
        'description': description,
        'downtime_hours': downtime_hours,
        'repair_cost_inr': repair_cost_inr,
        'root_cause': root_cause,
        'preceding_fmi': preceding_fmi,
        'preceding_viscosity_cp': preceding_viscosity_cp,
        'preceding_spm': preceding_spm,
        'preceding_motor_current_a': preceding_motor_current_a,
        'corrective_action': corrective_action,
        'mtbf_days': mtbf_days,
        'label_source': 'weak',
        'source': 'synthetic'
    })

# Sort by timestamp
events = sorted(events, key=lambda x: x['ts'])
df = pd.DataFrame(events)

# recalculate MTBF based on sorted events per well
df['ts'] = pd.to_datetime(df['ts'])
df = df.sort_values(by=['well_id', 'ts'])
df['mtbf_days'] = df.groupby('well_id')['ts'].diff().dt.total_seconds() / 86400
df['mtbf_days'] = df['mtbf_days'].round(1)
df['ts'] = df['ts'].dt.strftime('%Y-%m-%dT%H:%M:%SZ')
df = df.sort_values(by='ts')

out_path = r'D:\Tel Pragati\dataset\maintenance_failure_logs.csv'
os.makedirs(os.path.dirname(out_path), exist_ok=True)
with open(out_path, 'w', newline='') as f:
    f.write(metadata)
    df.to_csv(f, index=False)

print(f"Generated {len(df)} events at {out_path}")
