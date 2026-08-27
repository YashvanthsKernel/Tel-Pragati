from fastapi import APIRouter, Depends, HTTPException
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
router = APIRouter(prefix="/wells", tags=["diagnostics"])
Base = declarative_base()

# -- DB Models --
class DynamometerCard(Base):
    __tablename__ = 'dynamometer_card'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ts = Column(DateTime(timezone=True), nullable=False)
    well_id = Column(String, ForeignKey('well.id', ondelete='CASCADE'), nullable=False)
    surface_card = Column(JSONB, nullable=False)
    downhole_card = Column(JSONB)
    classification = Column(String)
    confidence = Column(Float)

# -- Pydantic Models --
class CardData(BaseModel):
    position: List[float]
    load: List[float]

class DynamometerCardOut(BaseModel):
    id: uuid.UUID
    ts: datetime
    well_id: str
    surface_card: CardData
    downhole_card: Optional[CardData]
    classification: str
    confidence: float

class CardAnalyzeIn(BaseModel):
    surface_card: CardData

class RodFloatingRisk(BaseModel):
    risk_index: float
    components: dict

async def get_db(): yield None

# -- Endpoints --
@router.get("/{well_id}/dynamometer/latest", response_model=DynamometerCardOut)
async def get_latest_card(well_id: str, db: AsyncSession = Depends(get_db)):
    logger.info("Fetching latest dynamometer card", well_id=well_id)
    return DynamometerCardOut(
        id=uuid.uuid4(),
        ts=datetime.utcnow(),
        well_id=well_id,
        surface_card=CardData(position=[0, 10, 20], load=[500, 1000, 1500]),
        downhole_card=CardData(position=[0, 10, 20], load=[400, 900, 1300]),
        classification="Normal Operation",
        confidence=0.98
    )

@router.get("/{well_id}/dynamometer/history", response_model=List[DynamometerCardOut])
async def get_card_history(well_id: str, limit: int = 10, db: AsyncSession = Depends(get_db)):
    logger.info("Fetching dynamometer history", well_id=well_id, limit=limit)
    return []

@router.post("/{well_id}/dynamometer/analyze", response_model=DynamometerCardOut)
async def analyze_card(well_id: str, card: CardAnalyzeIn, db: AsyncSession = Depends(get_db)):
    logger.info("Analyzing dynamometer card", well_id=well_id)
    return DynamometerCardOut(
        id=uuid.uuid4(),
        ts=datetime.utcnow(),
        well_id=well_id,
        surface_card=card.surface_card,
        downhole_card=card.surface_card, # Mocked downhole derivation
        classification="Fluid Pound",
        confidence=0.85
    )

@router.get("/{well_id}/rod-floating-risk", response_model=RodFloatingRisk)
async def get_rod_floating_risk(well_id: str, db: AsyncSession = Depends(get_db)):
    logger.info("Calculating rod floating risk", well_id=well_id)
    return RodFloatingRisk(
        risk_index=0.25,
        components={
            "viscosity_drag": 0.15,
            "pump_speed": 0.10,
            "rod_weight": 0.00
        }
    )
