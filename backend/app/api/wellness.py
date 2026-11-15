"""
ASTRACARE – Wellness check-in API router.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.wellness_schema import (
    WellnessCheckinCreate,
    WellnessRecordResponse,
    WellnessTrendsResponse,
)
from app.services.wellness_service import (
    get_latest_wellness,
    get_wellness_history,
    get_wellness_trends,
    submit_wellness_checkin,
)

router = APIRouter()


@router.post("/checkins", response_model=WellnessRecordResponse, status_code=status.HTTP_201_CREATED)
def submit_checkin(payload: WellnessCheckinCreate, db: Session = Depends(get_db)):
    """Submit a new wellness check-in for an astronaut."""
    return submit_wellness_checkin(db, payload)


@router.get("/checkins/{astronaut_id}", response_model=list)
def get_checkins(
    astronaut_id: str,
    limit:  int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Return wellness check-in history for an astronaut."""
    return get_wellness_history(db, astronaut_id, limit=limit, offset=offset)


@router.get("/checkins/{astronaut_id}/latest", response_model=Optional[WellnessRecordResponse])
def get_latest(astronaut_id: str, db: Session = Depends(get_db)):
    """Return the most recent wellness check-in for an astronaut."""
    record = get_latest_wellness(db, astronaut_id)
    if record is None:
        raise HTTPException(status_code=404, detail="No wellness records found.")
    return record


@router.get("/checkins/{astronaut_id}/trends", response_model=WellnessTrendsResponse)
def get_trends(
    astronaut_id: str,
    limit: int = Query(100, ge=10, le=500),
    db: Session = Depends(get_db),
):
    """Return wellness trend data for charting."""
    return get_wellness_trends(db, astronaut_id, limit=limit)
