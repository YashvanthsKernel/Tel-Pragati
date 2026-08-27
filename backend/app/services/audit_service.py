from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime
from .recommendation_service import Recommendation
import logging

logger = logging.getLogger(__name__)

@dataclass
class AuditEvent:
    id: str
    timestamp: datetime
    event_type: str
    recommendation_id: Optional[str]
    user_id: Optional[str]
    details: dict

class AuditService:
    def __init__(self):
        self.events: List[AuditEvent] = []

    def log_recommendation_created(self, recommendation: Recommendation, model_version_id: str) -> None:
        self._add_event("RECOMMENDATION_CREATED", recommendation.id, details={"model_version": model_version_id})

    def log_recommendation_approved(self, recommendation_id: str, user_id: str, dispatch_mode: str) -> None:
        self._add_event("RECOMMENDATION_APPROVED", recommendation_id, user_id, {"dispatch_mode": dispatch_mode})

    def log_recommendation_rejected(self, recommendation_id: str, user_id: str, reason: str) -> None:
        self._add_event("RECOMMENDATION_REJECTED", recommendation_id, user_id, {"reason": reason})

    def log_recommendation_expired(self, recommendation_id: str) -> None:
        self._add_event("RECOMMENDATION_EXPIRED", recommendation_id)

    def log_interlock_block(self, recommendation_id: str, blocking_interlocks: List[str]) -> None:
        self._add_event("INTERLOCK_BLOCK", recommendation_id, details={"blocking_interlocks": blocking_interlocks})

    def log_model_promoted(self, model_name: str, version: str, approved_by: str) -> None:
        self._add_event("MODEL_PROMOTED", None, approved_by, {"model_name": model_name, "version": version})

    def log_model_rolled_back(self, model_name: str, version: str, reason: str) -> None:
        self._add_event("MODEL_ROLLED_BACK", None, details={"model_name": model_name, "version": version, "reason": reason})

    def get_audit_trail(self, recommendation_id: Optional[str] = None, well_id: Optional[str] = None, limit: int = 100) -> List[AuditEvent]:
        if recommendation_id:
            res = [e for e in self.events if e.recommendation_id == recommendation_id]
        else:
            res = self.events
        return res[-limit:]
        
    def _add_event(self, event_type: str, recommendation_id: Optional[str], user_id: Optional[str] = None, details: dict = None):
        import uuid
        event = AuditEvent(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            event_type=event_type,
            recommendation_id=recommendation_id,
            user_id=user_id,
            details=details or {}
        )
        self.events.append(event)
        logger.info(f"Audit event logged: {event_type}")
