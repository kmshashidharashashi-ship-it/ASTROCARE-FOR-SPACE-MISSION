"""
ASTRACARE – Spacecraft Environmental Monitoring schemas.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class EnvironmentalReadingCreate(BaseModel):
    cabin_oxygen_pct: float = Field(..., ge=0.0, le=100.0, description="Cabin oxygen percentage")
    carbon_dioxide_mmhg: float = Field(..., ge=0.0, le=50.0, description="CO2 partial pressure")
    cabin_pressure_kpa: float = Field(..., ge=0.0, le=150.0, description="Pressure in kPa")
    cabin_temp_c: float = Field(..., ge=-20.0, le=50.0, description="Cabin temp in Celsius")
    humidity_pct: float = Field(..., ge=0.0, le=100.0, description="Relative humidity %")
    radiation_ambient_usv_h: Optional[float] = Field(default=20.0, ge=0.0)
    air_quality_index: Optional[float] = Field(default=95.0, ge=0.0, le=100.0)
    status: Optional[str] = Field(default="nominal")
    warnings_json: Optional[str] = None
    is_simulated: bool = Field(default=True)
    recorded_at: Optional[datetime] = None


class EnvironmentalReadingResponse(BaseModel):
    id: int
    recorded_at: datetime
    cabin_oxygen_pct: float
    carbon_dioxide_mmhg: float
    cabin_pressure_kpa: float
    cabin_temp_c: float
    humidity_pct: float
    radiation_ambient_usv_h: Optional[float]
    air_quality_index: Optional[float]
    status: str
    warnings_json: Optional[str]
    is_simulated: bool
    created_at: datetime

    model_config = {"from_attributes": True}
