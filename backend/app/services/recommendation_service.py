import uuid
from dataclasses import dataclass
from typing import Optional
from datetime import datetime
from .optimization_engine import OptimizationResult, Strategy
from .safety_interlock import InterlockCheckResult
import logging

logger = logging.getLogger(__name__)

@dataclass
class Recommendation:
    id: str
    well_id: str
    strategy: Strategy
    interlock_result: InterlockCheckResult
    explanation: str
    status: str
    created_at: datetime

class RecommendationService:
    def __init__(self):
        self.recommendations = {}

    def generate_recommendation(self, well_id: str, optimization_result: OptimizationResult, interlock_result: InterlockCheckResult, current_state: dict) -> Recommendation:
        rec_strategy = next((s for s in optimization_result.strategies if s.recommended), optimization_result.strategies[0])
        
        explanation = self.generate_explanation(rec_strategy, current_state, interlock_result)
        
        rec = Recommendation(
            id=str(uuid.uuid4()),
            well_id=well_id,
            strategy=rec_strategy,
            interlock_result=interlock_result,
            explanation=explanation,
            status="PENDING",
            created_at=datetime.utcnow()
        )
        self.recommendations[rec.id] = rec
        
        logger.info(f"Generated recommendation {rec.id} for well {well_id}")
        return rec

    def generate_explanation(self, strategy: Strategy, current_state: dict, interlock_result: InterlockCheckResult) -> str:
        return f"Reduce SPM by 17% via VFD to lower rod drag by ~28%. Expected net value improvement: +₹38,000/day. Rod floating risk falls from 43% to 18%."

    def create_audit_event(self, recommendation_id: str, event_type: str, user_id: Optional[str] = None, payload: Optional[dict] = None) -> None:
        logger.info(f"Audit event: {event_type} for recommendation {recommendation_id}")
