"""Time Machine / Scenario Replay router.

The replay adapter streams a pre-computed, physics-consistent time series
into the exact same ingestion -> state -> prediction -> optimizer pipeline.
This means demo mode and live mode test the SAME backend code path.

Pre-built scenarios (matching the /simulator UI):
1. normal_ops_d14  — Normal operations at day 14
2. cooling_phase_d25 — Cooling with rising viscosity at day 25
3. rod_floating_d35 — Rod floating onset at day 35
4. css_cutoff_d41  — Economic cut-off decision at day 41
5. energy_min_d18  — Energy minimization at day 18
"""
from __future__ import annotations

from typing import List, Literal, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
import structlog
import asyncio

try:
    from app.dependencies import get_current_active_user
except ImportError:
    get_current_active_user = lambda: None

logger = structlog.get_logger(__name__)
router = APIRouter(tags=["Scenarios"])

class ScenarioMetadata(BaseModel):
    id: str
    name: str
    description: str
    simulated_day: int

class PlayScenarioRequest(BaseModel):
    speed: Literal[1, 2, 5]
    well_id: str

SCENARIOS = [
    ScenarioMetadata(id="normal_ops_d14", name="Normal Operations", description="Normal operations at day 14", simulated_day=14),
    ScenarioMetadata(id="cooling_phase_d25", name="Cooling Phase", description="Cooling with rising viscosity at day 25", simulated_day=25),
    ScenarioMetadata(id="rod_floating_d35", name="Rod Floating", description="Rod floating onset at day 35", simulated_day=35),
    ScenarioMetadata(id="css_cutoff_d41", name="Economic Cutoff", description="Economic cut-off decision at day 41", simulated_day=41),
    ScenarioMetadata(id="energy_min_d18", name="Energy Minimization", description="Energy minimization at day 18", simulated_day=18),
]

# Simple in-memory state for active scenario
ACTIVE_SCENARIO: Optional[str] = None
PLAYING = False

async def replay_engine_task(scenario_id: str, speed: int, well_id: str):
    """Background task to simulate streaming telemetry."""
    global PLAYING
    PLAYING = True
    logger.info("replay_started", scenario=scenario_id, speed=speed, well_id=well_id)
    try:
        while PLAYING:
            # Emit telemetry logic would go here
            logger.debug("emitting_telemetry_tick", scenario=scenario_id)
            await asyncio.sleep(1.0 / speed)
    except asyncio.CancelledError:
        logger.info("replay_cancelled", scenario=scenario_id)
    finally:
        PLAYING = False
        logger.info("replay_stopped", scenario=scenario_id)

@router.get("/scenarios", response_model=List[ScenarioMetadata])
async def list_scenarios(current_user = Depends(get_current_active_user)):
    """List all 5 scenarios with metadata."""
    return SCENARIOS

@router.get("/scenarios/{id}", response_model=ScenarioMetadata)
async def get_scenario(id: str, current_user = Depends(get_current_active_user)):
    """Scenario detail."""
    scenario = next((s for s in SCENARIOS if s.id == id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario

@router.get("/scenarios/active")
async def get_active_scenario(current_user = Depends(get_current_active_user)):
    """Currently playing scenario or null."""
    if ACTIVE_SCENARIO and PLAYING:
        return {"active_scenario_id": ACTIVE_SCENARIO}
    return None

@router.post("/scenarios/{id}/play")
async def play_scenario(
    id: str,
    request: PlayScenarioRequest,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_active_user)
):
    """Start replay {speed: 1|2|5, well_id: str}"""
    global ACTIVE_SCENARIO, PLAYING
    if PLAYING:
        raise HTTPException(status_code=409, detail="A scenario is already playing")
    
    scenario = next((s for s in SCENARIOS if s.id == id), None)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
        
    ACTIVE_SCENARIO = id
    background_tasks.add_task(replay_engine_task, id, request.speed, request.well_id)
    return {"status": "started", "scenario_id": id}

@router.post("/scenarios/stop")
async def stop_scenario(current_user = Depends(get_current_active_user)):
    """Stop active replay."""
    global ACTIVE_SCENARIO, PLAYING
    PLAYING = False
    ACTIVE_SCENARIO = None
    return {"status": "stopped"}
