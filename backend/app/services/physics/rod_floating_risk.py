"""
Composite rod floating risk index.
RiskIndex = w1*(ViscousDrag/BuoyantWeight) + w2*(ΔCompressionMargin) + w3*(dT/dt_trend)
"""
import numpy as np

def compute_rod_floating_risk_index(viscous_drag_lb: float, 
                                    buoyant_weight_lb: float, 
                                    min_rod_load_lb: float, 
                                    dt_dt_trend_c_day: float) -> float:
    """
    Computes a 0-100% risk index for rod floating based on calibrated weights.
    """
    if buoyant_weight_lb <= 0:
        return 100.0
        
    w1, w2, w3 = 0.5, 0.3, 0.2
    
    # 1. Viscous Drag to Buoyant Weight ratio (0 to 1 scale, cap at 1)
    drag_ratio = np.clip(viscous_drag_lb / buoyant_weight_lb, 0.0, 1.0)
    
    # 2. Compression Margin: if min_rod_load goes negative, we have compression.
    # We want risk to increase as min_rod_load goes to 0 and below.
    # Scale: 0 risk at min_load > 2000, 1 risk at min_load < 0
    comp_margin = np.clip((2000.0 - min_rod_load_lb) / 2000.0, 0.0, 1.0)
    
    # 3. Temperature cooling trend (negative dT/dt increases viscosity rapidly)
    # Scale: 0 risk if heating or steady (>=0), 1 risk if cooling fast (< -2 C/day)
    cooling_trend = np.clip(-dt_dt_trend_c_day / 2.0, 0.0, 1.0)
    
    risk_score = (w1 * drag_ratio + w2 * comp_margin + w3 * cooling_trend) * 100.0
    return float(np.clip(risk_score, 0.0, 100.0))
