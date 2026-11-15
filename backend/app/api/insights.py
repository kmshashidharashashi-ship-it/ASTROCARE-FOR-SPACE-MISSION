"""
ASTRACARE – Insights & ML analysis API router.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.alert_schema import AlertListResponse, AlertReviewRequest
from app.schemas.analysis_schema import InsightResponse, SimulateReadingResponse
from app.services.alert_service import get_alerts, mark_alert_reviewed
from app.services.health_service import get_health_history, submit_health_record
from app.services.simulation_service import generate_simulated_reading
from app.services.insight_service import run_full_analysis

router = APIRouter()


@router.post("/analyze/{astronaut_id}", response_model=InsightResponse)
def analyze_astronaut(astronaut_id: str, db: Session = Depends(get_db)):
    """
    Run ML anomaly detection + baseline comparison on the latest readings.
    Returns a full InsightResponse.
    """
    result = run_full_analysis(db, astronaut_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Astronaut '{astronaut_id}' not found.")
    return result


@router.get("/alerts/{astronaut_id}", response_model=AlertListResponse)
def list_alerts(
    astronaut_id: str,
    include_reviewed: bool = Query(False),
    db: Session = Depends(get_db),
):
    """Return alerts for an astronaut, optionally including already-reviewed ones."""
    from app.models.astronaut import Astronaut
    ast = db.query(Astronaut).filter(Astronaut.astronaut_id == astronaut_id.upper()).first()
    if not ast:
        raise HTTPException(status_code=404, detail=f"Astronaut '{astronaut_id}' not found.")

    alerts = get_alerts(db, ast.id, include_reviewed=include_reviewed)
    return AlertListResponse(total=len(alerts), alerts=alerts)


@router.put("/alerts/{alert_id}/review", status_code=status.HTTP_200_OK)
def review_alert(alert_id: int, payload: AlertReviewRequest, db: Session = Depends(get_db)):
    """Mark an alert as reviewed."""
    alert = mark_alert_reviewed(db, alert_id, reviewed_by=payload.reviewed_by)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found.")
    return {"message": "Alert marked as reviewed.", "alert_id": alert_id}


@router.post("/simulate/start/{astronaut_id}", response_model=SimulateReadingResponse)
def simulate_single(astronaut_id: str, db: Session = Depends(get_db)):
    """Generate one simulated health reading and store it."""
    from app.models.astronaut import Astronaut
    ast = db.query(Astronaut).filter(Astronaut.astronaut_id == astronaut_id.upper()).first()
    if not ast:
        raise HTTPException(status_code=404, detail=f"Astronaut '{astronaut_id}' not found.")

    record, analysis = generate_simulated_reading(db, ast)
    return SimulateReadingResponse(
        message="Simulated reading generated and stored.",
        health_record=record,
        analysis=analysis,
    )


@router.post("/simulate/batch/{astronaut_id}")
def simulate_batch(
    astronaut_id: str,
    count: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """
    Generate a batch of simulated readings (for demo / onboarding).
    Returns a summary of records created.
    """
    from app.models.astronaut import Astronaut
    ast = db.query(Astronaut).filter(Astronaut.astronaut_id == astronaut_id.upper()).first()
    if not ast:
        raise HTTPException(status_code=404, detail=f"Astronaut '{astronaut_id}' not found.")

    created = 0
    anomalies_found = 0
    for _ in range(count):
        record, analysis = generate_simulated_reading(db, ast)
        created += 1
        if analysis and analysis.get("is_anomaly"):
            anomalies_found += 1

    return {
        "message":          f"Batch simulation complete.",
        "astronaut_id":     astronaut_id,
        "records_created":  created,
        "anomalies_found":  anomalies_found,
        "note":             "All records are clearly marked as simulated data.",
    }
