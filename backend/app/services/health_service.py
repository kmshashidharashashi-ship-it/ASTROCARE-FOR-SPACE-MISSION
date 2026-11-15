"""
ASTRACARE – Health service layer.
"""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.astronaut import Astronaut
from app.models.health_record import HealthRecord
from app.ml.preprocessing import prepare_features_for_anomaly_detection, validate_health_readings
from app.ml.anomaly_detection import AnomalyDetector
from app.schemas.health_schema import (
    HealthRecordCreate,
    HealthRecordResponse,
    HealthTrendPoint,
    HealthTrendsResponse,
    PaginatedHealthResponse,
)


def _get_astronaut(db: Session, astronaut_id: str) -> Optional[Astronaut]:
    return db.query(Astronaut).filter(
        Astronaut.astronaut_id == astronaut_id.upper()
    ).first()


def _record_to_dict(record: HealthRecord) -> Dict:
    return {
        "id":                record.id,
        "astronaut_id":      record.astronaut_id,
        "recorded_at":       record.recorded_at.isoformat() if record.recorded_at else None,
        "heart_rate":        record.heart_rate,
        "systolic_bp":       record.systolic_bp,
        "diastolic_bp":      record.diastolic_bp,
        "blood_sugar":       record.blood_sugar,
        "body_temperature":  record.body_temperature,
        "oxygen_saturation": record.oxygen_saturation,
        "sleep_duration":    record.sleep_duration,
    }


def submit_health_record(db: Session, payload: HealthRecordCreate) -> HealthRecord:
    """
    Validate and persist a health record, then run anomaly detection.
    If an anomaly is found, create an alert.
    """
    # Resolve astronaut
    ast = _get_astronaut(db, payload.astronaut_id)
    if not ast:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Astronaut '{payload.astronaut_id}' not found.")

    # Validate physiological ranges
    reading_dict = payload.model_dump(exclude={"astronaut_id", "data_source"})
    validation = validate_health_readings(reading_dict)
    # We persist but note warnings in case

    # Build DB record
    record = HealthRecord(
        astronaut_id      = ast.id,
        recorded_at       = payload.recorded_at or datetime.utcnow(),
        heart_rate        = payload.heart_rate,
        systolic_bp       = payload.systolic_bp,
        diastolic_bp      = payload.diastolic_bp,
        blood_sugar       = payload.blood_sugar,
        body_temperature  = payload.body_temperature,
        oxygen_saturation = payload.oxygen_saturation,
        sleep_duration    = payload.sleep_duration,
        symptoms          = payload.symptoms,
        notes             = payload.notes,
        data_source       = payload.data_source,
        is_simulated      = payload.data_source == "simulated",
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # Run anomaly detection on historical data
    _run_anomaly_detection_and_alert(db, ast, record)

    db.refresh(record)
    return record


def _run_anomaly_detection_and_alert(
    db: Session, ast: Astronaut, new_record: HealthRecord
) -> None:
    """Train on historical records excluding the new one, then analyse new reading."""
    historical = (
        db.query(HealthRecord)
        .filter(HealthRecord.astronaut_id == ast.id, HealthRecord.id != new_record.id)
        .order_by(HealthRecord.recorded_at)
        .all()
    )
    if len(historical) < 10:
        return  # Not enough data

    history_dicts = [_record_to_dict(r) for r in historical]
    features = prepare_features_for_anomaly_detection(history_dicts)
    if features is None:
        return

    new_reading_dict = _record_to_dict(new_record)
    detector = AnomalyDetector()
    result = detector.analyze_single_reading(new_reading_dict, features)

    # Update record with anomaly info
    new_record.anomaly_score = result.get("anomaly_score")
    new_record.is_anomaly    = result.get("is_anomaly", False)
    db.commit()

    # Create alert if anomaly detected
    if result.get("is_anomaly"):
        import json
        from app.services.alert_service import create_alert
        factors = result.get("contributing_factors", [])
        message = (
            f"Anomaly detected in health reading for {ast.name}. "
            f"Score: {result.get('anomaly_score', 'N/A'):.3f}."
        )
        create_alert(
            db=db,
            astronaut_id=ast.id,
            alert_type="anomaly",
            message=message,
            severity=_score_to_severity(result.get("anomaly_score", 0.0)),
            related_record_id=new_record.id,
            details=json.dumps({"contributing_factors": factors}),
        )


def _score_to_severity(score: float) -> str:
    if score >= 0.75:
        return "critical"
    elif score >= 0.5:
        return "high"
    elif score >= 0.3:
        return "medium"
    return "low"


def get_health_history(
    db: Session, astronaut_id: str, limit: int = 50, offset: int = 0
) -> PaginatedHealthResponse:
    ast = _get_astronaut(db, astronaut_id)
    if not ast:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Astronaut '{astronaut_id}' not found.")

    total = db.query(HealthRecord).filter(HealthRecord.astronaut_id == ast.id).count()
    records = (
        db.query(HealthRecord)
        .filter(HealthRecord.astronaut_id == ast.id)
        .order_by(HealthRecord.recorded_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return PaginatedHealthResponse(
        total=total,
        offset=offset,
        limit=limit,
        records=[HealthRecordResponse.model_validate(r) for r in records],
    )


def get_latest_record(db: Session, astronaut_id: str) -> Optional[HealthRecord]:
    ast = _get_astronaut(db, astronaut_id)
    if not ast:
        return None
    return (
        db.query(HealthRecord)
        .filter(HealthRecord.astronaut_id == ast.id)
        .order_by(HealthRecord.recorded_at.desc())
        .first()
    )


def get_health_trends(
    db: Session, astronaut_id: str, limit: int = 100
) -> HealthTrendsResponse:
    ast = _get_astronaut(db, astronaut_id)
    if not ast:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Astronaut '{astronaut_id}' not found.")

    records = (
        db.query(HealthRecord)
        .filter(HealthRecord.astronaut_id == ast.id)
        .order_by(HealthRecord.recorded_at.asc())
        .limit(limit)
        .all()
    )
    data_points = [
        HealthTrendPoint(
            recorded_at       = r.recorded_at,
            heart_rate        = r.heart_rate,
            systolic_bp       = r.systolic_bp,
            diastolic_bp      = r.diastolic_bp,
            blood_sugar       = r.blood_sugar,
            body_temperature  = r.body_temperature,
            oxygen_saturation = r.oxygen_saturation,
            sleep_duration    = r.sleep_duration,
            is_anomaly        = r.is_anomaly,
        )
        for r in records
    ]
    return HealthTrendsResponse(
        astronaut_id  = astronaut_id.upper(),
        total_records = len(records),
        data          = data_points,
    )


def delete_health_record(db: Session, record_id: int) -> bool:
    record = db.query(HealthRecord).filter(HealthRecord.id == record_id).first()
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True
