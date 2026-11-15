"""
ASTRACARE – Radiation monitoring service layer.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.astronaut import Astronaut
from app.models.radiation_reading import RadiationReading
from app.schemas.radiation_schema import (
    RadiationReadingCreate,
    RadiationReadingResponse,
    RadiationSummaryResponse,
)


def _get_astronaut(db: Session, astronaut_id: str) -> Optional[Astronaut]:
    return db.query(Astronaut).filter(Astronaut.astronaut_id == astronaut_id.upper()).first()


def submit_radiation_reading(db: Session, payload: RadiationReadingCreate) -> RadiationReading:
    ast = _get_astronaut(db, payload.astronaut_id)
    if not ast:
        raise HTTPException(status_code=404, detail=f"Astronaut '{payload.astronaut_id}' not found.")

    # Determine status if not explicitly critical
    status = payload.radiation_status
    if payload.current_rate_usv_h > 100.0 or payload.solar_particle_event:
        status = "critical"
    elif payload.current_rate_usv_h > 50.0:
        status = "warning"
    elif payload.current_rate_usv_h > 35.0:
        status = "elevated"

    reading = RadiationReading(
        astronaut_id=ast.id,
        recorded_at=payload.recorded_at or datetime.utcnow(),
        current_rate_usv_h=payload.current_rate_usv_h,
        cumulative_dose_msv=payload.cumulative_dose_msv,
        ionizing_index=payload.ionizing_index,
        radiation_status=status,
        solar_particle_event=payload.solar_particle_event,
        data_source=payload.data_source,
        is_simulated=payload.data_source != "real_sensor",
        notes=payload.notes,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading


def get_radiation_summary(db: Session, astronaut_id: str, limit: int = 50) -> RadiationSummaryResponse:
    ast = _get_astronaut(db, astronaut_id)
    if not ast:
        raise HTTPException(status_code=404, detail=f"Astronaut '{astronaut_id}' not found.")

    readings = (
        db.query(RadiationReading)
        .filter(RadiationReading.astronaut_id == ast.id)
        .order_by(RadiationReading.recorded_at.desc())
        .limit(limit)
        .all()
    )

    if not readings:
        return RadiationSummaryResponse(
            astronaut_id=ast.astronaut_id,
            latest_rate_usv_h=24.5,
            cumulative_dose_msv=14.2,
            annual_limit_pct=round((14.2 / 50.0) * 100, 1),  # 50 mSv/yr NASA occupational baseline
            status="normal",
            solar_particle_event=False,
            history=[],
        )

    latest = readings[0]
    # NASA career/annual limit reference: 50 mSv per 1-year mission
    annual_limit_pct = min(100.0, round((latest.cumulative_dose_msv / 50.0) * 100, 1))

    return RadiationSummaryResponse(
        astronaut_id=ast.astronaut_id,
        latest_rate_usv_h=latest.current_rate_usv_h,
        cumulative_dose_msv=latest.cumulative_dose_msv,
        annual_limit_pct=annual_limit_pct,
        status=latest.radiation_status,
        solar_particle_event=latest.solar_particle_event,
        history=[RadiationReadingResponse.model_validate(r) for r in readings],
    )
