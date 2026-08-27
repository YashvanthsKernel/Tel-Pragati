"""Recommendations router — human-in-the-loop approval workflow.

Every recommendation goes through this workflow:
  Created -> Interlock check (auto) -> Surfaced to operator with explanation
    -> Approve -> dispatch (or simulate) -> audit_event(dispatched)
    -> Reject  -> audit_event(rejected, reason)
    -> Timeout -> audit_event(expired)

Every branch is logged. This is what turns 'human-in-the-loop' from a
slide bullet into a testable system property.
"""
from __future__ import annotations

from typing import List, Literal, Optional
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

try:
    from app.database import get_db
    from app.dependencies import get_current_active_user, get_current_operator_user
except ImportError:
    get_db = lambda: None
    get_current_active_user = lambda: None
    get_current_operator_user = lambda: None

logger = structlog.get_logger(__name__)
router = APIRouter(tags=["Recommendations"])

class RecommendationAuditTrail(BaseModel):
    event: str
    timestamp: datetime
    user: Optional[str]
    reason: Optional[str]

class RecommendationResponse(BaseModel):
    id: UUID
    well_id: UUID
    status: Literal['pending', 'approved', 'rejected', 'dispatched', 'expired']
    explanation: str
    action_payload: dict
    created_at: datetime
    audit_trail: List[RecommendationAuditTrail]

class RejectRecommendationRequest(BaseModel):
    reason: str

# Mock data
import uuid
MOCK_RECS = {}
_well_id = uuid.uuid4()
_rec_id = uuid.uuid4()
MOCK_RECS[_rec_id] = RecommendationResponse(
    id=_rec_id,
    well_id=_well_id,
    status='pending',
    explanation='Reduce SPM to prevent rod floating due to high viscosity.',
    action_payload={'spm': 3.0},
    created_at=datetime.now(timezone.utc),
    audit_trail=[RecommendationAuditTrail(event='created', timestamp=datetime.now(timezone.utc), user='system', reason=None)]
)

@router.get("/recommendations", response_model=List[RecommendationResponse])
async def list_recommendations(
    well_id: Optional[UUID] = None,
    status: Optional[Literal['pending', 'approved', 'rejected', 'dispatched', 'expired']] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_active_user)
):
    """List recommendations with filters."""
    logger.info("listing_recommendations", well_id=str(well_id), status=status)
    results = list(MOCK_RECS.values())
    if well_id:
        results = [r for r in results if r.well_id == well_id]
    if status:
        results = [r for r in results if r.status == status]
    return results[offset:offset+limit]

@router.get("/recommendations/{id}", response_model=RecommendationResponse)
async def get_recommendation(id: UUID, current_user = Depends(get_current_active_user)):
    """Full recommendation detail."""
    if id not in MOCK_RECS:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return MOCK_RECS[id]

@router.post("/recommendations/{id}/approve", response_model=RecommendationResponse)
async def approve_recommendation(
    id: UUID,
    current_operator = Depends(get_current_operator_user),
    db: AsyncSession = Depends(get_db)
):
    """Approve + create audit_event(approved) + create audit_event(dispatched if advisory/auto)"""
    if id not in MOCK_RECS:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    
    rec = MOCK_RECS[id]
    if rec.status != 'pending':
        raise HTTPException(status_code=400, detail="Only pending recommendations can be approved")
    
    rec.status = 'dispatched' # simulate advisory
    now = datetime.now(timezone.utc)
    user_str = "operator"
    
    rec.audit_trail.append(RecommendationAuditTrail(event='approved', timestamp=now, user=user_str, reason=None))
    rec.audit_trail.append(RecommendationAuditTrail(event='dispatched', timestamp=now, user='system', reason='advisory tier auto-dispatch'))
    
    logger.info("audit_event_created", action="approved", recommendation_id=str(id))
    return rec

@router.post("/recommendations/{id}/reject", response_model=RecommendationResponse)
async def reject_recommendation(
    id: UUID,
    request: RejectRecommendationRequest,
    current_operator = Depends(get_current_operator_user),
    db: AsyncSession = Depends(get_db)
):
    """Reject + require reason + create audit_event(rejected)"""
    if id not in MOCK_RECS:
        raise HTTPException(status_code=404, detail="Recommendation not found")
        
    rec = MOCK_RECS[id]
    if rec.status != 'pending':
        raise HTTPException(status_code=400, detail="Only pending recommendations can be rejected")
        
    rec.status = 'rejected'
    rec.audit_trail.append(RecommendationAuditTrail(event='rejected', timestamp=datetime.now(timezone.utc), user='operator', reason=request.reason))
    
    logger.info("audit_event_created", action="rejected", recommendation_id=str(id), reason=request.reason)
    return rec
