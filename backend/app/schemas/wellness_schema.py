"""
ASTRACARE – Pydantic schemas for WellnessRecord.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, model_validator


class WellnessCheckinCreate(BaseModel):
    astronaut_id:  str           = Field(..., description="Astronaut public ID, e.g. 'AST-001'")
    recorded_at:   Optional[datetime] = None
    mood:          Optional[int] = Field(None, ge=1, le=10, description="1=very low, 10=excellent")
    stress_level:  Optional[int] = Field(None, ge=1, le=10, description="1=no stress, 10=extreme stress")
    fatigue_level: Optional[int] = Field(None, ge=1, le=10, description="1=no fatigue, 10=extreme fatigue")
    energy_level:  Optional[int] = Field(None, ge=1, le=10, description="1=no energy, 10=peak energy")
    sleep_quality: Optional[int] = Field(None, ge=1, le=10, description="1=terrible, 10=excellent")
    journal_entry: Optional[str] = Field(None, max_length=4096)
    data_source:   str           = Field("manual", pattern="^(manual|simulated|nasa)$")

    @model_validator(mode="after")
    def _at_least_one_field(self) -> "WellnessCheckinCreate":
        values = [self.mood, self.stress_level, self.fatigue_level, self.energy_level, self.sleep_quality]
        if all(v is None for v in values) and not self.journal_entry:
            raise ValueError("At least one wellness field or journal entry must be provided.")
        return self


class WellnessRecordResponse(BaseModel):
    id:            int
    astronaut_id:  int
    recorded_at:   datetime
    mood:          Optional[int]
    stress_level:  Optional[int]
    fatigue_level: Optional[int]
    energy_level:  Optional[int]
    sleep_quality: Optional[int]
    journal_entry: Optional[str]
    data_source:   str
    is_simulated:  bool
    created_at:    datetime

    model_config = {"from_attributes": True}


class WellnessTrendPoint(BaseModel):
    recorded_at:   datetime
    mood:          Optional[int]
    stress_level:  Optional[int]
    fatigue_level: Optional[int]
    energy_level:  Optional[int]
    sleep_quality: Optional[int]


class WellnessTrendsResponse(BaseModel):
    astronaut_id:  str
    total_records: int
    data:          List[WellnessTrendPoint]
