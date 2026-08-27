from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
import pandera as pa
from pandera.typing import Series, DataFrame

class DataQualityFlag(str, Enum):
    GOOD = "GOOD"
    SUSPECT = "SUSPECT"
    BAD = "BAD"
    MISSING = "MISSING"

class CSSPhase(str, Enum):
    INJECTION = "INJECTION"
    SOAK = "SOAK"
    PRODUCTION = "PRODUCTION"

class DataSource(str, Enum):
    SYNTHETIC = "synthetic"
    SCADA = "scada"

class LabelSource(str, Enum):
    GROUND_TRUTH = "ground_truth"
    WEAK = "weak"
    MANUAL = "manual"

class WellState(BaseModel):
    timestamp: datetime
    well_id: str
    bht_c: float = Field(..., description="Bottom hole temperature in Celsius")
    viscosity_cp: float = Field(..., description="Viscosity in cP")
    spm: float = Field(..., description="Strokes per minute")
    stroke_len_m: float = Field(..., description="Stroke length in meters")
    vfd_pct: float = Field(..., description="VFD percentage")
    motor_current_a: float = Field(..., description="Motor current in Amps")
    surface_temp_c: float = Field(..., description="Surface temperature in Celsius")
    peak_load_n: float = Field(..., description="Peak load in Newtons")
    min_load_n: float = Field(..., description="Minimum load in Newtons")
    flow_bopd: float = Field(..., description="Flow in BOPD")
    css_phase: CSSPhase
    cycle_day: int
    quality_flag: DataQualityFlag = DataQualityFlag.GOOD
    source: DataSource

class LabelRow(BaseModel):
    timestamp: datetime
    well_id: str
    label_source: LabelSource
    failure_type: Optional[str]
    failure_within_7d: bool
    failure_within_30d: bool
    dynamometer_class: str

class WellStateSchema(pa.SchemaModel):
    timestamp: Series[pa.DateTime]
    well_id: Series[pa.String]
    bht_c: Series[pa.Float] = pa.Field(ge=0, le=400)
    viscosity_cp: Series[pa.Float] = pa.Field(ge=0)
    spm: Series[pa.Float] = pa.Field(ge=0)
    stroke_len_m: Series[pa.Float] = pa.Field(ge=0)
    vfd_pct: Series[pa.Float] = pa.Field(ge=0, le=100)
    motor_current_a: Series[pa.Float] = pa.Field(ge=0)
    surface_temp_c: Series[pa.Float]
    peak_load_n: Series[pa.Float]
    min_load_n: Series[pa.Float]
    flow_bopd: Series[pa.Float] = pa.Field(ge=0)
    css_phase: Series[pa.String] = pa.Field(isin=[e.value for e in CSSPhase])
    cycle_day: Series[pa.Int] = pa.Field(ge=0)
    quality_flag: Series[pa.String] = pa.Field(isin=[e.value for e in DataQualityFlag])
    source: Series[pa.String] = pa.Field(isin=[e.value for e in DataSource])

    class Config:
        coerce = True
