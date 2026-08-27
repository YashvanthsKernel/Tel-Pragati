"""
Safety Interlock Engine — the ONLY component authorized to mark an action as dispatchable.

Design principle: This component is intentionally the simplest, most deterministic,
and most heavily tested in the system. It NEVER calls the ML service.
It only reads current/predicted values and compares against static, engineer-set thresholds.

This separation (learned components propose, deterministic component gates) is standard
practice in safety-relevant automation.
"""
from dataclasses import dataclass
from typing import List, Dict, Any
from datetime import datetime

@dataclass
class InterlockStatus:
    id: str
    name: str
    current_value: float
    limit: float
    unit: str
    status: str  # armed, tripped, disabled
    margin_pct: float

@dataclass
class InterlockVerdictSingle:
    id: str
    passed: bool
    value: float
    limit: float
    margin_pct: float

@dataclass
class InterlockCheckResult:
    overall_status: str  # APPROVED, BLOCKED
    verdict_per_interlock: Dict[str, InterlockVerdictSingle]
    blocking_interlocks: List[str]
    checked_at: datetime

class SafetyInterlockEngine:
    INTERLOCK_DEFINITIONS = {
        "max_spm": {"name": "Maximum SPM", "limit": 8.0, "unit": "SPM", "type": "max"},
        "max_motor_current_a": {"name": "Maximum Motor Current", "limit": 55.0, "unit": "A", "type": "max"},
        "max_pprl_lb": {"name": "Max Peak Rod Load", "limit": 24000.0, "unit": "lb", "type": "max"},
        "min_downstroke_tension_lb": {"name": "Min Downstroke Tension", "limit": 2000.0, "unit": "lb", "type": "min"},
        "max_wellhead_pressure_psi": {"name": "Max Wellhead Pressure", "limit": 500.0, "unit": "psi", "type": "max"},
        "min_model_confidence_pct": {"name": "Min Model Confidence", "limit": 75.0, "unit": "%", "type": "min"},
        "min_telemetry_health_pct": {"name": "Min Telemetry Health", "limit": 80.0, "unit": "%", "type": "min"},
    }

    def __init__(self):
        self.limits = {k: v["limit"] for k, v in self.INTERLOCK_DEFINITIONS.items()}

    def check_all(self, proposed_params: dict, current_state: dict, model_confidence: float) -> InterlockCheckResult:
        verdicts = {}
        blocking = []
        
        # Check max_spm
        spm = proposed_params.get("spm", current_state.get("spm", 0))
        v_spm = self.check_single("max_spm", spm, self.limits["max_spm"])
        verdicts["max_spm"] = v_spm
        if not v_spm.passed: blocking.append("max_spm")
            
        # Check current
        curr = current_state.get("motor_current_a", 0)
        v_curr = self.check_single("max_motor_current_a", curr, self.limits["max_motor_current_a"])
        verdicts["max_motor_current_a"] = v_curr
        if not v_curr.passed: blocking.append("max_motor_current_a")
        
        # Check load
        pprl = current_state.get("peak_rod_load_lb", 0)
        v_pprl = self.check_single("max_pprl_lb", pprl, self.limits["max_pprl_lb"])
        verdicts["max_pprl_lb"] = v_pprl
        if not v_pprl.passed: blocking.append("max_pprl_lb")
        
        # Check tension
        tension = current_state.get("min_downstroke_tension_lb", 3000)
        v_tension = self.check_single("min_downstroke_tension_lb", tension, self.limits["min_downstroke_tension_lb"])
        verdicts["min_downstroke_tension_lb"] = v_tension
        if not v_tension.passed: blocking.append("min_downstroke_tension_lb")
        
        # Check pressure
        pressure = current_state.get("wellhead_pressure_psi", 0)
        v_pressure = self.check_single("max_wellhead_pressure_psi", pressure, self.limits["max_wellhead_pressure_psi"])
        verdicts["max_wellhead_pressure_psi"] = v_pressure
        if not v_pressure.passed: blocking.append("max_wellhead_pressure_psi")
        
        # Check model conf
        v_conf = self.check_single("min_model_confidence_pct", model_confidence, self.limits["min_model_confidence_pct"])
        verdicts["min_model_confidence_pct"] = v_conf
        if not v_conf.passed: blocking.append("min_model_confidence_pct")
            
        # Check telemetry health
        health = current_state.get("telemetry_health_pct", 100)
        v_health = self.check_single("min_telemetry_health_pct", health, self.limits["min_telemetry_health_pct"])
        verdicts["min_telemetry_health_pct"] = v_health
        if not v_health.passed: blocking.append("min_telemetry_health_pct")
            
        return InterlockCheckResult(
            overall_status="BLOCKED" if blocking else "APPROVED",
            verdict_per_interlock=verdicts,
            blocking_interlocks=blocking,
            checked_at=datetime.utcnow()
        )

    def check_single(self, interlock_id: str, value: float, limit: float) -> InterlockVerdictSingle:
        definition = self.INTERLOCK_DEFINITIONS[interlock_id]
        if definition["type"] == "max":
            passed = value <= limit
            margin = ((limit - value) / limit) * 100 if limit else 0
        else:
            passed = value >= limit
            margin = ((value - limit) / limit) * 100 if limit else 0
            
        return InterlockVerdictSingle(
            id=interlock_id,
            passed=passed,
            value=value,
            limit=limit,
            margin_pct=margin
        )

    def get_interlock_matrix(self, current_state: dict, model_confidence: float) -> List[InterlockStatus]:
        return []

    def update_limit(self, interlock_id: str, new_limit: float, updated_by: str) -> None:
        if interlock_id in self.limits:
            self.limits[interlock_id] = new_limit
