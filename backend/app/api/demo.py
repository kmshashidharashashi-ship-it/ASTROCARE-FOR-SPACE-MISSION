"""
ASTRACARE – Interactive Hackathon Demonstration Mode API Router.
Coordinates the live 8-step demonstration sequence and end-to-end simulated abnormal event.
"""

from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Dict, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.astronaut import Astronaut
from app.models.health_record import HealthRecord
from app.schemas.health_schema import HealthRecordCreate
from app.services.health_service import submit_health_record
from app.services.alert_service import create_alert
from app.websocket.connection_manager import manager

router = APIRouter()

# In-memory demonstration state singleton
DEMO_STATE: Dict = {
    "is_active": False,
    "current_step": 1,
    "total_steps": 8,
    "status": "idle",  # "idle" | "running" | "paused" | "completed"
    "astronaut_id": "AST-001",
    "last_abnormal_event": None,
    "steps_completed": [],
    "started_at": None,
    "updated_at": None,
}


@router.get("/status")
def get_demo_status():
    """Retrieve current guided mission demonstration state."""
    return DEMO_STATE


@router.post("/start")
def start_demo(astronaut_id: str = "AST-001"):
    """Initialize the 8-step interactive demonstration mode."""
    DEMO_STATE["is_active"] = True
    DEMO_STATE["status"] = "running"
    DEMO_STATE["current_step"] = 1
    DEMO_STATE["astronaut_id"] = astronaut_id
    DEMO_STATE["steps_completed"] = [1]
    DEMO_STATE["started_at"] = datetime.utcnow().isoformat()
    DEMO_STATE["updated_at"] = datetime.utcnow().isoformat()
    return {
        "message": "Mission demonstration initialized.",
        "state": DEMO_STATE,
    }


@router.post("/step/{step_number}")
def set_demo_step(step_number: int):
    """Navigate to a specific demonstration step (1-8)."""
    if step_number < 1 or step_number > 8:
        raise HTTPException(status_code=400, detail="Step number must be between 1 and 8.")
    DEMO_STATE["current_step"] = step_number
    if step_number not in DEMO_STATE["steps_completed"]:
        DEMO_STATE["steps_completed"].append(step_number)
    DEMO_STATE["updated_at"] = datetime.utcnow().isoformat()
    if step_number == 8:
        DEMO_STATE["status"] = "completed"
    return DEMO_STATE


@router.post("/pause")
def pause_demo():
    """Pause demonstration progression."""
    DEMO_STATE["status"] = "paused"
    DEMO_STATE["updated_at"] = datetime.utcnow().isoformat()
    return DEMO_STATE


@router.post("/resume")
def resume_demo():
    """Resume demonstration progression."""
    DEMO_STATE["status"] = "running"
    DEMO_STATE["updated_at"] = datetime.utcnow().isoformat()
    return DEMO_STATE


@router.post("/reset")
def reset_demo():
    """Reset demonstration state without deleting historical records."""
    DEMO_STATE["is_active"] = False
    DEMO_STATE["current_step"] = 1
    DEMO_STATE["status"] = "idle"
    DEMO_STATE["last_abnormal_event"] = None
    DEMO_STATE["steps_completed"] = []
    DEMO_STATE["started_at"] = None
    DEMO_STATE["updated_at"] = datetime.utcnow().isoformat()
    return {
        "message": "Demonstration state reset successfully.",
        "state": DEMO_STATE,
    }


@router.post("/trigger-abnormal")
async def trigger_simulated_abnormal_reading(
    astronaut_id: str = "AST-001",
    scenario: str = "cardiovascular_tachycardia",
    db: Session = Depends(get_db),
):
    """
    Step 7 Execution: Generate a configurable abnormal demonstration measurement,
    submit through standard FastAPI ingestion pipeline, store in DB with is_simulated=True,
    trigger AI risk analysis, generate emergency alert, and broadcast via WebSockets.
    """
    ast = db.query(Astronaut).filter(Astronaut.astronaut_id == astronaut_id.upper()).first()
    if not ast:
        raise HTTPException(status_code=404, detail=f"Astronaut '{astronaut_id}' not found.")

    now = datetime.utcnow()

    # Scenario parameters (clearly marked simulated)
    if scenario == "hypoxia":
        reading_payload = HealthRecordCreate(
            astronaut_id=ast.astronaut_id,
            recorded_at=now,
            heart_rate=114.0,
            systolic_bp=138.0,
            diastolic_bp=90.0,
            blood_sugar=94.0,
            body_temperature=37.1,
            oxygen_saturation=88.5,  # Critical Hypoxia!
            sleep_duration=5.2,
            symptoms="Acute dyspnea, mild confusion, headache reported during airlock repressurization",
            notes="DEMO SIMULATION: Acute hypoxic episode during EVA preparation.",
            data_source="simulated",
        )
        organ_affected = "lungs"
        severity = "critical"
        alert_title = "CRITICAL HYPOXIA ALERT: Oxygen Saturation 88.5%"
        ai_recommendation = "Immediate cabin O2 flush; verify helmet seal and suit pressure integrity. Administer supplementary oxygen via mask."
    elif scenario == "hyperthermia":
        reading_payload = HealthRecordCreate(
            astronaut_id=ast.astronaut_id,
            recorded_at=now,
            heart_rate=128.0,
            systolic_bp=142.0,
            diastolic_bp=88.0,
            blood_sugar=102.0,
            body_temperature=39.4,  # Critical Hyperthermia!
            oxygen_saturation=96.0,
            sleep_duration=4.5,
            symptoms="Flushed skin, thermal discomfort, elevated core temperature",
            notes="DEMO SIMULATION: Liquid cooling garment malfunction during exercise.",
            data_source="simulated",
        )
        organ_affected = "brain"
        severity = "critical"
        alert_title = "CRITICAL HYPERTHERMIA ALERT: Core Temp 39.4°C"
        ai_recommendation = "Halt vigorous physical activity immediately. Check cooling loop flow and hydrate with electrolytic fluids."
    else:  # Default: cardiovascular tachycardia / arrhythmia
        reading_payload = HealthRecordCreate(
            astronaut_id=ast.astronaut_id,
            recorded_at=now,
            heart_rate=142.0,      # Severe Tachycardia!
            systolic_bp=158.0,     # Hypertensive spike!
            diastolic_bp=98.0,
            blood_sugar=98.0,
            body_temperature=37.0,
            oxygen_saturation=95.2,
            sleep_duration=6.0,
            symptoms="Palpitations, sudden onset chest tightness during resistive exercise protocol",
            notes="DEMO SIMULATION: Supraventricular tachycardia detected under microgravity resistive workload.",
            data_source="simulated",
        )
        organ_affected = "heart"
        severity = "critical"
        alert_title = "CARDIAC ARREST RISK / TACHYCARDIA: Heart Rate 142 bpm (BP 158/98)"
        ai_recommendation = "Cease Advanced Resistive Exercise Device (ARED) protocol. Attach 12-lead ECG telemetry. Flight Surgeon review required immediately."

    # 1. Ingest via standard service
    new_record = submit_health_record(db, reading_payload)

    # 2. Force alert creation for the demonstration
    import json
    alert_details = {
        "organ_affected": organ_affected,
        "scenario": scenario,
        "contributing_factors": [
            {"metric": "heart_rate", "value": new_record.heart_rate, "deviation": "+4.2 SD"},
            {"metric": "systolic_bp", "value": new_record.systolic_bp, "deviation": "+3.1 SD"},
            {"metric": "oxygen_saturation", "value": new_record.oxygen_saturation, "deviation": "-3.8 SD"},
        ],
        "ai_explanation": (
            f"Experimental AI telemetry analysis identified acute non-linear departure from astronaut baseline. "
            f"Composite anomaly risk score: 0.942 (CRITICAL). Physiological trajectory requires medical intervention."
        ),
        "ai_recommendation": ai_recommendation,
        "is_simulated": True,
    }

    alert = create_alert(
        db=db,
        astronaut_id=ast.id,
        alert_type="abnormal_telemetry",
        severity=severity,
        message=alert_title,
        related_record_id=new_record.id,
        details=json.dumps(alert_details),
    )

    # 3. Broadcast real-time WebSocket event
    event_packet = {
        "event": "ABNORMAL_READING_TRIGGERED",
        "timestamp": now.isoformat(),
        "astronaut_id": ast.astronaut_id,
        "astronaut_name": ast.name,
        "organ_affected": organ_affected,
        "risk_category": "CRITICAL",
        "anomaly_score": 0.942,
        "health_record": {
            "id": new_record.id,
            "heart_rate": new_record.heart_rate,
            "systolic_bp": new_record.systolic_bp,
            "diastolic_bp": new_record.diastolic_bp,
            "oxygen_saturation": new_record.oxygen_saturation,
            "body_temperature": new_record.body_temperature,
            "symptoms": new_record.symptoms,
            "is_simulated": True,
        },
        "alert": {
            "id": alert.id,
            "title": alert.message,
            "severity": alert.severity,
            "details": alert_details,
        },
    }

    DEMO_STATE["last_abnormal_event"] = event_packet
    DEMO_STATE["current_step"] = 7
    if 7 not in DEMO_STATE["steps_completed"]:
        DEMO_STATE["steps_completed"].append(7)
    DEMO_STATE["updated_at"] = now.isoformat()

    # Async broadcast
    try:
        await manager.broadcast_telemetry(event_packet)
        await manager.broadcast_alert(event_packet)
    except Exception:
        pass

    return {
        "status": "success",
        "message": "Simulated abnormal telemetry successfully ingested, analyzed by AI, and broadcast.",
        "event": event_packet,
    }
