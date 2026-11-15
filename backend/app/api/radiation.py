"""
ASTRACARE – Radiation API router.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.radiation_schema import (
    RadiationReadingCreate,
    RadiationReadingResponse,
    RadiationSummaryResponse,
)
from app.services.radiation_service import (
    get_radiation_summary,
    submit_radiation_reading,
)

router = APIRouter()


@router.post("/readings", response_model=RadiationReadingResponse, status_code=status.HTTP_201_CREATED)
def submit_reading(payload: RadiationReadingCreate, db: Session = Depends(get_db)):
    """Ingest a radiation dosimeter reading for an astronaut."""
    return submit_radiation_reading(db, payload)


@router.get("/{astronaut_id}", response_model=RadiationSummaryResponse)
def get_radiation(astronaut_id: str, limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    """Retrieve radiation dosage summary, cumulative exposure and timeline."""
    return get_radiation_summary(db, astronaut_id, limit=limit)
