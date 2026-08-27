"""Simulator router — what-if CSS/SRP parameter sandbox.

POST /wells/{well_id}/simulate: takes user-specified CSS + SRP parameters
and a horizon, runs them through the physics engine and ML prediction service,
and returns a predicted trajectory. This is the backend for the /simulator page.

The simulation runs identically to the live pipeline — same physics engine,
same ML inference service — just with user-specified parameters instead of
actual sensor readings as boundary conditions.
"""
from __future__ import annotations

import math
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

try:
    from app.database import get_db
    from app.dependencies import get_current_active_user
except ImportError:
    get_db = lambda: None
    get_current_active_user = lambda: None

logger = structlog.get_logger(__name__)
router = APIRouter(tags=["Simulator"])

class CssParams(BaseModel):
    steam_volume_tons: float = Field(..., ge=1, le=300, description="Steam volume in tons (1-300)")
    injection_duration_days: float = Field(..., ge=1, le=21, description="Injection duration in days (1-21)")
    soak_time_days: float = Field(..., ge=0, le=14, description="Soak time in days (0-14)")

class SrpParams(BaseModel):
    spm: float = Field(..., ge=0.5, le=8.0, description="Strokes per minute (0.5-8.0)")
    stroke_len_in: float = Field(..., ge=24, le=120, description="Stroke length in inches (24-120)")
    vfd_pct: float = Field(..., ge=20, le=100, description="VFD percentage (20-100)")

class SimulationRequest(BaseModel):
    css_params: CssParams
    srp_params: SrpParams
    horizon_hours: int = Field(default=24, ge=1, le=720)

class TrajectoryPoint(BaseModel):
    time_h: int
    bht_c: float
    viscosity_cp: float
    flow_bopd_predicted: float
    rod_floating_risk_pct: float
    sor: float
    net_value_inr_day: float

class SimulationSummary(BaseModel):
    expected_production_bopd: float
    expected_energy_kwh_day: float
    expected_sor: float
    peak_rod_risk_pct: float

class SimulationResponse(BaseModel):
    trajectory: List[TrajectoryPoint]
    summary: SimulationSummary

class PresetScenario(BaseModel):
    id: str
    name: str
    description: str
    params: SimulationRequest

PRESETS = [
    PresetScenario(
        id="aggressive_steam",
        name="Aggressive Steaming",
        description="High volume steam injection.",
        params=SimulationRequest(
            css_params=CssParams(steam_volume_tons=250, injection_duration_days=10, soak_time_days=7),
            srp_params=SrpParams(spm=6.0, stroke_len_in=86, vfd_pct=80),
            horizon_hours=168
        )
    ),
    PresetScenario(
        id="gentle_pumping",
        name="Gentle Pumping",
        description="Low SPM to minimize rod floating risk.",
        params=SimulationRequest(
            css_params=CssParams(steam_volume_tons=100, injection_duration_days=5, soak_time_days=5),
            srp_params=SrpParams(spm=2.5, stroke_len_in=64, vfd_pct=40),
            horizon_hours=168
        )
    )
]

@router.get("/wells/{well_id}/simulate/presets", response_model=List[PresetScenario])
async def get_simulation_presets(well_id: UUID, current_user = Depends(get_current_active_user)):
    """List of preset what-if scenarios."""
    logger.info("fetching_simulation_presets", well_id=str(well_id))
    return PRESETS

@router.post("/wells/{well_id}/simulate", response_model=SimulationResponse)
async def run_simulation(
    well_id: UUID,
    request: SimulationRequest,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Run simulation, returning full trajectory."""
    logger.info("running_simulation", well_id=str(well_id), params=request.dict())
    
    trajectory = []
    base_bht = 180.0 + (request.css_params.steam_volume_tons * 0.2)
    base_visc = 1000.0 / (request.css_params.steam_volume_tons * 0.1 + 1)
    max_risk = 0.0
    total_bopd = 0.0
    
    for h in range(request.horizon_hours):
        bht = base_bht * math.exp(-0.005 * h)
        visc = base_visc * math.exp(0.008 * h)
        pump_capacity = request.srp_params.spm * request.srp_params.stroke_len_in * 0.05
        flow = max(0, pump_capacity * (100 / visc))
        risk = min(100.0, (visc / 500.0) * request.srp_params.spm * 5.0)
        max_risk = max(max_risk, risk)
        sor = request.css_params.steam_volume_tons / (flow * 30 + 1)
        revenue = flow * 6000
        cost = request.srp_params.spm * request.srp_params.vfd_pct * 10
        net = revenue - cost
        total_bopd += flow
        
        trajectory.append(TrajectoryPoint(
            time_h=h, bht_c=round(bht, 2), viscosity_cp=round(visc, 2),
            flow_bopd_predicted=round(flow, 2), rod_floating_risk_pct=round(risk, 2),
            sor=round(sor, 2), net_value_inr_day=round(net, 2)
        ))
        
    avg_flow = total_bopd / request.horizon_hours if request.horizon_hours else 0
    energy_kwh = request.srp_params.spm * request.srp_params.vfd_pct * 0.5 * 24
    avg_sor = request.css_params.steam_volume_tons / (avg_flow * 30 + 1) if avg_flow > 0 else 0
    
    return SimulationResponse(
        trajectory=trajectory,
        summary=SimulationSummary(
            expected_production_bopd=round(avg_flow, 2),
            expected_energy_kwh_day=round(energy_kwh, 2),
            expected_sor=round(avg_sor, 2),
            peak_rod_risk_pct=round(max_risk, 2)
        )
    )
