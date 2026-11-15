"""
ASTRACARE – Spacecraft environmental service layer.
"""

from __future__ import annotations

import json
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.environmental_reading import EnvironmentalReading
from app.schemas.environmental_schema import EnvironmentalReadingCreate, EnvironmentalReadingResponse


def submit_environmental_reading(db: Session, payload: EnvironmentalReadingCreate) -> EnvironmentalReading:
    warnings = []
    status = payload.status or "nominal"

    if payload.cabin_oxygen_pct < 19.5:
        warnings.append("Hypoxic Cabin Hazard: O2 < 19.5%")
        status = "hazard"
    elif payload.cabin_oxygen_pct > 23.5:
        warnings.append("Hyperoxic Fire Risk: O2 > 23.5%")
        if status != "hazard":
            status = "warning"

    if payload.carbon_dioxide_mmhg > 4.5:
        warnings.append("Hypercapnia Risk: CO2 > 4.5 mmHg")
        if payload.carbon_dioxide_mmhg > 6.0:
            status = "hazard"
        elif status != "hazard":
            status = "warning"

    if payload.cabin_pressure_kpa < 90.0:
        warnings.append("Rapid Depressurization Warning")
        status = "hazard"

    reading = EnvironmentalReading(
        recorded_at=payload.recorded_at or datetime.utcnow(),
        cabin_oxygen_pct=payload.cabin_oxygen_pct,
        carbon_dioxide_mmhg=payload.carbon_dioxide_mmhg,
        cabin_pressure_kpa=payload.cabin_pressure_kpa,
        cabin_temp_c=payload.cabin_temp_c,
        humidity_pct=payload.humidity_pct,
        radiation_ambient_usv_h=payload.radiation_ambient_usv_h,
        air_quality_index=payload.air_quality_index,
        status=status,
        warnings_json=json.dumps(warnings) if warnings else None,
        is_simulated=payload.is_simulated,
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading


def get_latest_environmental(db: Session) -> EnvironmentalReadingResponse:
    reading = db.query(EnvironmentalReading).order_by(EnvironmentalReading.recorded_at.desc()).first()
    if not reading:
        # Provide default nominal fallback
        return EnvironmentalReadingResponse(
            id=1,
            recorded_at=datetime.utcnow(),
            cabin_oxygen_pct=21.0,
            carbon_dioxide_mmhg=2.1,
            cabin_pressure_kpa=101.3,
            cabin_temp_c=22.4,
            humidity_pct=48.0,
            radiation_ambient_usv_h=22.4,
            air_quality_index=98.0,
            status="nominal",
            warnings_json="[]",
            is_simulated=True,
            created_at=datetime.utcnow(),
        )
    return EnvironmentalReadingResponse.model_validate(reading)


def get_environmental_history(db: Session, limit: int = 50) -> List[EnvironmentalReadingResponse]:
    readings = db.query(EnvironmentalReading).order_by(EnvironmentalReading.recorded_at.desc()).limit(limit).all()
    return [EnvironmentalReadingResponse.model_validate(r) for r in readings]
