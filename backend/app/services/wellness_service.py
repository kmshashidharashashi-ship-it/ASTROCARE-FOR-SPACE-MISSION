"""
ASTRACARE – Wellness service layer.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.astronaut import Astronaut
from app.models.wellness_record import WellnessRecord
from app.schemas.wellness_schema import (
    WellnessCheckinCreate,
    WellnessRecordResponse,
    WellnessTrendPoint,
    WellnessTrendsResponse,
)


def _get_astronaut(db: Session, astronaut_id: str) -> Optional[Astronaut]:
    return db.query(Astronaut).filter(
        Astronaut.astronaut_id == astronaut_id.upper()
    ).first()


def submit_wellness_checkin(db: Session, payload: WellnessCheckinCreate) -> WellnessRecord:
    """Persist a wellness check-in."""
    ast = _get_astronaut(db, payload.astronaut_id)
    if not ast:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Astronaut '{payload.astronaut_id}' not found.")

    record = WellnessRecord(
        astronaut_id  = ast.id,
        recorded_at   = payload.recorded_at or datetime.utcnow(),
        mood          = payload.mood,
        stress_level  = payload.stress_level,
        fatigue_level = payload.fatigue_level,
        energy_level  = payload.energy_level,
        sleep_quality = payload.sleep_quality,
        journal_entry = payload.journal_entry,
        data_source   = payload.data_source,
        is_simulated  = payload.data_source == "simulated",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_wellness_history(
    db: Session, astronaut_id: str, limit: int = 50, offset: int = 0
) -> List[WellnessRecordResponse]:
    ast = _get_astronaut(db, astronaut_id)
    if not ast:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Astronaut '{astronaut_id}' not found.")

    records = (
        db.query(WellnessRecord)
        .filter(WellnessRecord.astronaut_id == ast.id)
        .order_by(WellnessRecord.recorded_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [WellnessRecordResponse.model_validate(r) for r in records]


def get_latest_wellness(db: Session, astronaut_id: str) -> Optional[WellnessRecord]:
    ast = _get_astronaut(db, astronaut_id)
    if not ast:
        return None
    return (
        db.query(WellnessRecord)
        .filter(WellnessRecord.astronaut_id == ast.id)
        .order_by(WellnessRecord.recorded_at.desc())
        .first()
    )


def get_wellness_trends(
    db: Session, astronaut_id: str, limit: int = 100
) -> WellnessTrendsResponse:
    ast = _get_astronaut(db, astronaut_id)
    if not ast:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Astronaut '{astronaut_id}' not found.")

    records = (
        db.query(WellnessRecord)
        .filter(WellnessRecord.astronaut_id == ast.id)
        .order_by(WellnessRecord.recorded_at.asc())
        .limit(limit)
        .all()
    )
    data_points = [
        WellnessTrendPoint(
            recorded_at   = r.recorded_at,
            mood          = r.mood,
            stress_level  = r.stress_level,
            fatigue_level = r.fatigue_level,
            energy_level  = r.energy_level,
            sleep_quality = r.sleep_quality,
        )
        for r in records
    ]
    return WellnessTrendsResponse(
        astronaut_id  = astronaut_id.upper(),
        total_records = len(records),
        data          = data_points,
    )
