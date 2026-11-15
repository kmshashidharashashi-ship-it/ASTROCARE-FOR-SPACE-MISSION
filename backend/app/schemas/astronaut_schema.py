"""
ASTRACARE – Pydantic schemas for Astronaut.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class AstronautBase(BaseModel):
    name:               str              = Field(..., min_length=1, max_length=128)
    age:                Optional[int]    = Field(None, ge=18, le=80)
    gender:             Optional[str]    = Field(None, max_length=32)
    blood_type:         Optional[str]    = Field(None, max_length=8)
    mission_name:       Optional[str]    = Field(None, max_length=256)
    mission_start_date: Optional[date]   = None
    role:               Optional[str]    = Field(None, max_length=128)
    avatar_initials:    Optional[str]    = Field(None, max_length=4)


class AstronautCreate(AstronautBase):
    astronaut_id: str = Field(..., min_length=1, max_length=32, pattern=r"^AST-\w+$")

    @field_validator("astronaut_id")
    @classmethod
    def _uppercase_id(cls, v: str) -> str:
        return v.upper()


class AstronautUpdate(BaseModel):
    name:               Optional[str]  = Field(None, min_length=1, max_length=128)
    age:                Optional[int]  = Field(None, ge=18, le=80)
    gender:             Optional[str]  = Field(None, max_length=32)
    blood_type:         Optional[str]  = Field(None, max_length=8)
    mission_name:       Optional[str]  = Field(None, max_length=256)
    mission_start_date: Optional[date] = None
    role:               Optional[str]  = Field(None, max_length=128)
    avatar_initials:    Optional[str]  = Field(None, max_length=4)


class AstronautResponse(AstronautBase):
    id:           int
    astronaut_id: str
    created_at:   datetime
    updated_at:   datetime

    model_config = {"from_attributes": True}


class MissionDayResponse(BaseModel):
    astronaut_id:       str
    mission_name:       Optional[str]
    mission_start_date: Optional[date]
    mission_day:        Optional[int]
    message:            str
