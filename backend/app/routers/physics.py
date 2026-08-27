from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
import structlog

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/wells", tags=["physics"])

# -- Models --
class PhysicsState(BaseModel):
    thermal_decay_rate: float
    viscosity_cp: float
    mobility: float
    sor: float
    rod_mechanics_stress: float

class ThermalCurvePoint(BaseModel):
    time_h: float
    bht_c: float
    viscosity_cp: float

class ViscosityCurvePoint(BaseModel):
    temperature_c: float
    viscosity_cp: float

class EnergyBalance(BaseModel):
    energy_per_barrel_mj: float
    sor_trend: str

async def get_db(): yield None

# -- Endpoints --
@router.get("/{well_id}/physics/state", response_model=PhysicsState)
async def get_physics_state(well_id: str, db=Depends(get_db)):
    logger.info("Retrieving physics state", well_id=well_id)
    return PhysicsState(
        thermal_decay_rate=-0.05,
        viscosity_cp=240.5,
        mobility=1.8,
        sor=2.1,
        rod_mechanics_stress=125.0
    )

@router.get("/{well_id}/physics/thermal-curve", response_model=List[ThermalCurvePoint])
async def get_thermal_curve(well_id: str, db=Depends(get_db)):
    logger.info("Generating thermal decay curve", well_id=well_id)
    return [
        ThermalCurvePoint(time_h=0, bht_c=250.0, viscosity_cp=10.0),
        ThermalCurvePoint(time_h=24, bht_c=200.0, viscosity_cp=50.0),
        ThermalCurvePoint(time_h=48, bht_c=150.0, viscosity_cp=250.0)
    ]

@router.get("/{well_id}/physics/viscosity-curve", response_model=List[ViscosityCurvePoint])
async def get_viscosity_curve(well_id: str, db=Depends(get_db)):
    logger.info("Retrieving viscosity curve", well_id=well_id)
    return [
        ViscosityCurvePoint(temperature_c=50.0, viscosity_cp=1500.0),
        ViscosityCurvePoint(temperature_c=150.0, viscosity_cp=250.0),
        ViscosityCurvePoint(temperature_c=250.0, viscosity_cp=10.0)
    ]

@router.get("/{well_id}/physics/energy-balance", response_model=EnergyBalance)
async def get_energy_balance(well_id: str, db=Depends(get_db)):
    logger.info("Computing energy balance", well_id=well_id)
    return EnergyBalance(energy_per_barrel_mj=450.5, sor_trend="stable")
