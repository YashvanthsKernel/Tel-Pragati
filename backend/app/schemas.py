from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class WellBase(BaseModel):
    name: str
    status: str = "active"
    well_type: str

class WellCreate(WellBase):
    id: str

class WellRead(WellBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class TelemetryPoint(BaseModel):
    sensor_name: str
    value: float
    unit: Optional[str] = None
    ts: datetime

class TelemetryRead(TelemetryPoint):
    well_id: str
    
    class Config:
        from_attributes = True

class WellStateResponse(BaseModel):
    well_id: str
    ts: datetime
    observed: Dict[str, Any]
    inferred: Dict[str, Any]
    fusion: Dict[str, Any]

class DynamometerCardRead(BaseModel):
    well_id: str
    ts: datetime
    card_type: str
    position: List[float]
    load: List[float]
    diagnosis: Optional[str] = None
    
    class Config:
        from_attributes = True

class SimulationRequest(BaseModel):
    well_id: str
    duration_hours: float
    parameters: Dict[str, Any]

class SimulationResponse(BaseModel):
    job_id: str
    status: str
    results: Optional[Dict[str, Any]] = None

class ParetoPoint(BaseModel):
    id: str
    objective_1: float
    objective_2: float
    parameters: Dict[str, Any]

class OptimizationResponse(BaseModel):
    well_id: str
    strategy: str
    pareto_front: List[ParetoPoint]

class RecommendationBase(BaseModel):
    title: str
    description: str
    priority: str

class RecommendationCreate(RecommendationBase):
    well_id: str

class RecommendationRead(RecommendationBase):
    id: str
    well_id: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ApproveRejectRequest(BaseModel):
    action: str
    reason: Optional[str] = None

class InterlockStatus(BaseModel):
    interlock_id: str
    is_active: bool
    reason: Optional[str] = None

class InterlockMatrixResponse(BaseModel):
    well_id: str
    interlocks: List[InterlockStatus]
    last_updated: datetime

class ScenarioBase(BaseModel):
    name: str
    description: Optional[str] = None

class ScenarioRead(ScenarioBase):
    id: str
    created_at: datetime

class ScenarioPlayRequest(BaseModel):
    scenario_id: str
    speed_multiplier: float = 1.0

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class PhysicsStateResponse(BaseModel):
    well_id: str
    ts: datetime
    thermal_state: Dict[str, float]
    mechanical_state: Dict[str, float]
