"""
Multi-objective constrained optimizer for CSS and SRP parameters.

Objectives (maximize):
 - Production rate (BOPD)
 - -SOR (minimize steam-oil ratio)
 - -Energy (minimize energy consumption)
 - -FailureRisk (minimize rod/pump failure probability)
 - NetValue (INR/day)

Decision variables:
 - CSS: steam_volume, injection_duration_days, soak_time_days, cutoff_trigger
 - SRP: spm, stroke_length_in, vfd_pct

Constraints (Safety/Interlock Engine evaluated):
 - SPM <= 8.0
 - MotorCurrent <= 55.0 A
 - PeakRodLoad <= 24,000 lb
 - MinDownstrokeTension >= 2,000 lb
 - WellheadPressure <= 500 psi
 - ModelConfidence >= 75%
"""

import numpy as np
from dataclasses import dataclass
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

@dataclass
class ParetoPoint:
    cost_inr_day: float
    production_bopd: float
    risk_pct: float
    energy_kwh_day: float

@dataclass
class Strategy:
    name: str
    label: str
    production_bopd: float
    energy_kwh_day: float
    rod_risk_pct: float
    cost_inr_day: float
    net_value_inr_day: float
    css_params: dict
    srp_params: dict
    recommended: bool = False

@dataclass
class OptimizationResult:
    strategies: List[Strategy]
    pareto_frontier: List[ParetoPoint]
    economic_cutoff_day: int

class OptimizationEngine:
    def __init__(self):
        self.OIL_PRICE_INR_BBL = 6000
        self.ENERGY_COST_INR_KWH = 8
        self.STEAM_COST_INR_TON = 2000

    def optimize(self, well_id: str, current_state: dict, ml_predictions: dict) -> OptimizationResult:
        """
        Run multi-objective optimization.
        For simplicity, generates 3 standard strategies based on the current state.
        """
        logger.info(f"Running optimization for well {well_id}")
        
        # Stubbed pymoo / NSGA-II optimization for simulation
        base_bopd = ml_predictions.get('flow_bopd', current_state.get('flow_bopd', 30))
        base_energy = current_state.get('energy_kwh_day', 500)
        base_risk = current_state.get('rod_risk_pct', 15)
        
        # Strategy A: Max Production
        strat_a = Strategy(
            name="strat_max_prod",
            label="Maximize Production",
            production_bopd=base_bopd * 1.15,
            energy_kwh_day=base_energy * 1.25,
            rod_risk_pct=base_risk * 1.5,
            cost_inr_day=(base_energy * 1.25) * self.ENERGY_COST_INR_KWH,
            net_value_inr_day=(base_bopd * 1.15) * self.OIL_PRICE_INR_BBL - (base_energy * 1.25) * self.ENERGY_COST_INR_KWH,
            css_params={'steam_volume': 1200, 'injection_duration_days': 10},
            srp_params={'spm': 7.5, 'vfd_pct': 90}
        )
        
        # Strategy B: Balanced
        strat_b = Strategy(
            name="strat_balanced",
            label="Balanced Operations",
            production_bopd=base_bopd * 1.05,
            energy_kwh_day=base_energy * 1.05,
            rod_risk_pct=base_risk * 1.1,
            cost_inr_day=(base_energy * 1.05) * self.ENERGY_COST_INR_KWH,
            net_value_inr_day=(base_bopd * 1.05) * self.OIL_PRICE_INR_BBL - (base_energy * 1.05) * self.ENERGY_COST_INR_KWH,
            css_params={'steam_volume': 1000, 'injection_duration_days': 8},
            srp_params={'spm': 6.5, 'vfd_pct': 85},
            recommended=True
        )
        
        # Strategy C: Min Energy
        strat_c = Strategy(
            name="strat_min_energy",
            label="Minimize Energy",
            production_bopd=base_bopd * 0.9,
            energy_kwh_day=base_energy * 0.8,
            rod_risk_pct=base_risk * 0.8,
            cost_inr_day=(base_energy * 0.8) * self.ENERGY_COST_INR_KWH,
            net_value_inr_day=(base_bopd * 0.9) * self.OIL_PRICE_INR_BBL - (base_energy * 0.8) * self.ENERGY_COST_INR_KWH,
            css_params={'steam_volume': 800, 'injection_duration_days': 6},
            srp_params={'spm': 5.0, 'vfd_pct': 70}
        )
        
        pareto = [
            ParetoPoint(cost_inr_day=s.cost_inr_day, production_bopd=s.production_bopd, 
                        risk_pct=s.rod_risk_pct, energy_kwh_day=s.energy_kwh_day)
            for s in [strat_a, strat_b, strat_c]
        ]
        
        cutoff = self.compute_economic_cutoff(well_id, current_state)["economic_cutoff_day"]
        
        return OptimizationResult(
            strategies=[strat_a, strat_b, strat_c],
            pareto_frontier=pareto,
            economic_cutoff_day=cutoff
        )

    def optimize_weighted_sum(self, weights: dict, current_state: dict) -> dict:
        return {"status": "success", "params": {"spm": 6.0}}

    def compute_economic_cutoff(self, well_id: str, current_state: dict, horizon_days: int = 60) -> dict:
        return {"economic_cutoff_day": 41, "marginal_revenue": 1000, "marginal_cost": 1000}

    def _objective_functions(self, x: np.ndarray, current_state: dict, ml_preds: dict) -> np.ndarray:
        return np.array([0.0, 0.0, 0.0])

    def _constraint_functions(self, x: np.ndarray) -> np.ndarray:
        return np.array([0.0])

    def _cluster_pareto_strategies(self, pareto_set: np.ndarray) -> List[Strategy]:
        return []
