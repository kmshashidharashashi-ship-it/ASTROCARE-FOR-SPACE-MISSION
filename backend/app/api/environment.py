"""
ASTRACARE – Spacecraft Environmental Monitoring API router.
"""

from __future__ import annotations

from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.environmental_schema import EnvironmentalReadingCreate, EnvironmentalReadingResponse
from app.services.environmental_service import (
    get_environmental_history,
    get_latest_environmental,
    submit_environmental_reading,
)

router = APIRouter()


@router.get("/latest", response_model=EnvironmentalReadingResponse)
def get_latest(db: Session = Depends(get_db)):
    """Get the most recent cabin environmental telemetry."""
    return get_latest_environmental(db)


@router.get("/history", response_model=List[EnvironmentalReadingResponse])
def get_history(limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    """Get historical spacecraft atmospheric telemetry."""
    return get_environmental_history(db, limit=limit)


@router.post("/readings", response_model=EnvironmentalReadingResponse, status_code=status.HTTP_201_CREATED)
def submit_reading(payload: EnvironmentalReadingCreate, db: Session = Depends(get_db)):
    """Ingest environmental telemetry."""
    return submit_environmental_reading(db, payload)
