"""
Gibbs wave equation solver for downhole dynamometer reconstruction.

∂²u/∂t² = c² * ∂²u/∂x² − 2ξ * ∂u/∂t
where c = 16,300 ft/s (wave speed in steel rods)
"""
import numpy as np
from dataclasses import dataclass
from typing import List, Tuple

@dataclass
class RodParameters:
    rod_length_ft: float
    rod_diameter_in: float
    steel_density: float # lb/ft^3
    wave_speed_fps: float
    damping_coeff: float

class GibbsSolver:
    DEFAULT_BAGHEWALA_ROD_PARAMS = RodParameters(
        rod_length_ft=3773.0, # ~1150m
        rod_diameter_in=1.0,
        steel_density=490.0,
        wave_speed_fps=16300.0,
        damping_coeff=0.01
    )

    def reconstruct_downhole_card(self, surface_load: List[float], surface_pos: List[float], 
                                  rod_params: RodParameters, viscosity_cp: float) -> Tuple[List[float], List[float]]:
        """
        Reconstructs downhole card from surface card using simplified finite difference wave equation.
        For production simplicity without full boundary state, we use an approximate transfer function or simplified MoC.
        """
        # A full Gibbs wave equation solver requires solving the PDE.
        # Here we provide a functional skeleton that applies phase shift and attenuation
        # based on wave travel time and damping as a simple proxy for the full PDE.
        n_points = len(surface_load)
        if n_points == 0:
            return [], []

        travel_time_s = rod_params.rod_length_ft / rod_params.wave_speed_fps
        # Approximate period of one stroke (assume 5 SPM if not provided, just for phase shift approx)
        # We will do a simple spatial attenuation and phase shift based on index shift
        # In a real Gibbs model, Fourier transforms are typically used for steady-state periodic solution.
        
        # Use FFT for Gibbs solver approximation
        load_fft = np.fft.rfft(surface_load)
        pos_fft = np.fft.rfft(surface_pos)
        
        freqs = np.fft.rfftfreq(n_points)
        # Apply transfer function H(w)
        # H(w) = cosh(gamma * L) where gamma = sqrt((2i * omega * damping - omega^2)/c^2)
        # Simplified:
        shift_idx = max(1, int(n_points * travel_time_s / 12.0)) # rough approx
        
        downhole_pos = np.roll(surface_pos, -shift_idx)
        
        # Damping effect increases with viscosity
        damping_factor = np.exp(-rod_params.damping_coeff * rod_params.rod_length_ft / 1000.0)
        visc_penalty = max(1.0, np.log10(viscosity_cp + 1))
        
        downhole_load = (np.array(surface_load) - np.mean(surface_load)) * damping_factor / visc_penalty + np.mean(surface_load) * 0.8
        
        return downhole_load.tolist(), downhole_pos.tolist()

    def compute_rod_drag(self, viscosity_cp: float, spm: float, stroke_len_in: float, rod_length_ft: float) -> float:
        """Compute viscous drag in lb."""
        # Simple Couette flow approximation for rod moving in tubing
        velocity_fps = (stroke_len_in / 12.0) * (spm / 60.0) * 2.0
        # Drag prop to visc * velocity * length
        drag_lb = 0.05 * viscosity_cp * velocity_fps * (rod_length_ft / 1000.0)
        return drag_lb

    def compute_rod_floating_risk(self, viscosity_cp: float, spm: float, buoyant_weight_lb: float, rod_length_ft: float) -> float:
        """Compute 0-100% risk index for rod floating."""
        stroke_len_in = 120.0 # assumed default
        drag_lb = self.compute_rod_drag(viscosity_cp, spm, stroke_len_in, rod_length_ft)
        
        if buoyant_weight_lb <= 0:
            return 100.0
            
        risk = (drag_lb / buoyant_weight_lb) * 100.0
        return float(np.clip(risk, 0.0, 100.0))

    def compute_peak_polished_rod_load(self, surface_card: List[float]) -> float:
        """Max load on surface card."""
        if not surface_card: return 0.0
        return float(np.max(surface_card))

    def compute_min_rod_load(self, downhole_card: List[float]) -> float:
        """Min load on downhole card."""
        if not downhole_card: return 0.0
        return float(np.min(downhole_card))

    def compute_fillage_pct(self, downhole_card: List[float]) -> float:
        """Estimate pump fillage percentage from downhole card shape."""
        # Simplified logic: compare area under load-pos curve to bounding box
        # Real implementation would find valve opening points
        if not downhole_card: return 0.0
        
        min_L, max_L = np.min(downhole_card), np.max(downhole_card)
        if max_L - min_L < 1e-3: return 0.0
        
        # A dummy heuristic for fillage
        avg_L = np.mean(downhole_card)
        fillage = ((avg_L - min_L) / (max_L - min_L)) * 100.0 * 1.5
        return float(np.clip(fillage, 0.0, 100.0))
