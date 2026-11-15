"""
ASTRACARE – Authentication and User Pydantic schemas.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


VALID_ROLES: List[str] = [
    "Mission Commander",
    "Flight Surgeon",
    "Medical Officer",
    "Mission Analyst",
    "Administrator",
]


class UserRegisterRequest(BaseModel):
    email: str = Field(..., description="User's official mission email")
    password: str = Field(..., min_length=6, description="Minimum 6 characters password")
    full_name: str = Field(..., min_length=2, max_length=128)
    role: str = Field(default="Medical Officer", description="Role in mission control")
    callsign: Optional[str] = Field(default=None, max_length=64)


class UserLoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    callsign: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
