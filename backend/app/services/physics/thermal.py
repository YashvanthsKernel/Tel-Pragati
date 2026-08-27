"""
Thermal decay model for CSS (Cyclic Steam Stimulation) reservoirs.

Model: T(t) = T_ambient + (T_peak - T_ambient) * exp(-t / tau)
where tau is the thermal decay time constant fit per well.

Reference: Newton cooling / lumped energy balance approximation,
standard for reduced-order CSS thermal modeling.
Calibrated against: BGW-8 pilot data ranges from OIL published materials.
"""
import numpy as np
from dataclasses import dataclass
from typing import List, Dict
from scipy.optimize import curve_fit

@dataclass
class ThermalParameters:
    T_ambient: float
    T_peak: float
    tau_days: float
    inject_start_time: float = 0.0

class ThermalModel:
    DEFAULT_PARAMS = ThermalParameters(
        T_ambient=45.0,
        T_peak=220.0,
        tau_days=180.0,
        inject_start_time=0.0
    )

    def __init__(self, params: ThermalParameters = None):
        self.params = params or self.DEFAULT_PARAMS

    def compute_bht(self, t_days: float) -> float:
        """Compute bottomhole temperature at time t in days."""
        if t_days < self.params.inject_start_time:
            return self.params.T_ambient
        dt = t_days - self.params.inject_start_time
        return self.params.T_ambient + (self.params.T_peak - self.params.T_ambient) * np.exp(-dt / max(self.params.tau_days, 1e-6))

    def compute_bht_trend(self, t_days: float, window_h: float = 1.0) -> float:
        """Compute dT/dt in °C/day."""
        t1 = t_days
        t2 = t_days + window_h / 24.0
        T1 = self.compute_bht(t1)
        T2 = self.compute_bht(t2)
        return (T2 - T1) / (window_h / 24.0)

    def compute_thermal_curve(self, start_day: float, end_day: float, n_points: int = 100) -> List[Dict[str, float]]:
        """Compute an array of {day, bht_c, visc_cp}."""
        # For viscosity, we will just use a placeholder or assume caller handles it, 
        # but the prompt asks for it. We'll import viscosity.
        from .viscosity import ViscosityModel
        visc_model = ViscosityModel()
        
        days = np.linspace(start_day, end_day, n_points)
        curve = []
        for day in days:
            bht = self.compute_bht(day)
            visc = visc_model.compute_viscosity(bht)
            curve.append({
                "day": float(day),
                "bht_c": float(bht),
                "visc_cp": float(visc)
            })
        return curve

    def inject_energy(self, steam_vol_tons: float, steam_temp_c: float) -> ThermalParameters:
        """Update params after steam injection based on a lumped heat capacity model."""
        # Simple approximation: Delta T proportional to steam mass and temp diff
        mass_reservoir_eff = 10000.0 # Effective mass of near-wellbore tons
        heat_cap_ratio = 4.18 / 2.0 # Water to rock approx
        
        energy_added = steam_vol_tons * heat_cap_ratio * (steam_temp_c - self.params.T_ambient)
        delta_T = energy_added / mass_reservoir_eff
        
        new_peak = min(self.params.T_ambient + delta_T, steam_temp_c)
        self.params.T_peak = new_peak
        return self.params

    def estimate_tau_from_history(self, times: List[float], temps: List[float]) -> float:
        """Fit tau from observations."""
        if len(times) < 2:
            return self.params.tau_days
            
        def model(t, tau):
            return self.params.T_ambient + (self.params.T_peak - self.params.T_ambient) * np.exp(-t / tau)
            
        try:
            popt, _ = curve_fit(model, times, temps, p0=[self.params.tau_days], bounds=([10.0], [1000.0]))
            self.params.tau_days = float(popt[0])
            return self.params.tau_days
        except Exception:
            return self.params.tau_days
