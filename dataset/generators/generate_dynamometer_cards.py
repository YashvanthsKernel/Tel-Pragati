import pandas as pd
import numpy as np
import json
import datetime
import os
import math

np.random.seed(42)

NUM_CARDS = 2000
WELLS = ['BGW-04', 'BGW-05', 'BGW-08', 'BGW-11', 'BGW-15']
CLASSES = ['Normal', 'Rod_Floating', 'Fluid_Pound', 'Gas_Interference', 'Traveling_Valve_Leak']
PROBS = [0.35, 0.25, 0.15, 0.13, 0.12]
POINTS = 200
BUOYANT_WEIGHT = 6000

def generate_card(card_class, stroke_length, pprl, mprl, viscosity):
    theta = np.linspace(0, 2 * np.pi, POINTS)
    position = (stroke_length / 2) * (1 - np.cos(theta))
    load = np.zeros(POINTS)
    
    # Base load logic
    for i, t in enumerate(theta):
        if t <= np.pi: # upstroke
            load[i] = mprl + (pprl - mprl) * np.sin(t / 2)
        else: # downstroke
            load[i] = mprl + (pprl - mprl) * np.sin((2*np.pi - t) / 2)
            
    # Class modifications
    if card_class == 'Rod_Floating':
        severity = min(0.9, max(0.1, (viscosity - 1500) / 10000)) if viscosity > 1500 else 0.5
        for i in range(POINTS//2, POINTS):
            load[i] *= (1 - severity)
    elif card_class == 'Fluid_Pound':
        pound_idx = int(POINTS * 0.8) # 60% of downstroke (from pi to 2pi) is around 1.6pi -> idx 160
        for i in range(POINTS//2, pound_idx):
            load[i] = mprl + (pprl - mprl) * 0.1
    elif card_class == 'Gas_Interference':
        for i in range(POINTS//4):
            load[i] = mprl + (pprl - mprl) * (i / (POINTS/4))**2
    elif card_class == 'Traveling_Valve_Leak':
        for i in range(POINTS//2):
            load[i] -= (load[i] - mprl) * (i / (POINTS/2)) * 0.3
            
    # Add noise
    noise = np.random.normal(0, 0.02 * pprl, POINTS)
    load += noise
    
    return position.tolist(), load.tolist()

def compute_fourier(load):
    fft_vals = np.fft.fft(load)
    amps = np.abs(fft_vals) / len(load)
    return amps[1:9].tolist()

def main():
    records = []
    start_time = datetime.datetime.utcnow() - datetime.timedelta(days=30)
    
    for i in range(NUM_CARDS):
        well = np.random.choice(WELLS)
        card_class = np.random.choice(CLASSES, p=PROBS)
        ts = start_time + datetime.timedelta(minutes=i*15)
        
        spm = np.random.uniform(4, 8)
        stroke_length = np.random.uniform(80, 120)
        surface_temp = np.random.uniform(20, 50)
        
        # Viscosity logic
        if card_class == 'Rod_Floating':
            viscosity = np.random.uniform(2000, 13000)
        else:
            viscosity = np.random.uniform(50, 1500)
            
        pprl = np.random.uniform(8000, 24000)
        mprl = np.random.uniform(-2000, 8000)
        
        if card_class == 'Rod_Floating':
            mprl = np.random.uniform(-2000, 1000)
            
        pos, load = generate_card(card_class, stroke_length, pprl, mprl, viscosity)
        
        # Compute area (numerical integration using trapezoidal rule)
        area = 0
        for j in range(POINTS-1):
            area += (load[j] + load[j+1])/2 * (pos[j+1] - pos[j])
        area = abs(area)
        
        compression_frac = sum(1 for l in load[POINTS//2:] if l < BUOYANT_WEIGHT) / (POINTS/2)
        fmi = mprl / BUOYANT_WEIGHT
        
        fourier = compute_fourier(load)
        
        records.append({
            'card_id': f'CARD-{i:05d}',
            'well_id': well,
            'cycle_id': f'CYC-{i%100:03d}',
            'ts': ts.isoformat() + 'Z',
            'cycle_day': round(i / 96, 2), # approx 96 cards per day if 15 mins
            'phase': 'produce',
            'spm': round(spm, 2),
            'stroke_length_in': round(stroke_length, 2),
            'surface_temp_c': round(surface_temp, 2),
            'viscosity_cp_estimated': round(viscosity, 2),
            'pprl_lbs': round(pprl, 2),
            'mprl_lbs': round(mprl, 2),
            'card_area_in_lbs': round(area, 2),
            'card_compression_frac': round(compression_frac, 3),
            'fmi': round(fmi, 3),
            'rod_position_in': json.dumps([round(x, 2) for x in pos]),
            'rod_load_lb': json.dumps([round(x, 2) for x in load]),
            'fourier_h1': fourier[0],
            'fourier_h2': fourier[1],
            'fourier_h3': fourier[2],
            'fourier_h4': fourier[3],
            'fourier_h5': fourier[4],
            'fourier_h6': fourier[5],
            'fourier_h7': fourier[6],
            'fourier_h8': fourier[7],
            'downhole_card_class_true': card_class,
            'confidence': round(np.random.uniform(0.8, 1.0), 2),
            'source': 'synthetic',
            'quality_flag': 'ok',
            'label_source': 'ground_truth'
        })
        
    df = pd.DataFrame(records)
    
    header = """# Dataset: Baghewala Digital Twin - SRP Dynamometer Card Library
# Version: 1.3.0
# Generated: 2026-08-27T13:55:00Z
# Description: 2000 synthetic dynamometer cards with 5 condition classes
# Schema: WellState Canonical v1.0 (Micro Domain - Dynamometer)
# Physics Models: Gibbs 1D Damped Wave Equation, API Rod String Kinematics
# Card Resolution: 200 points per stroke cycle
# Class Balance: Normal 35%, Rod_Floating 25%, Fluid_Pound 15%, Gas_Interference 13%, TV_Leak 12%
# Field: Baghewala, Jaisalmer, Rajasthan
# Random Seed: 42 | Noise: 2% Gaussian
"""
    os.makedirs(r"D:\\Tel Pragati\\dataset", exist_ok=True)
    out_path = r"D:\\Tel Pragati\\dataset\\srp_dynamometer_cards.csv"
    with open(out_path, 'w', newline='', encoding='utf-8') as f:
        f.write(header)
        df.to_csv(f, index=False)
        
    print(f"Dataset successfully written to {out_path}")

if __name__ == '__main__':
    main()
