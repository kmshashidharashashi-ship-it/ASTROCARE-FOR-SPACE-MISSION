"""
ASTRACARE – Pydantic schemas for HealthRecord.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class HealthRecordCreate(BaseModel):
    astronaut_id:      str              = Field(..., description="Astronaut public ID, e.g. 'AST-001'")
    recorded_at:       Optional[datetime] = None
    heart_rate:        Optional[float]  = Field(None, ge=20, le=300, description="bpm")
    systolic_bp:       Optional[float]  = Field(None, ge=50, le=300, description="mmHg")
    diastolic_bp:      Optional[float]  = Field(None, ge=20, le=200, description="mmHg")
    blood_sugar:       Optional[float]  = Field(None, ge=20, le=600, description="mg/dL")
    body_temperature:  Optional[float]  = Field(None, ge=30.0, le=45.0, description="°C")
    oxygen_saturation: Optional[float]  = Field(None, ge=50.0, le=100.0, description="%")
    sleep_duration:    Optional[float]  = Field(None, ge=0.0, le=24.0, description="hours")
    symptoms:          Optional[str]    = Field(None, max_length=2048)
    notes:             Optional[str]    = Field(None, max_length=2048)
    data_source:       str              = Field("manual", pattern="^(manual|simulated|nasa)$")

    @model_validator(mode="after")
    def _at_least_one_measurement(self) -> "HealthRecordCreate":
        metrics = [
            self.heart_rate, self.systolic_bp, self.diastolic_bp,
            self.blood_sugar, self.body_temperature,
            self.oxygen_saturation, self.sleep_duration,
        ]
        if all(m is None for m in metrics):
            raise ValueError("At least one health measurement must be provided.")
        return self


class HealthRecordResponse(BaseModel):
    id:                int
    astronaut_id:      int
    recorded_at:       datetime
    heart_rate:        Optional[float]
    systolic_bp:       Optional[float]
    diastolic_bp:      Optional[float]
    blood_sugar:       Optional[float]
    body_temperature:  Optional[float]
    oxygen_saturation: Optional[float]
    sleep_duration:    Optional[float]
    symptoms:          Optional[str]
    notes:             Optional[str]
    data_source:       str
    is_simulated:      bool
    anomaly_score:     Optional[float]
    is_anomaly:        Optional[bool]
    created_at:        datetime

    model_config = {"from_attributes": True}


class HealthTrendPoint(BaseModel):
    recorded_at:       datetime
    heart_rate:        Optional[float]
    systolic_bp:       Optional[float]
    diastolic_bp:      Optional[float]
    blood_sugar:       Optional[float]
    body_temperature:  Optional[float]
    oxygen_saturation: Optional[float]
    sleep_duration:    Optional[float]
    is_anomaly:        Optional[bool]


class HealthTrendsResponse(BaseModel):
    astronaut_id: str
    total_records: int
    data: List[HealthTrendPoint]


class PaginatedHealthResponse(BaseModel):
    total:   int
    offset:  int
    limit:   int
    records: List[HealthRecordResponse]
