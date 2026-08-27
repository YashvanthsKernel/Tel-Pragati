"""
Wells router — CRUD + the central /state fusion endpoint.

The /state endpoint is the most important endpoint in the whole system:
it fuses physics engine + ML inference into a single WellState response
matching the frontend's TypeScript WellState interface exactly (camelCase).
"""
from __future__ import annotations

import math
import uuid
from datetime import datetime, timezone
from typing import Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

logger = structlog.get_logger(__name__)

# All response models use camelCase aliases so they match the frontend's
# TypeScript types exactly — zero transform needed in the frontend.
router = APIRouter(tags=["wells"])


# ─── Pydantic Response Schemas (camelCase = frontend TypeScript match) ────────

class CamelModel(BaseModel):
    """Base model that serialises to camelCase for the frontend."""
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class EstimatedValue(CamelModel):
    value: float
    trend_pct_per_day: Optional[float] = None
    confidence: float
    label_source: str = "ground_truth"
    unit: Optional[str] = None


class ObservedState(CamelModel):
    surface_temp_c: float
    flow_bopd: float
    motor_current_a: float
    tank_level_pct: float
    polished_rod_load_lb: float
    polished_rod_position_in: float
    spm: float
    stroke_length_in: float
    casing_pressure_psi: float
    tubing_pressure_psi: float


class InferredState(CamelModel):
    bottomhole_temp_c: EstimatedValue
    viscosity_cp: EstimatedValue
    rod_drag_lb: EstimatedValue
    downhole_fillage_pct: EstimatedValue


class FusionMeta(CamelModel):
    agreement_pct: float
    divergence_pct: float
    physics_value: float
    ml_value: float


class WellStateResponse(CamelModel):
    well_id: str
    well_name: str
    css_cycle: int
    day: float
    phase: str
    depth_m: float
    field: str
    timestamp: str
    observed: ObservedState
    inferred: InferredState
    fusion: FusionMeta
    rod_floating_risk_pct: float
    health_pct: float
    source: str = "synthetic"


class WellCreate(BaseModel):
    id: str
    name: str
    lat: float = 28.6
    lon: float = 72.3


class WellSummary(CamelModel):
    well_id: str
    name: str
    lat: float
    lon: float
    pad_id: str = "PAD-A"
    status: str = "producing"
    health_pct: float
    flow_bopd: float
    depth_m: float = 1150.0
    api_gravity: float = 17.5
    css_cycle: int = 4
    css_day: float
    phase: str = "produce"
    rod_floating_risk_pct: float
    bht_celsius: float
    viscosity_cp: float


class FleetKpis(CamelModel):
    total_bopd: float
    avg_sor_trailing30d: float
    active_alerts: int
    wells_in_alarm: int


class FleetSummary(CamelModel):
    field_name: str
    wells: list[WellSummary]
    field_kpis: FleetKpis


class CSSCycleCreate(BaseModel):
    phase: str
    start_date: datetime
    params: Optional[dict] = None


class CSSCycleOut(CamelModel):
    id: str
    well_id: str
    phase: str
    start_date: datetime
    end_date: Optional[datetime] = None


# ─── Physics helpers (inline, no DB needed for demo) ─────────────────────────

def _compute_physics_state(well_id: str, css_day: float = 25.0) -> dict:
    """
    Reduced-order physics for a well at css_day days into the production phase.
    Uses the equations from the architecture document:
      T(t) = T_amb + (T_peak - T_amb) * exp(-t / tau)
      mu(T) = mu_ref * exp[B * (1/T_K - 1/T_ref_K)]
    Calibrated for Baghewala: ~10,000–13,000 cP at 50°C.
    """
    # Thermal model — Baghewala defaults
    T_AMB = 47.0       # °C reservoir ambient
    T_PEAK = 140.0     # °C post-injection peak BHT
    TAU = 12.0         # days thermal decay constant

    bht = T_AMB + (T_PEAK - T_AMB) * math.exp(-css_day / TAU)

    # Viscosity — Andrade model calibrated to ~12,000 cP @ 50°C
    MU_REF = 12000.0
    B = 5800.0
    T_REF_K = 323.15   # 50°C in Kelvin
    T_K = bht + 273.15
    viscosity = MU_REF * math.exp(B * (1.0 / T_K - 1.0 / T_REF_K))
    viscosity = max(50.0, min(viscosity, 100_000.0))

    # Rod drag — viscosity-dependent
    rod_drag = 2500.0 + viscosity * 0.45

    # Rod floating risk composite index
    drag_ratio = min(rod_drag / 18000.0, 1.0)
    cooling_trend = min((css_day / 45.0), 1.0)
    risk_pct = (0.5 * drag_ratio + 0.3 * cooling_trend + 0.2 * max(0, 1 - bht / 100)) * 100
    risk_pct = max(0.0, min(risk_pct, 100.0))

    # Production — mobility-based proxy
    mobility = 1.0 / viscosity * 1e6
    flow_bopd = max(5.0, 45.0 * mobility / 0.5)
    flow_bopd = min(flow_bopd, 55.0)

    # Surface temp — ~60% of BHT (wellhead loses heat)
    surface_temp = T_AMB + (bht - T_AMB) * 0.55

    # SOR cumulative estimate
    steam_injected = 180.0  # tons per cycle (assumed)
    oil_produced = max(1.0, flow_bopd * css_day * 0.159)  # m³ equiv
    sor = steam_injected / max(oil_produced, 1.0)

    # Health score
    health = 100.0 - risk_pct * 0.4 - max(0, (viscosity - 5000) / 1000.0)
    health = max(20.0, min(health, 100.0))

    return {
        "bht": round(bht, 2),
        "viscosity": round(viscosity, 1),
        "rod_drag": round(rod_drag, 1),
        "risk_pct": round(risk_pct, 1),
        "flow_bopd": round(flow_bopd, 1),
        "surface_temp": round(surface_temp, 2),
        "health": round(health, 1),
        "fillage_pct": round(min(98, 60 + mobility * 2000), 1),
        "sor": round(sor, 2),
    }


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/wells", response_model=list[WellSummary])
async def list_wells():
    """List all wells with summary state for the field map and fleet view."""
    logger.info("Listing all wells")
    # Seed two Baghewala wells for demo
    wells = []
    for well_id, name, css_day, lat, lon in [
        ("BGW-08", "BGW-08", 25.0, 28.6139, 72.3154),
        ("BGW-04", "BGW-04", 14.0, 28.6201, 72.3098),
        ("BGW-12", "BGW-12", 35.0, 28.6087, 72.3212),
    ]:
        p = _compute_physics_state(well_id, css_day)
        wells.append(WellSummary(
            well_id=well_id,
            name=name,
            lat=lat,
            lon=lon,
            health_pct=p["health"],
            flow_bopd=p["flow_bopd"],
            css_day=css_day,
            rod_floating_risk_pct=p["risk_pct"],
            bht_celsius=p["bht"],
            viscosity_cp=p["viscosity"],
            status="alarm" if p["risk_pct"] > 70 else "producing",
        ))
    return wells


@router.post("/wells", response_model=WellSummary)
async def create_well(well: WellCreate):
    """Create a new well record."""
    logger.info("Creating well", well_id=well.id)
    return WellSummary(
        well_id=well.id, name=well.name, lat=well.lat, lon=well.lon,
        health_pct=100.0, flow_bopd=0.0, css_day=0.0,
        rod_floating_risk_pct=0.0, bht_celsius=47.0, viscosity_cp=12000.0,
    )


@router.get("/wells/{well_id}", response_model=WellSummary)
async def get_well(well_id: str):
    """Get well summary."""
    p = _compute_physics_state(well_id, css_day=25.0)
    return WellSummary(
        well_id=well_id, name=well_id, lat=28.6139, lon=72.3154,
        health_pct=p["health"], flow_bopd=p["flow_bopd"], css_day=25.0,
        rod_floating_risk_pct=p["risk_pct"], bht_celsius=p["bht"],
        viscosity_cp=p["viscosity"],
    )


@router.get("/wells/{well_id}/state", response_model=WellStateResponse)
async def get_well_state(well_id: str, css_day: float = 25.0):
    """
    THE main fusion endpoint — returns the full WellState.
    Fuses physics engine + ML inference into the camelCase shape
    the frontend TypeScript interface WellState expects exactly.

    Physics model: T(t) = T_amb + (T_peak-T_amb)*exp(-t/tau)
    Viscosity: mu(T) = mu_ref * exp[B*(1/T_K - 1/T_ref_K)]
    Calibrated for Baghewala: 10,000–13,000 cP at 50°C.
    """
    logger.info("Computing fused WellState", well_id=well_id, css_day=css_day)

    p = _compute_physics_state(well_id, css_day)

    # ML surrogate — small perturbation from physics (simulates ML residual correction)
    ml_bht = p["bht"] * 0.991
    physics_bht = p["bht"]
    divergence_pct = abs(physics_bht - ml_bht) / max(physics_bht, 0.1) * 100

    # Confidence from model health (higher risk = lower confidence)
    base_conf = max(0.72, 1.0 - p["risk_pct"] / 250)

    # SPM from viscosity — higher viscosity → lower optimal SPM
    spm = max(2.5, 6.0 - p["viscosity"] / 5000)

    now_iso = datetime.now(timezone.utc).isoformat()

    return WellStateResponse(
        well_id=well_id,
        well_name=well_id,
        css_cycle=4,
        day=css_day,
        phase="produce" if css_day > 7 else ("soak" if css_day > 5 else "inject"),
        depth_m=1150.0,
        field="Baghewala",
        timestamp=now_iso,
        observed=ObservedState(
            surface_temp_c=p["surface_temp"],
            flow_bopd=p["flow_bopd"],
            motor_current_a=round(28.0 + p["viscosity"] / 1000, 1),
            tank_level_pct=round(45.0 + p["flow_bopd"] * 0.3, 1),
            polished_rod_load_lb=round(8000 + p["rod_drag"] * 0.4, 0),
            polished_rod_position_in=round(36.0 + css_day * 0.1, 1),
            spm=round(spm, 2),
            stroke_length_in=72.0,
            casing_pressure_psi=round(120.0 + p["viscosity"] / 200, 1),
            tubing_pressure_psi=round(85.0 + p["viscosity"] / 300, 1),
        ),
        inferred=InferredState(
            bottomhole_temp_c=EstimatedValue(
                value=physics_bht,
                trend_pct_per_day=round(-100 / (p["bht"] * 12), 3),
                confidence=round(base_conf + 0.05, 2),
                unit="°C",
            ),
            viscosity_cp=EstimatedValue(
                value=p["viscosity"],
                trend_pct_per_day=round(p["viscosity"] / 5000 * 2, 2),
                confidence=round(base_conf, 2),
                unit="cP",
            ),
            rod_drag_lb=EstimatedValue(
                value=p["rod_drag"],
                trend_pct_per_day=round(p["rod_drag"] / 10000 * 3, 2),
                confidence=round(base_conf + 0.02, 2),
                unit="lb",
            ),
            downhole_fillage_pct=EstimatedValue(
                value=p["fillage_pct"],
                confidence=round(base_conf + 0.03, 2),
                unit="%",
            ),
        ),
        fusion=FusionMeta(
            agreement_pct=round(100.0 - divergence_pct, 1),
            divergence_pct=round(divergence_pct, 1),
            physics_value=round(physics_bht, 2),
            ml_value=round(ml_bht, 2),
        ),
        rod_floating_risk_pct=p["risk_pct"],
        health_pct=p["health"],
        source="synthetic",
    )


@router.get("/fleet/summary", response_model=FleetSummary)
async def get_fleet_summary():
    """Fleet-level summary for the field map and overview card."""
    wells_data = await list_wells()
    total_bopd = sum(w.flow_bopd for w in wells_data)
    in_alarm = sum(1 for w in wells_data if w.status == "alarm")
    return FleetSummary(
        field_name="Baghewala",
        wells=wells_data,
        field_kpis=FleetKpis(
            total_bopd=round(total_bopd, 1),
            avg_sor_trailing30d=2.8,
            active_alerts=in_alarm + 1,
            wells_in_alarm=in_alarm,
        ),
    )


@router.get("/wells/{well_id}/css-cycles", response_model=list[CSSCycleOut])
async def list_css_cycles(well_id: str):
    """List CSS cycles for a well."""
    now = datetime.now(timezone.utc)
    return [CSSCycleOut(
        id=str(uuid.uuid4()),
        well_id=well_id,
        phase="produce",
        start_date=now,
    )]


@router.post("/wells/{well_id}/css-cycles", response_model=CSSCycleOut)
async def create_css_cycle(well_id: str, cycle: CSSCycleCreate):
    """Start a new CSS cycle."""
    return CSSCycleOut(
        id=str(uuid.uuid4()),
        well_id=well_id,
        phase=cycle.phase,
        start_date=cycle.start_date,
    )
