from dataclasses import dataclass
from typing import Dict, List, Optional
import time
import threading
import logging
import math

logger = logging.getLogger(__name__)

@dataclass
class ScenarioDefinition:
    id: str
    name: str
    description: str
    css_cycle_day: int
    phase: str
    peak_bht_c: float
    tau_days: float
    fault_type: str
    duration_days: int

@dataclass
class TelemetryTick:
    well_id: str
    ts: float
    surface_temp_c: float
    flow_bopd: float
    motor_current_a: float
    spm: float
    vfd_pct: float
    rod_load_lb: float
    rod_position_in: float

class SyntheticReplayEngine:
    SCENARIOS = {
        "normal_ops_d14": ScenarioDefinition("normal_ops_d14", "Normal Ops Day 14", "Normal operations at day 14 of CSS cycle", 14, "production", 200.0, 20.0, "none", 1),
        "cooling_phase_d25": ScenarioDefinition("cooling_phase_d25", "Cooling Phase Day 25", "Cooling phase at day 25, viscosity rising", 25, "production", 200.0, 20.0, "none", 1),
        "rod_floating_d35": ScenarioDefinition("rod_floating_d35", "Rod Floating Day 35", "Rod floating onset at day 35", 35, "production", 200.0, 20.0, "rod_float", 1),
        "css_cutoff_d41": ScenarioDefinition("css_cutoff_d41", "CSS Cutoff Day 41", "Economic cut-off decision at day 41", 41, "production", 200.0, 20.0, "none", 1),
        "energy_min_d18": ScenarioDefinition("energy_min_d18", "Energy Min Day 18", "Energy minimization scenario at day 18", 18, "production", 200.0, 20.0, "none", 1),
    }

    def __init__(self):
        self._active_scenario: Optional[ScenarioDefinition] = None
        self._playing = False
        self._thread = None

    def get_all_scenarios(self) -> List[ScenarioDefinition]:
        return list(self.SCENARIOS.values())

    def play(self, scenario_id: str, well_id: str, speed: int = 1) -> None:
        if self._playing:
            self.stop()
            
        if scenario_id not in self.SCENARIOS:
            raise ValueError(f"Unknown scenario {scenario_id}")
            
        self._active_scenario = self.SCENARIOS[scenario_id]
        self._playing = True
        self._thread = threading.Thread(target=self._play_loop, args=(well_id, speed))
        self._thread.daemon = True
        self._thread.start()
        logger.info(f"Started scenario {scenario_id} for well {well_id} at speed {speed}x")

    def stop(self) -> None:
        self._playing = False
        if self._thread:
            self._thread.join(timeout=1.0)
        self._active_scenario = None
        logger.info("Stopped synthetic replay")

    def get_active_scenario(self) -> Optional[ScenarioDefinition]:
        return self._active_scenario

    def _play_loop(self, well_id: str, speed: int):
        t_days = self._active_scenario.css_cycle_day
        while self._playing:
            tick = self._generate_telemetry_tick(self._active_scenario, t_days)
            # Emit tick (stubbed)
            t_days += (0.01 * speed)
            time.sleep(1.0 / speed)

    def _generate_telemetry_tick(self, scenario: ScenarioDefinition, t_days: float) -> TelemetryTick:
        state = self._physics_driven_state(scenario, t_days)
        return TelemetryTick(
            well_id="synthetic_well",
            ts=time.time(),
            surface_temp_c=state.get("bht_c", 50) * 0.8,
            flow_bopd=state.get("flow_bopd", 30),
            motor_current_a=35.0,
            spm=6.5,
            vfd_pct=85.0,
            rod_load_lb=18000.0,
            rod_position_in=50.0
        )

    def _physics_driven_state(self, scenario: ScenarioDefinition, t_days: float) -> dict:
        bht = 50 + (scenario.peak_bht_c - 50) * math.exp(-t_days / scenario.tau_days)
        visc = 100000 * math.exp(-0.05 * bht)
        flow = max(5, 50 - t_days * 0.8)
        
        return {
            "bht_c": bht,
            "viscosity_cp": visc,
            "flow_bopd": flow
        }
