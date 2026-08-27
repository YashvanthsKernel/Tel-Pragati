"""
Viscosity-temperature correlation.

μ(T) = μ_ref * exp[B * (1/T - 1/T_ref)]
Andrade/Arrhenius model calibrated against Baghewala crude (10,000-13,000 cP at 50°C)
"""
import numpy as np
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class ViscosityParameters:
    mu_ref: float
    B: float
    T_ref_k: float

class ViscosityModel:
    # Baghewala calibrated params: ~10,000 cP at 50 C, ~1,000 cP at 100 C
    # 50 C = 323.15 K, 100 C = 373.15 K
    BAGHEWALA_PARAMS = ViscosityParameters(
        mu_ref=10000.0,
        T_ref_k=323.15,
        B=5552.0  # Approximated to fit 1000 cP at 100 C
    )

    def __init__(self, params: ViscosityParameters = None):
        self.params = params or self.BAGHEWALA_PARAMS

    def compute_viscosity(self, T_celsius: float) -> float:
        """Compute viscosity in cP given temperature in Celsius."""
        T_k = max(T_celsius + 273.15, 273.15) # avoid div by zero, floor at 0 C
        return self.params.mu_ref * np.exp(self.params.B * (1.0 / T_k - 1.0 / self.params.T_ref_k))

    def compute_viscosity_curve(self, T_min: float = 40.0, T_max: float = 200.0, n_points: int = 100) -> List[Dict[str, float]]:
        """Compute an array of {temp_c, viscosity_cp}."""
        temps = np.linspace(T_min, T_max, n_points)
        curve = []
        for T in temps:
            curve.append({
                "temp_c": float(T),
                "viscosity_cp": float(self.compute_viscosity(T))
            })
        return curve

    def compute_mobility(self, T_celsius: float, permeability_md: float = 50.0) -> float:
        """Compute relative mobility index (k/mu)."""
        mu = self.compute_viscosity(T_celsius)
        if mu <= 0:
            return 0.0
        return permeability_md / mu

    @classmethod
    def fit_from_anchor_points(cls, T1_c: float, mu1_cp: float, T2_c: float, mu2_cp: float) -> ViscosityParameters:
        """Fit Arrhenius parameters from two temperature-viscosity points."""
        T1_k = T1_c + 273.15
        T2_k = T2_c + 273.15
        
        # mu1 = mu_ref (at T1_k) => mu_ref = mu1, T_ref_k = T1_k
        # mu2 = mu1 * exp(B * (1/T2_k - 1/T1_k))
        # ln(mu2/mu1) = B * (1/T2_k - 1/T1_k)
        
        inv_T_diff = (1.0 / T2_k - 1.0 / T1_k)
        if abs(inv_T_diff) < 1e-9:
            B = 0.0
        else:
            B = np.log(mu2_cp / mu1_cp) / inv_T_diff
            
        return ViscosityParameters(
            mu_ref=mu1_cp,
            T_ref_k=T1_k,
            B=B
        )
