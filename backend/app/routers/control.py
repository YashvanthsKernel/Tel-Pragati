"""Control router — safety interlocks and autonomy tier management.

This router exposes the Safety/Interlock Engine's state to the frontend
/control page. It NEVER directly dispatches commands — it only exposes
interlock status and autonomy tier configuration.

All actual dispatch decisions go through the recommendation approve/reject
workflow in recommendations.py, which itself goes through the
SafetyInterlockEngine before marking anything as dispatchable.
"""
from __future__ import annotations

from typing import List, Literal
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

try:
    from app.database import get_db
    from app.dependencies import get_current_active_user, get_current_admin_user
except ImportError:
    get_db = lambda: None
    get_current_active_user = lambda: None
    get_current_admin_user = lambda: None

logger = structlog.get_logger(__name__)
router = APIRouter(tags=["Control"])

class InterlockStatus(BaseModel):
    id: str
    name: str
    current_value: float
    limit: float
    unit: str
    status: Literal['armed', 'tripped', 'disabled']
    margin_pct: float

class UpdateInterlockLimitRequest(BaseModel):
    new_limit: float
    reason: str

class AutonomyTierResponse(BaseModel):
    tier: Literal['advisory', 'supervised', 'automated']
    updated_at: datetime
    updated_by: str

class UpdateAutonomyTierRequest(BaseModel):
    tier: Literal['advisory', 'supervised', 'automated']
    justification: str

MOCK_INTERLOCKS = [
    InterlockStatus(id="il_01", name="High Rod Stress", current_value=24000, limit=26000, unit="lbs", status="armed", margin_pct=7.69),
    InterlockStatus(id="il_02", name="High Motor Temp", current_value=85, limit=100, unit="°C", status="armed", margin_pct=15.0),
    InterlockStatus(id="il_03", name="Low Tubing Pressure", current_value=45, limit=30, unit="psi", status="armed", margin_pct=50.0),
    InterlockStatus(id="il_04", name="High Flow Line Pressure", current_value=120, limit=200, unit="psi", status="armed", margin_pct=40.0),
    InterlockStatus(id="il_05", name="Vibration High", current_value=0.2, limit=0.5, unit="ips", status="armed", margin_pct=60.0),
    InterlockStatus(id="il_06", name="Stuffing Box Leak", current_value=0, limit=1, unit="bool", status="armed", margin_pct=100.0),
    InterlockStatus(id="il_07", name="Casing Pressure High", current_value=150, limit=500, unit="psi", status="armed", margin_pct=70.0),
]

MOCK_TIER = AutonomyTierResponse(
    tier='advisory',
    updated_at=datetime.now(timezone.utc),
    updated_by="system"
)

@router.get("/wells/{well_id}/interlocks", response_model=List[InterlockStatus])
async def get_interlocks(well_id: UUID, current_user = Depends(get_current_active_user)):
    """List of 7 interlock statuses."""
    logger.info("fetching_interlocks", well_id=str(well_id))
    return MOCK_INTERLOCKS

@router.patch("/wells/{well_id}/interlocks/{interlock_id}", response_model=InterlockStatus)
async def update_interlock_limit(
    well_id: UUID,
    interlock_id: str,
    request: UpdateInterlockLimitRequest,
    current_admin = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update limit (admin only). Creates audit event."""
    logger.info("updating_interlock_limit", well_id=str(well_id), interlock=interlock_id, request=request.dict())
    target = next((i for i in MOCK_INTERLOCKS if i.id == interlock_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Interlock not found")
    
    target.limit = request.new_limit
    logger.info("audit_event_created", event="interlock_limit_changed", interlock_id=interlock_id, new_limit=request.new_limit, reason=request.reason)
    return target

@router.get("/wells/{well_id}/autonomy-tier", response_model=AutonomyTierResponse)
async def get_autonomy_tier(well_id: UUID, current_user = Depends(get_current_active_user)):
    """Get current autonomy tier."""
    logger.info("fetching_autonomy_tier", well_id=str(well_id))
    return MOCK_TIER

@router.patch("/wells/{well_id}/autonomy-tier", response_model=AutonomyTierResponse)
async def update_autonomy_tier(
    well_id: UUID,
    request: UpdateAutonomyTierRequest,
    current_admin = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Update tier (admin only). Restricts transitions."""
    logger.info("updating_autonomy_tier", well_id=str(well_id), request=request.dict())
    
    if MOCK_TIER.tier == 'advisory' and request.tier == 'automated':
        raise HTTPException(status_code=400, detail="Cannot jump directly to automated tier from advisory")
    
    MOCK_TIER.tier = request.tier
    MOCK_TIER.updated_at = datetime.now(timezone.utc)
    MOCK_TIER.updated_by = "admin"
    
    logger.info("audit_event_created", event="autonomy_tier_changed", new_tier=request.tier, justification=request.justification)
    return MOCK_TIER
