import pandas as pd
import numpy as np
import datetime
from pathlib import Path

# Set random seed for reproducibility
np.random.seed(42)

WELLS = ['BGW-04', 'BGW-05', 'BGW-08', 'BGW-11', 'BGW-15']
NUM_CYCLES = 3
T_AMB = 47.0
T_REF = 180 + 273.15
MU_REF = 50.0
B = 5500.0  # Viscosity calibration

HEADER = """# Dataset: Baghewala Digital Twin - CSS Production Daily Telemetry
# Version: 1.3.0
# Generated: 2026-08-27T13:55:00Z
# Description: Multi-cycle daily production data for 5 wells across 3 CSS cycles each
# Schema: WellState Canonical v1.0 (Macro Domain)
# Physics Models: Boberg-Lantz Thermal Decay, Andrade-Arrhenius Viscosity, Vogel IPR
# Field: Baghewala, Jaisalmer, Rajasthan (Jodhpur Sandstone)
# Wells: BGW-04, BGW-05, BGW-08, BGW-11, BGW-15
# Cycles: 3 per well (15 total)
# Reservoir Temp: 46-48°C | Crude API: 17-19° | Peak BHT: 140-220°C
# Random Seed: 42 | Noise: 2% Gaussian | Missing: 2% | Out-of-range: 1%
"""

def generate_viscosity(T_C):
    T_K = T_C + 273.15
    return MU_REF * np.exp(B * (1/T_K - 1/T_REF))

def main():
    records = []
    
    start_date = datetime.datetime(2025, 1, 1, tzinfo=datetime.timezone.utc)
    
    cycle_counter = 1
    for well in WELLS:
        current_date = start_date + datetime.timedelta(days=np.random.randint(0, 60))
        tau = np.random.uniform(10, 18)
        
        for cycle in range(1, NUM_CYCLES + 1):
            cycle_id = f"CYC-{cycle_counter:03d}"
            cycle_counter += 1
            
            inj_days = np.random.randint(5, 16)
            soak_days = np.random.randint(2, 8)
            prod_days = np.random.randint(25, 91)
            
            cumulative_oil = 0.0
            cumulative_steam = 0.0
            
            t_peak = np.random.uniform(140, 220)
            
            for day in range(1, inj_days + soak_days + prod_days + 1):
                ts = current_date.isoformat()
                current_date += datetime.timedelta(days=1)
                
                if day <= inj_days:
                    phase = 'inject'
                elif day <= inj_days + soak_days:
                    phase = 'soak'
                else:
                    phase = 'produce'
                    
                # Base variables
                surface_temp_c = np.nan
                injection_temp_c = np.nan
                bht_c = np.nan
                viscosity = np.nan
                oil_rate = 0.0
                water_cut = np.nan
                gross_fluid = 0.0
                sor_inst = 0.0
                p_in = np.nan
                p_out = np.nan
                spm_val = np.nan
                motor_current = np.nan
                energy_kwh = 0.0
                fmi = np.nan
                rod_risk = 0.0
                op_state = 'Normal'
                net_val = 0.0
                
                if phase == 'inject':
                    injection_temp_c = np.random.uniform(250, 320)
                    steam_inj = np.random.uniform(100, 300)
                    cumulative_steam += steam_inj
                    op_state = 'Normal'
                
                elif phase == 'soak':
                    op_state = 'Normal'
                    
                elif phase == 'produce':
                    t_prod = day - inj_days - soak_days
                    bht_c = T_AMB + (t_peak - T_AMB) * np.exp(-t_prod / tau)
                    surface_temp_c = bht_c - np.random.uniform(10, 20)
                    if surface_temp_c < 35: surface_temp_c = 35.0
                    
                    viscosity = generate_viscosity(bht_c)
                    
                    base_oil = 150 * np.exp(-t_prod / (tau * 0.8))
                    oil_rate = max(0, base_oil + np.random.normal(0, 5))
                    
                    water_cut = np.random.uniform(25, 85)
                    gross_fluid = oil_rate / (1 - water_cut/100.0) if water_cut < 100 else 0
                    
                    cumulative_oil += oil_rate
                    
                    sor_inst = (cumulative_steam / max(1, cumulative_oil)) * np.random.uniform(0.8, 1.2)
                    if oil_rate < 8 or sor_inst > 12:
                        op_state = 'CSS_Cutoff_Triggered'
                        
                    p_in = np.random.uniform(50, 500)
                    p_out = np.random.uniform(30, 200)
                    spm_val = np.random.uniform(4, 8)
                    motor_current = np.random.uniform(15, 55)
                    energy_kwh = motor_current * 2.5
                    
                    fmi = max(0.01, min(1.0, 1.0 - (viscosity / 6000.0)))
                    
                    if fmi < 0.15:
                        op_state = 'Rod_Floating_Critical'
                        rod_risk = 100.0
                    elif fmi < 0.35:
                        op_state = 'Rod_Floating_Warning'
                        rod_risk = (0.35 - fmi) / 0.20 * 100.0
                    elif viscosity > 3000:
                        op_state = 'High_Viscous_Drag'
                        rod_risk = np.random.uniform(10, 30)
                        
                    net_val = oil_rate * 5000 - energy_kwh * 10
                    
                if phase == 'produce':
                    bht_c *= np.random.normal(1.0, 0.02)
                    viscosity *= np.random.normal(1.0, 0.02)
                    spm_val *= np.random.normal(1.0, 0.02)
                
                quality_flag = 'ok'
                rand_q = np.random.rand()
                if rand_q < 0.02:
                    quality_flag = 'missing'
                    oil_rate = np.nan
                elif rand_q < 0.03:
                    quality_flag = 'out_of_range'
                    bht_c = 999.9
                
                sor_cum = cumulative_steam / max(1, cumulative_oil)
                
                record = {
                    'well_id': well,
                    'cycle_id': cycle_id,
                    'cycle_number': cycle,
                    'ts': ts,
                    'cycle_day': float(day),
                    'phase': phase,
                    'surface_temp_c': surface_temp_c,
                    'injection_temp_c': injection_temp_c,
                    'bottomhole_temp_c_estimated': bht_c,
                    'viscosity_cp': viscosity,
                    'oil_rate_bopd': oil_rate,
                    'water_cut_pct': water_cut,
                    'gross_fluid_bpd': gross_fluid,
                    'sor_instantaneous': sor_inst if phase=='produce' else np.nan,
                    'sor_cumulative': sor_cum if phase=='produce' else np.nan,
                    'cumulative_oil_bbl': cumulative_oil,
                    'cumulative_steam_m3': cumulative_steam,
                    'pressure_in_psi': p_in,
                    'pressure_out_psi': p_out,
                    'spm': spm_val,
                    'motor_current_a': motor_current,
                    'energy_kwh_day': energy_kwh,
                    'fmi': fmi,
                    'rod_floating_risk_pct': rod_risk,
                    'operating_state': op_state,
                    'net_value_inr_day': net_val,
                    'source': 'synthetic',
                    'quality_flag': quality_flag,
                    'label_source': 'ground_truth'
                }
                records.append(record)
                
    df = pd.DataFrame(records)
    
    output_path = Path(r"D:\Tel Pragati\dataset\css_production_daily.csv")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(HEADER)
        df.to_csv(f, index=False)

if __name__ == "__main__":
    main()
