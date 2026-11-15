"""
ASTRACARE – AI Astronaut Medical Emergency Assistant API Router.
Endpoints for active emergency triage, clinical decision support, protocol checklists,
medical officer assignments, incident action logging, and flight surgeon escalation.
"""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.astronaut import Astronaut
from app.models.health_record import HealthRecord
from app.models.radiation_reading import RadiationReading
from app.models.environmental_reading import EnvironmentalReading
from app.models.alert import Alert
from app.schemas.emergency_schema import (
    AcknowledgeRequest,
    ActionRequest,
    AssignRequest,
    ChecklistStepRequest,
    EscalateRequest,
    ResolveRequest,
    SimulateScenarioRequest,
)
from app.services.medical_emergency_service import (
    MISSION_MEDICAL_PROTOCOLS,
    acknowledge_emergency_alert,
    assign_medical_officer,
    evaluate_emergency_condition,
    escalate_to_flight_surgeon,
    get_active_emergency_alerts,
    get_astronaut_incidents,
    record_clinical_action,
    resolve_emergency_incident,
    update_checklist_step,
    _serialize_alert,
)
from app.services.alert_service import create_alert
from app.websocket.connection_manager import manager

router = APIRouter()


@router.get("/protocols")
def get_mission_medical_protocols():
    """Retrieve all evidence-based aerospace medical protocols and checklists."""
    return {
        "status": "success",
        "total_protocols": len(MISSION_MEDICAL_PROTOCOLS),
        "disclaimer": (
            "NASA-Related Space Medicine Research Platform. Experimental Decision-Support Only. "
            "Qualified Flight Surgeon retains exclusive clinical authority."
        ),
        "protocols": MISSION_MEDICAL_PROTOCOLS,
    }


@router.get("/alerts/active")
def list_active_emergencies(limit: int = Query(50, ge=1, le=100), db: Session = Depends(get_db)):
    """Retrieve all unresolved astronaut medical emergencies requiring clinical attention."""
    alerts = get_active_emergency_alerts(db, limit=limit)
    return {
        "total_active": len(alerts),
        "critical_count": sum(1 for a in alerts if a.get("severity") == "CRITICAL"),
        "alerts": alerts,
    }


@router.get("/incidents/{astronaut_id}")
def get_astronaut_incident_history(
    astronaut_id: str,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Retrieve complete clinical emergency history and actions taken for an astronaut."""
    incidents = get_astronaut_incidents(db, astronaut_id=astronaut_id, limit=limit)
    return {
        "astronaut_id": astronaut_id,
        "total_incidents": len(incidents),
        "incidents": incidents,
    }


@router.post("/detect/{astronaut_id}")
async def run_emergency_detection(astronaut_id: str, db: Session = Depends(get_db)):
    """
    Evaluate the latest astronaut telemetry against clinical emergency thresholds.
    If an acute condition is detected, an emergency alert with an evidence-based protocol is created.
    """
    ast = db.query(Astronaut).filter(Astronaut.astronaut_id == astronaut_id.upper()).first()
    if not ast:
        raise HTTPException(status_code=404, detail=f"Astronaut '{astronaut_id}' not found.")

    latest_health = (
        db.query(HealthRecord)
        .filter(HealthRecord.astronaut_id == ast.id)
        .order_by(HealthRecord.recorded_at.desc())
        .first()
    )
    latest_rad = (
        db.query(RadiationReading)
        .filter(RadiationReading.astronaut_id == ast.id)
        .order_by(RadiationReading.recorded_at.desc())
        .first()
    )
    latest_env = (
        db.query(EnvironmentalReading)
        .order_by(EnvironmentalReading.recorded_at.desc())
        .first()
    )

    evaluation = evaluate_emergency_condition(latest_health, latest_rad, latest_env)
    if not evaluation:
        return {
            "status": "nominal",
            "astronaut_id": astronaut_id,
            "message": "All current telemetry parameters are within nominal aerospace safety bounds.",
            "is_emergency": False,
        }

    # Check if an active alert already exists for this condition
    existing = (
        db.query(Alert)
        .filter(
            Alert.astronaut_id == ast.id,
            Alert.status.in_(["ACTIVE", "ACKNOWLEDGED", "ESCALATED"]),
            Alert.alert_type == "medical_emergency",
        )
        .first()
    )

    proto = evaluation["protocol"]
    init_checklist = [
        {"id": step["id"], "order": step["order"], "action": step["action"], "detail": step["detail"], "completed": False}
        for step in proto.get("response_steps", [])
    ]

    details_payload = {
        "organ_affected": evaluation["organ_affected"],
        "trigger_readings": evaluation["trigger_readings"],
        "ai_explanation": evaluation["ai_explanation"],
        "health_concern": evaluation["health_concern"],
        "protocol": proto,
        "is_simulated": latest_health.is_simulated if latest_health else True,
    }

    if not existing:
        alert = create_alert(
            db=db,
            astronaut_id=ast.id,
            alert_type="medical_emergency",
            severity=evaluation["severity"].lower(),
            message=evaluation["title"],
            related_record_id=latest_health.id if latest_health else None,
            details=json.dumps(details_payload),
        )
        alert.status = "ACTIVE"
        alert.assigned_role = proto.get("recommended_role", "Flight Surgeon")
        alert.checklist_state = json.dumps(init_checklist)
        alert.action_log = json.dumps([{
            "timestamp": datetime.utcnow().isoformat(),
            "actor": "AI Emergency Surveillance",
            "action": "EMERGENCY_DETECTED",
            "notes": evaluation["ai_explanation"],
        }])
        db.commit()
        db.refresh(alert)
    else:
        alert = existing

    serialized = _serialize_alert(alert)

    # Broadcast real-time emergency alert
    try:
        await manager.broadcast_alert({
            "event": "EMERGENCY_ALERT_UPDATED",
            "alert": serialized,
        })
    except Exception:
        pass

    return {
        "status": "emergency_detected",
        "astronaut_id": astronaut_id,
        "is_emergency": True,
        "alert": serialized,
    }


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert_endpoint(
    alert_id: int,
    payload: AcknowledgeRequest,
    db: Session = Depends(get_db),
):
    """Acknowledge an emergency alert and record medical officer response initiation."""
    updated = acknowledge_emergency_alert(
        db=db,
        alert_id=alert_id,
        reviewer_name=payload.reviewer_name,
        reviewer_role=payload.reviewer_role,
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found.")

    try:
        await manager.broadcast_alert({
            "event": "EMERGENCY_ALERT_ACKNOWLEDGED",
            "alert": updated,
        })
    except Exception:
        pass

    return {"status": "success", "message": "Alert acknowledged.", "alert": updated}


@router.post("/alerts/{alert_id}/assign")
async def assign_officer_endpoint(
    alert_id: int,
    payload: AssignRequest,
    db: Session = Depends(get_db),
):
    """Assign designated clinical personnel to an ongoing medical emergency."""
    updated = assign_medical_officer(
        db=db,
        alert_id=alert_id,
        officer_name=payload.officer_name,
        officer_role=payload.officer_role,
        assigned_by=payload.assigned_by,
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found.")

    try:
        await manager.broadcast_alert({
            "event": "EMERGENCY_OFFICER_ASSIGNED",
            "alert": updated,
        })
    except Exception:
        pass

    return {"status": "success", "message": "Officer assigned.", "alert": updated}


@router.post("/alerts/{alert_id}/checklist-step")
async def update_checklist_endpoint(
    alert_id: int,
    payload: ChecklistStepRequest,
    db: Session = Depends(get_db),
):
    """Update progress on a specific protocol response checklist step."""
    updated = update_checklist_step(
        db=db,
        alert_id=alert_id,
        step_id=payload.step_id,
        completed=payload.completed,
        user_name=payload.user_name,
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found.")

    try:
        await manager.broadcast_alert({
            "event": "EMERGENCY_CHECKLIST_UPDATED",
            "alert": updated,
        })
    except Exception:
        pass

    return {"status": "success", "alert": updated}


@router.post("/alerts/{alert_id}/action")
async def record_action_endpoint(
    alert_id: int,
    payload: ActionRequest,
    db: Session = Depends(get_db),
):
    """Append a clinical response note or action to the emergency incident log."""
    updated = record_clinical_action(
        db=db,
        alert_id=alert_id,
        action_type=payload.action_type,
        notes=payload.notes,
        actor_name=payload.actor_name,
        actor_role=payload.actor_role,
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found.")

    try:
        await manager.broadcast_alert({
            "event": "EMERGENCY_ACTION_RECORDED",
            "alert": updated,
        })
    except Exception:
        pass

    return {"status": "success", "message": "Clinical action recorded.", "alert": updated}


@router.post("/alerts/{alert_id}/escalate")
async def escalate_endpoint(
    alert_id: int,
    payload: EscalateRequest,
    db: Session = Depends(get_db),
):
    """Escalate critical emergency to the Lead Flight Surgeon."""
    updated = escalate_to_flight_surgeon(
        db=db,
        alert_id=alert_id,
        escalated_by=payload.escalated_by,
        escalation_reason=payload.escalation_reason,
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found.")

    try:
        await manager.broadcast_alert({
            "event": "EMERGENCY_ESCALATED",
            "alert": updated,
        })
    except Exception:
        pass

    return {"status": "success", "message": "Incident escalated to Flight Surgeon.", "alert": updated}


@router.post("/alerts/{alert_id}/resolve")
async def resolve_endpoint(
    alert_id: int,
    payload: ResolveRequest,
    db: Session = Depends(get_db),
):
    """Close and resolve an emergency incident with final clinical outcome notes."""
    updated = resolve_emergency_incident(
        db=db,
        alert_id=alert_id,
        resolved_by=payload.resolved_by,
        resolution_notes=payload.resolution_notes,
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found.")

    try:
        await manager.broadcast_alert({
            "event": "EMERGENCY_INCIDENT_RESOLVED",
            "alert": updated,
        })
    except Exception:
        pass

    return {"status": "success", "message": "Incident resolved.", "alert": updated}


@router.post("/simulate-scenario")
async def simulate_emergency_scenario(
    payload: SimulateScenarioRequest,
    db: Session = Depends(get_db),
):
    """
    Execute a repeatable simulated emergency scenario:
    1. Ingest simulated crisis telemetry.
    2. AI detects condition & matches clinical protocol.
    3. Emergency Alert created with checklist and assigned role.
    4. Real-time WebSocket event broadcast.
    """
    ast = db.query(Astronaut).filter(Astronaut.astronaut_id == payload.astronaut_id.upper()).first()
    if not ast:
        raise HTTPException(status_code=404, detail=f"Astronaut '{payload.astronaut_id}' not found.")

    now = datetime.utcnow()
    scenario = payload.scenario

    if scenario == "hypoxia":
        hr, bp_sys, bp_dia, spo2, temp = 112.0, 134.0, 88.0, 89.2, 36.8
        notes = "SIMULATED CRISIS: Acute hypoxic airlock desaturation."
        symptoms = "Sudden dyspnea, lightheadedness, arterial desaturation"
    elif scenario == "hyperthermia":
        hr, bp_sys, bp_dia, spo2, temp = 126.0, 140.0, 86.0, 96.5, 39.2
        notes = "SIMULATED CRISIS: Liquid Cooling Garment loop breakdown."
        symptoms = "Thermal distress, profuse sweating, core temperature spike"
    else:  # cardiac_tachycardia
        hr, bp_sys, bp_dia, spo2, temp = 144.0, 160.0, 98.0, 95.0, 37.0
        notes = "SIMULATED CRISIS: Resistive exercise supraventricular tachycardia."
        symptoms = "Acute palpitation episode, chest pressure, sudden tachycardia"

    # Create health record
    from app.schemas.health_schema import HealthRecordCreate
    from app.services.health_service import submit_health_record

    rec_in = HealthRecordCreate(
        astronaut_id=ast.astronaut_id,
        recorded_at=now,
        heart_rate=hr,
        systolic_bp=bp_sys,
        diastolic_bp=bp_dia,
        blood_sugar=96.0,
        body_temperature=temp,
        oxygen_saturation=spo2,
        sleep_duration=5.5,
        symptoms=symptoms,
        notes=notes,
        data_source="simulated",
    )
    new_record = submit_health_record(db, rec_in)

    # Evaluate emergency
    evaluation = evaluate_emergency_condition(new_record)
    proto = evaluation["protocol"] if evaluation else MISSION_MEDICAL_PROTOCOLS["cardiac_tachycardia"]

    init_checklist = [
        {"id": step["id"], "order": step["order"], "action": step["action"], "detail": step["detail"], "completed": False}
        for step in proto.get("response_steps", [])
    ]

    details_payload = {
        "organ_affected": proto.get("target_organ", "heart"),
        "trigger_readings": evaluation["trigger_readings"] if evaluation else [],
        "ai_explanation": evaluation["ai_explanation"] if evaluation else "Simulated cardiac anomaly.",
        "health_concern": evaluation["health_concern"] if evaluation else "Simulated Arrhythmia",
        "protocol": proto,
        "is_simulated": True,
    }

    alert = create_alert(
        db=db,
        astronaut_id=ast.id,
        alert_type="medical_emergency",
        severity=proto.get("severity", "CRITICAL").lower(),
        message=f"[SIMULATED] {evaluation['title'] if evaluation else 'Cardiac Emergency'}",
        related_record_id=new_record.id,
        details=json.dumps(details_payload),
    )
    alert.status = "ACTIVE"
    alert.assigned_role = proto.get("recommended_role", "Flight Surgeon")
    alert.checklist_state = json.dumps(init_checklist)
    alert.action_log = json.dumps([{
        "timestamp": now.isoformat(),
        "actor": "Simulated Ingestion Engine",
        "action": "CRISIS_SIMULATION_TRIGGERED",
        "notes": f"Scenario '{scenario}' initiated. Telemetry marked as SIMULATED.",
    }])
    db.commit()
    db.refresh(alert)

    serialized = _serialize_alert(alert)

    # Broadcast via WebSockets
    try:
        packet = {
            "event": "ABNORMAL_READING_TRIGGERED",
            "timestamp": now.isoformat(),
            "astronaut_id": ast.astronaut_id,
            "astronaut_name": ast.name,
            "organ_affected": proto.get("target_organ", "heart"),
            "risk_category": "CRITICAL",
            "health_record": {
                "id": new_record.id,
                "heart_rate": hr,
                "systolic_bp": bp_sys,
                "diastolic_bp": bp_dia,
                "oxygen_saturation": spo2,
                "body_temperature": temp,
                "is_simulated": True,
            },
            "alert": serialized,
        }
        await manager.broadcast_telemetry(packet)
        await manager.broadcast_alert(packet)
    except Exception:
        pass

    return {
        "status": "success",
        "scenario": scenario,
        "message": f"Simulated emergency scenario '{scenario}' successfully executed.",
        "alert": serialized,
    }
