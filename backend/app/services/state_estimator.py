"""
State estimator service. Fusion of physics and ML.
"""
from dataclasses import dataclass
from typing import Dict, Any, List
import numpy as np

from .physics.thermal import ThermalModel
from .physics.viscosity import ViscosityModel
from .physics.rod_mechanics import GibbsSolver
from .physics.rod_floating_risk import compute_rod_floating_risk_index

@dataclass
class ObservedState:
    surface_temp_c: float
    flow_bopd: float
    motor_current_a: float
    tank_level_pct: float

@dataclass
class InferredField:
    value: float
    trend: str
    confidence: float

@dataclass
class InferredState:
    bottomhole_temp_c: InferredField
    viscosity_cp: InferredField
    rod_drag_lb: InferredField
    downhole_fillage_pct: InferredField

@dataclass
class FusionMeta:
    agreement_pct: float
    divergence_pct: float
    physics_estimate: Dict[str, float]
    ml_estimate: Dict[str, float]

@dataclass
class WellStateEstimate:
    well_id: str
    css_cycle: int
    day: int
    phase: str
    observed: ObservedState
    inferred: InferredState
    fusion: FusionMeta
    rod_floating_risk_pct: float
    health_pct: float
    alerts: List[str]


class StateEstimatorService:
    def __init__(self):
        self.thermal = ThermalModel()
        self.viscosity = ViscosityModel()
        self.rod = GibbsSolver()

    def fuse_state(self, well_id: str, latest_telemetry: Dict[str, Any], latest_srp: Dict[str, Any], css_cycle: int) -> WellStateEstimate:
        """
        1. Run physics engine to get physics estimates
        2. Call ML inference service to get ML estimates (mocked here)
        3. Fuse with inverse-variance weighted average
        4. Compute agreement% and divergence%
        5. Compute rod floating risk index
        6. Compute health_pct from all signals
        """
        day = latest_telemetry.get("day", 1)
        phase = latest_telemetry.get("phase", "production")
        
        # 1. Physics Engine
        phys_bht = self.thermal.compute_bht(day)
        phys_visc = self.viscosity.compute_viscosity(phys_bht)
        
        spm = latest_srp.get("spm", 5.0)
        stroke = latest_srp.get("stroke_length_in", 120.0)
        surf_load = latest_srp.get("surface_load", [0]*100)
        surf_pos = latest_srp.get("surface_pos", [0]*100)
        
        rod_params = self.rod.DEFAULT_BAGHEWALA_ROD_PARAMS
        dh_load, dh_pos = self.rod.reconstruct_downhole_card(surf_load, surf_pos, rod_params, phys_visc)
        
        phys_drag = self.rod.compute_rod_drag(phys_visc, spm, stroke, rod_params.rod_length_ft)
        phys_fillage = self.rod.compute_fillage_pct(dh_load)
        phys_min_load = self.rod.compute_min_rod_load(dh_load)
        dt_dt_trend = self.thermal.compute_bht_trend(day)
        
        physics_est = {
            "bottomhole_temp_c": phys_bht,
            "viscosity_cp": phys_visc,
            "rod_drag_lb": phys_drag,
            "downhole_fillage_pct": phys_fillage
        }

        # 2. ML Inference (Mocked response for ML predictions)
        # In a real system, we would call the ML service
        ml_est = {
            "bottomhole_temp_c": phys_bht * np.random.uniform(0.95, 1.05),
            "viscosity_cp": phys_visc * np.random.uniform(0.90, 1.10),
            "rod_drag_lb": phys_drag * np.random.uniform(0.95, 1.05),
            "downhole_fillage_pct": phys_fillage * np.random.uniform(0.98, 1.02)
        }
        
        # 3. Fusion (Inverse variance weighting placeholder - using simple mean with assumed variances)
        var_phys = {"bottomhole_temp_c": 5.0, "viscosity_cp": 500.0, "rod_drag_lb": 100.0, "downhole_fillage_pct": 5.0}
        var_ml = {"bottomhole_temp_c": 8.0, "viscosity_cp": 800.0, "rod_drag_lb": 150.0, "downhole_fillage_pct": 8.0}
        
        fused = {}
        divergences = []
        for key in physics_est:
            w_phys = 1.0 / var_phys[key]
            w_ml = 1.0 / var_ml[key]
            fused[key] = (physics_est[key]*w_phys + ml_est[key]*w_ml) / (w_phys + w_ml)
            
            div = abs(physics_est[key] - ml_est[key]) / (abs(physics_est[key]) + 1e-6)
            divergences.append(div)
            
        avg_divergence = float(np.mean(divergences))
        agreement_pct = max(0.0, 100.0 * (1.0 - avg_divergence))

        def make_inferred(key: str, val: float, conf: float) -> InferredField:
            return InferredField(value=float(val), trend="stable", confidence=conf)

        inferred = InferredState(
            bottomhole_temp_c=make_inferred("bottomhole_temp_c", fused["bottomhole_temp_c"], agreement_pct),
            viscosity_cp=make_inferred("viscosity_cp", fused["viscosity_cp"], agreement_pct),
            rod_drag_lb=make_inferred("rod_drag_lb", fused["rod_drag_lb"], agreement_pct),
            downhole_fillage_pct=make_inferred("downhole_fillage_pct", fused["downhole_fillage_pct"], agreement_pct)
        )

        fusion = FusionMeta(
            agreement_pct=agreement_pct,
            divergence_pct=avg_divergence * 100.0,
            physics_estimate=physics_est,
            ml_estimate=ml_est
        )

        # 5. Risk
        buoyant_weight = rod_params.steel_density * (rod_params.rod_length_ft) * (np.pi * (rod_params.rod_diameter_in/24.0)**2) * 0.85
        risk = compute_rod_floating_risk_index(
            fused["rod_drag_lb"], buoyant_weight, phys_min_load, dt_dt_trend
        )

        # Populate observed state
        observed = ObservedState(
            surface_temp_c=latest_telemetry.get("surface_temp_c", 35.0),
            flow_bopd=latest_telemetry.get("flow_bopd", 10.0),
            motor_current_a=latest_srp.get("motor_current_a", 15.0),
            tank_level_pct=latest_telemetry.get("tank_level_pct", 50.0)
        )
        
        alerts = []
        if risk > 80.0: alerts.append("CRITICAL: High Rod Floating Risk")
        if fused["downhole_fillage_pct"] < 50.0: alerts.append("WARNING: Low Pump Fillage")

        est = WellStateEstimate(
            well_id=well_id,
            css_cycle=css_cycle,
            day=day,
            phase=phase,
            observed=observed,
            inferred=inferred,
            fusion=fusion,
            rod_floating_risk_pct=risk,
            health_pct=0.0, # computed next
            alerts=alerts
        )
        
        est.health_pct = self.compute_health_pct(est)
        return est

    def compute_health_pct(self, state_estimate: WellStateEstimate) -> float:
        """0-100% well health based on risk, fillage, and agreement."""
        health = 100.0
        health -= state_estimate.rod_floating_risk_pct * 0.5
        
        fillage = state_estimate.inferred.downhole_fillage_pct.value
        if fillage < 70.0:
            health -= (70.0 - fillage) * 0.5
            
        health -= (100.0 - state_estimate.fusion.agreement_pct) * 0.2
        return float(np.clip(health, 0.0, 100.0))
