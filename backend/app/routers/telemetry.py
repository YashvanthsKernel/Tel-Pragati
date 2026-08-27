from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid
import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import declarative_base

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/wells", tags=["telemetry"])
Base = declarative_base()

# -- DB Models --
class Telemetry(Base):
    __tablename__ = 'telemetry'
    ts = Column(DateTime(timezone=True), primary_key=True)
    well_id = Column(String, ForeignKey('well.id', ondelete='CASCADE'), primary_key=True)
    metric = Column(String, primary_key=True)
    value = Column(Float, nullable=False)

class SRPSample(Base):
    __tablename__ = 'srp_sample'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ts = Column(DateTime(timezone=True), nullable=False)
    well_id = Column(String, ForeignKey('well.id', ondelete='CASCADE'), nullable=False)
    data = Column(JSONB, nullable=False)

# -- Pydantic Models --
class TelemetryPoint(BaseModel):
    ts: datetime
    metric: str
    value: float

class TelemetryIngest(BaseModel):
    metric: str
    value: float
    ts: Optional[datetime] = None

class SRPSampleIn(BaseModel):
    data: dict
    ts: Optional[datetime] = None

class SRPSampleOut(SRPSampleIn):
    id: uuid.UUID
    well_id: str

# -- Dependencies --
async def get_db(): yield None

# -- Endpoints --
@router.get("/{well_id}/telemetry", response_model=List[TelemetryPoint])
async def get_telemetry(
    well_id: str,
    metric: str,
    time_from: datetime = Query(alias="from"),
    time_to: datetime = Query(alias="to"),
    db: AsyncSession = Depends(get_db)
):
    logger.info("Querying telemetry", well_id=well_id, metric=metric, time_from=time_from, time_to=time_to)
    return []

@router.post("/{well_id}/telemetry", response_model=TelemetryPoint)
async def ingest_telemetry(well_id: str, point: TelemetryIngest, db: AsyncSession = Depends(get_db)):
    logger.info("Ingesting telemetry", well_id=well_id, metric=point.metric)
    ts = point.ts or datetime.utcnow()
    return TelemetryPoint(ts=ts, metric=point.metric, value=point.value)

@router.get("/{well_id}/telemetry/latest", response_model=TelemetryPoint)
async def get_latest_telemetry(well_id: str, metric: str, db: AsyncSession = Depends(get_db)):
    logger.info("Fetching latest telemetry", well_id=well_id, metric=metric)
    return TelemetryPoint(ts=datetime.utcnow(), metric=metric, value=0.0)

@router.get("/{well_id}/srp", response_model=List[SRPSampleOut])
async def get_srp_history(well_id: str, limit: int = 10, db: AsyncSession = Depends(get_db)):
    logger.info("Fetching SRP history", well_id=well_id, limit=limit)
    return []

@router.post("/{well_id}/srp", response_model=SRPSampleOut)
async def ingest_srp(well_id: str, sample: SRPSampleIn, db: AsyncSession = Depends(get_db)):
    logger.info("Ingesting SRP sample", well_id=well_id)
    ts = sample.ts or datetime.utcnow()
    return SRPSampleOut(id=uuid.uuid4(), well_id=well_id, ts=ts, data=sample.data)
