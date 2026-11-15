"""
ASTRACARE – Health records API router.
"""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.health_schema import (
    HealthRecordCreate,
    HealthRecordResponse,
    HealthTrendsResponse,
    PaginatedHealthResponse,
)
from app.services.health_service import (
    delete_health_record,
    get_health_history,
    get_health_trends,
    get_latest_record,
    submit_health_record,
)

router = APIRouter()


@router.post("/records", response_model=HealthRecordResponse, status_code=status.HTTP_201_CREATED)
def submit_record(payload: HealthRecordCreate, db: Session = Depends(get_db)):
    """Submit a new health measurement for an astronaut."""
    return submit_health_record(db, payload)


@router.get("/records/{astronaut_id}", response_model=PaginatedHealthResponse)
def get_records(
    astronaut_id: str,
    limit:  int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Return paginated health record history for an astronaut."""
    return get_health_history(db, astronaut_id, limit=limit, offset=offset)


@router.get("/records/{astronaut_id}/latest", response_model=Optional[HealthRecordResponse])
def get_latest(astronaut_id: str, db: Session = Depends(get_db)):
    """Return the most recent health record for an astronaut."""
    record = get_latest_record(db, astronaut_id)
    if record is None:
        raise HTTPException(status_code=404, detail="No health records found.")
    return record


@router.get("/records/{astronaut_id}/trends", response_model=HealthTrendsResponse)
def get_trends(
    astronaut_id: str,
    limit: int = Query(100, ge=10, le=500),
    db: Session = Depends(get_db),
):
    """Return time-series trend data for charting."""
    return get_health_trends(db, astronaut_id, limit=limit)


@router.delete("/records/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(record_id: int, db: Session = Depends(get_db)):
    """Delete a specific health record by its database ID."""
    deleted = delete_health_record(db, record_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Health record {record_id} not found.")
