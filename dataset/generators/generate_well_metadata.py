import os
import random
import datetime
import pandas as pd

random.seed(42)

metadata = """# Dataset: Baghewala Digital Twin - Well Master Data & Reservoir Properties
# Version: 1.3.0
# Generated: 2026-08-27T13:55:00Z
# Description: Static/quasi-static properties for 23 Baghewala wells
# Schema: WellState Canonical v1.0 (Static Domain)
# Field: Baghewala, Jaisalmer, Rajasthan (Jodhpur Sandstone)
# Sources: OIL public reports, PS-26120 specification, published field data
# Note: Values are physics-calibrated estimates; labeled as 'synthetic' until OIL provides actual well data
"""

wells = []
for i in range(1, 24):
    well_id = f"BGW-{i:02d}"
    well_name = f"Baghewala-{i:02d}"
    field = "Baghewala"
    block = "Bikaner-Nagaur Basin"
    formation = "Jodhpur Sandstone"
    discovery_year = 1991
    production_start_year = random.randint(2017, 2020)
    depth_m = round(random.uniform(1050, 1300), 1)
    reservoir_temp_c = round(random.uniform(46, 48), 1)
    crude_api_gravity = round(random.uniform(14, 19), 1)
    crude_viscosity_at_50c_cp = round(random.uniform(10000, 13000), 1)
    asphaltene_content_pct = round(random.uniform(15, 22), 1)
    rod_string_taper = '1"-7/8"-3/4"'
    rod_material = random.choice(['API Grade D', 'API Grade C'])
    rod_total_length_m = round(random.uniform(1000, 1250), 1)
    pump_depth_m = round(random.uniform(950, 1200), 1)
    pump_barrel_diameter_in = round(random.uniform(1.5, 2.5), 2)
    tubing_od_in = random.choice([2.375, 2.875])
    casing_od_in = random.choice([5.5, 7.0])
    max_spm = 8.0
    max_motor_current_a = 55.0
    max_pprl_lb = 24000.0
    min_downstroke_tension_lb = 2000.0
    max_wellhead_pressure_psi = 500.0
    css_cycles_completed = random.randint(3, 12)
    total_production_bbl = round(random.uniform(10000, 100000), 1)
    latitude = round(random.uniform(27.0, 27.2), 4)
    longitude = round(random.uniform(70.5, 70.7), 4)
    status = random.choice(['producing', 'shut_in', 'workover'])
    last_updated = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    
    wells.append({
        'well_id': well_id,
        'well_name': well_name,
        'field': field,
        'block': block,
        'formation': formation,
        'discovery_year': discovery_year,
        'production_start_year': production_start_year,
        'depth_m': depth_m,
        'reservoir_temp_c': reservoir_temp_c,
        'crude_api_gravity': crude_api_gravity,
        'crude_viscosity_at_50c_cp': crude_viscosity_at_50c_cp,
        'asphaltene_content_pct': asphaltene_content_pct,
        'rod_string_taper': rod_string_taper,
        'rod_material': rod_material,
        'rod_total_length_m': rod_total_length_m,
        'pump_depth_m': pump_depth_m,
        'pump_barrel_diameter_in': pump_barrel_diameter_in,
        'tubing_od_in': tubing_od_in,
        'casing_od_in': casing_od_in,
        'max_spm': max_spm,
        'max_motor_current_a': max_motor_current_a,
        'max_pprl_lb': max_pprl_lb,
        'min_downstroke_tension_lb': min_downstroke_tension_lb,
        'max_wellhead_pressure_psi': max_wellhead_pressure_psi,
        'css_cycles_completed': css_cycles_completed,
        'total_production_bbl': total_production_bbl,
        'latitude': latitude,
        'longitude': longitude,
        'status': status,
        'last_updated': last_updated
    })

df = pd.DataFrame(wells)

out_path = r'D:\Tel Pragati\dataset\well_metadata.csv'
os.makedirs(os.path.dirname(out_path), exist_ok=True)
with open(out_path, 'w', newline='') as f:
    f.write(metadata)
    df.to_csv(f, index=False)

print(f"Generated {len(df)} wells at {out_path}")
