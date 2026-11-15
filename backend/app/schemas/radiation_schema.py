"""
ASTRACARE – Radiation schemas.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class RadiationReadingCreate(BaseModel):
    astronaut_id: str
    current_rate_usv_h: float = Field(..., ge=0.0, le=10000.0, description="Rate in uSv/h")
    cumulative_dose_msv: float = Field(..., ge=0.0, le=5000.0, description="Dose in mSv")
    ionizing_index: Optional[float] = Field(default=2.5, ge=0.0, le=10.0)
    radiation_status: str = Field(default="normal")
    solar_particle_event: bool = Field(default=False)
    data_source: str = Field(default="simulated_dosimeter")
    notes: Optional[str] = None
    recorded_at: Optional[datetime] = None


class RadiationReadingResponse(BaseModel):
    id: int
    astronaut_id: int
    recorded_at: datetime
    current_rate_usv_h: float
    cumulative_dose_msv: float
    ionizing_index: Optional[float]
    radiation_status: str
    solar_particle_event: bool
    data_source: str
    is_simulated: bool
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class RadiationSummaryResponse(BaseModel):
    astronaut_id: str
    latest_rate_usv_h: float
    cumulative_dose_msv: float
    annual_limit_pct: float
    status: str
    solar_particle_event: bool
    history: List[RadiationReadingResponse]
