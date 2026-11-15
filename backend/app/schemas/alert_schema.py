"""
ASTRACARE – Pydantic schemas for Alert.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class AlertResponse(BaseModel):
    id:                int
    astronaut_id:      int
    alert_type:        str
    severity:          str
    message:           str
    details:           Optional[str]
    related_record_id: Optional[int]
    is_reviewed:       bool
    reviewed_at:       Optional[datetime]
    reviewed_by:       Optional[str]
    created_at:        datetime

    model_config = {"from_attributes": True}


class AlertReviewRequest(BaseModel):
    reviewed_by: Optional[str] = Field(None, max_length=128)


class AlertListResponse(BaseModel):
    total:  int
    alerts: List[AlertResponse]
