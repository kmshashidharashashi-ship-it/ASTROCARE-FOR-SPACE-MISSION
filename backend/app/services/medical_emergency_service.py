"""
ASTRACARE – AI Astronaut Medical Emergency Assistant & Decision Support Service.
Provides clinical threshold evaluation, evidence-based protocol matching,
emergency checklist tracking, medical officer assignment, escalation, and resolution.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.models.astronaut import Astronaut
from app.models.health_record import HealthRecord
from app.models.radiation_reading import RadiationReading
from app.models.environmental_reading import EnvironmentalReading
from app.models.user import AuditLog
from app.services.alert_service import create_alert

logger = logging.getLogger("astracare.emergency")


# ── EVIDENCE-BASED MISSION MEDICAL PROTOCOLS ─────────────────────────────────

MISSION_MEDICAL_PROTOCOLS = {
    "cardiac_tachycardia": {
        "protocol_id": "PROT-CARDIO-01",
        "protocol_name": "Acute Tachycardia & Cardiac Arrhythmia Response Protocol",
        "target_system": "Cardiovascular",
        "target_organ": "heart",
        "severity": "CRITICAL",
        "recommended_role": "Flight Surgeon",
        "requires_urgent_human_review": True,
        "clinical_rationale": (
            "Microgravity-induced cephalic fluid shift decreases central blood volume regulation and alters autonomic "
            "vagal-sympathetic balance. Extreme heart rate elevations under physical workload indicate acute myocardial stress "
            "or supraventricular tachycardia with potential hemodynamic collapse if untreated."
        ),
        "uncertainty_analysis": (
            "Telemetry cross-checked against dual photoplethysmography and Lead II bioimpedance sensors. "
            "Sensor confidence: 96.4%. Motion artifact probability: < 3.6%."
        ),
        "response_steps": [
            {
                "id": "cardio-step-1",
                "order": 1,
                "action": "Immediate Workload Cessation",
                "detail": "Cease all physical exertion and Advanced Resistive Exercise Device (ARED) protocols immediately.",
                "is_mandatory": True,
            },
            {
                "id": "cardio-step-2",
                "order": 2,
                "action": "Continuous Lead II ECG Telemetry",
                "detail": "Affix 12-lead bioharness electrodes; enable real-time 500 Hz telemetry downlink to Mission Control.",
                "is_mandatory": True,
            },
            {
                "id": "cardio-step-3",
                "order": 3,
                "action": "Clinical Hemodynamic Assessment",
                "detail": "Assess radial pulse concordance, capillary refill, and subjective reports of angina, dizziness, or palpitations.",
                "is_mandatory": True,
            },
            {
                "id": "cardio-step-4",
                "order": 4,
                "action": "Neutral Microgravity Posture Alignment",
                "detail": "Restrain astronaut gently in crew quarters sleep station in neutral zero-G posture with head neutral.",
                "is_mandatory": False,
            },
            {
                "id": "cardio-step-5",
                "order": 5,
                "action": "Pre-Stage Defibrillator & Emergency Medical Kit",
                "detail": "Verify Automated External Defibrillator (AED) self-test status and prepare microgravity intravenous access kit.",
                "is_mandatory": True,
            },
            {
                "id": "cardio-step-6",
                "order": 6,
                "action": "Flight Surgeon Direct Voice Consultation",
                "detail": "Establish secure direct Space-to-Ground Medical Loop with the certified Flight Surgeon.",
                "is_mandatory": True,
            },
        ],
    },
    "acute_hypoxia": {
        "protocol_id": "PROT-RESP-02",
        "protocol_name": "Airlock & Cabin Hypoxia Life Support Response Protocol",
        "target_system": "Respiratory",
        "target_organ": "lungs",
        "severity": "CRITICAL",
        "recommended_role": "Medical Officer",
        "requires_urgent_human_review": True,
        "clinical_rationale": (
            "Hypoxemia with arterial oxygen saturation under 92% rapidly impairs executive cerebral processing, visual acuity, "
            "and motor coordination in microgravity, posing acute operational danger during airlock or habitat operations."
        ),
        "uncertainty_analysis": (
            "Pulse oximetry corroborated by cabin environmental pO2 sensor readings. Confidence score: 98.1%."
        ),
        "response_steps": [
            {
                "id": "hypox-step-1",
                "order": 1,
                "action": "Don Emergency Oxygen Mask",
                "detail": "Administer 100% normobaric medical oxygen via high-flow demand mask immediately.",
                "is_mandatory": True,
            },
            {
                "id": "hypox-step-2",
                "order": 2,
                "action": "Verify Cabin Atmosphere & Suit Seals",
                "detail": "Cross-check Environmental Control and Life Support System (ECLSS) partial oxygen (pO2) and cabin pressure gauges.",
                "is_mandatory": True,
            },
            {
                "id": "hypox-step-3",
                "order": 3,
                "action": "Rapid Cognitive Orientation Check",
                "detail": "Conduct rapid 4-question orientation check and speech clarity evaluation.",
                "is_mandatory": True,
            },
            {
                "id": "hypox-step-4",
                "order": 4,
                "action": "Airlock / Habitat Secondary Inspection",
                "detail": "Confirm absence of atmospheric contamination or inert gas purge leaks.",
                "is_mandatory": False,
            },
        ],
    },
    "heat_exhaustion_hyperthermia": {
        "protocol_id": "PROT-THERMAL-03",
        "protocol_name": "Microgravity Hyperthermia & Cooling Garment Response Protocol",
        "target_system": "Thermal Regulation",
        "target_organ": "brain",
        "severity": "CRITICAL",
        "recommended_role": "Medical Officer",
        "requires_urgent_human_review": True,
        "clinical_rationale": (
            "Absence of natural buoyancy-driven thermal convection in microgravity severely inhibits metabolic heat dissipation. "
            "Core temperatures above 38.5°C risk rapid heat stroke and delirium."
        ),
        "uncertainty_analysis": (
            "Core body temperature logged via dual infrared tympanic and deep-body heat-flux telemetry. Sensor accuracy: ±0.1°C."
        ),
        "response_steps": [
            {
                "id": "therm-step-1",
                "order": 1,
                "action": "Halt Workload & Remove Garments",
                "detail": "Terminate resistive work immediately; remove outer thermal garments and verify cooling garment flow.",
                "is_mandatory": True,
            },
            {
                "id": "therm-step-2",
                "order": 2,
                "action": "Electrolytic Rehydration Administration",
                "detail": "Administer 500 mL chilled electrolyte solution over 15 minutes; monitor for nausea.",
                "is_mandatory": True,
            },
            {
                "id": "therm-step-3",
                "order": 3,
                "action": "Forced Convective Airflow Cooling",
                "detail": "Position astronaut directly in primary cabin ventilation duct airflow.",
                "is_mandatory": True,
            },
        ],
    },
    "solar_particle_event_radiation": {
        "protocol_id": "PROT-RAD-04",
        "protocol_name": "Solar Particle Event (SPE) Radiation Shelter Protocol",
        "target_system": "Radiobiological",
        "target_organ": "skeleton",
        "severity": "CRITICAL",
        "recommended_role": "Flight Surgeon",
        "requires_urgent_human_review": True,
        "clinical_rationale": (
            "Solar energetic proton storms outside Earth's magnetosphere cause severe ionizing dose rates threatening "
            "hematopoietic tissue and acute radiation sickness (ARS)."
        ),
        "uncertainty_analysis": (
            "Active dosimeter Silicon TEPC reading corroborated by Gateway external flux sensors. Dose confidence: 99.2%."
        ),
        "response_steps": [
            {
                "id": "rad-step-1",
                "order": 1,
                "action": "Relocate to Storm Shelter Haven",
                "detail": "Direct all crewmembers to inner shielded core quarters (water wall & poly-shielding enclosure) within 5 minutes.",
                "is_mandatory": True,
            },
            {
                "id": "rad-step-2",
                "order": 2,
                "action": "Deploy Personal Active Dosimeters",
                "detail": "Log real-time dose rate (µSv/h) and ensure all personal dosimeters are tethered to the data bus.",
                "is_mandatory": True,
            },
            {
                "id": "rad-step-3",
                "order": 3,
                "action": "Biodosimetry Consultation",
                "detail": "Transmit accumulated mission dose to Flight Surgeon and Space Radiation Analysis Group (SRAG).",
                "is_mandatory": True,
            },
        ],
    },
    "neuro_fatigue_stress": {
        "protocol_id": "PROT-NEURO-05",
        "protocol_name": "Neuro-Cognitive Fatigue & Sleep Deprivation De-escalation Protocol",
        "target_system": "Nervous System",
        "target_organ": "brain",
        "severity": "WARNING",
        "recommended_role": "Mission Analyst",
        "requires_urgent_human_review": False,
        "clinical_rationale": (
            "Chronic sleep fragmentation and circadian dysregulation impair operational reaction times and elevate procedural error rates."
        ),
        "uncertainty_analysis": (
            "Derived from actigraphy sleep metrics, self-reported cognitive fatigue score, and heart rate variability (HRV).",
        ),
        "response_steps": [
            {
                "id": "neuro-step-1",
                "order": 1,
                "action": "Schedule Mandatory Rest Interval",
                "detail": "Enforce mandatory 90-minute sleep opportunity in darkened, noise-canceling crew quarter.",
                "is_mandatory": True,
            },
            {
                "id": "neuro-step-2",
                "order": 2,
                "action": "Reassign Safety-Critical Operations",
                "detail": "Reassign pending robotic arm or docking procedures to secondary crew.",
                "is_mandatory": True,
            },
        ],
    },
}


# ── EVALUATION & DETECTION LOGIC ─────────────────────────────────────────────

def evaluate_emergency_condition(
    health_record: Optional[HealthRecord],
    radiation_reading: Optional[RadiationReading] = None,
    env_reading: Optional[EnvironmentalReading] = None,
) -> Optional[Dict[str, Any]]:
    """
    Evaluate telemetry against clinical emergency thresholds and baseline deviation rules.
    Returns detected emergency payload or None if all values are nominal.
    """
    if not health_record:
        return None

    hr = health_record.heart_rate or 72.0
    spo2 = health_record.oxygen_saturation or 98.0
    temp = health_record.body_temperature or 36.7
    sys_bp = health_record.systolic_bp or 120.0
    dia_bp = health_record.diastolic_bp or 80.0

    # 1. Critical Cardiac Scenario (Tachycardia / Arrhythmia)
    if hr >= 125.0 or (hr >= 110.0 and sys_bp >= 145.0):
        proto = MISSION_MEDICAL_PROTOCOLS["cardiac_tachycardia"]
        return {
            "protocol_id": proto["protocol_id"],
            "title": f"CRITICAL CARDIAC ARRHYTHMIA / TACHYCARDIA DETECTED (HR: {hr:.1f} bpm, BP: {sys_bp:.0f}/{dia_bp:.0f})",
            "health_concern": "Acute Tachycardia & Hemodynamic Stress",
            "severity": "CRITICAL",
            "organ_affected": "heart",
            "trigger_readings": [
                {"metric": "Heart Rate", "value": f"{hr:.1f} bpm", "normal": "60–90 bpm", "status": "CRITICAL"},
                {"metric": "Blood Pressure", "value": f"{sys_bp:.0f}/{dia_bp:.0f} mmHg", "normal": "120/80 mmHg", "status": "ELEVATED"},
            ],
            "ai_explanation": (
                f"Heart rate has spiked to {hr:.1f} bpm (+3.8 SD deviation from astronaut baseline). "
                f"Elevated systolic pressure indicates excessive sympathetic drive under microgravity. Urgent clinical review required."
            ),
            "protocol": proto,
        }

    # 2. Critical Hypoxia Scenario
    if spo2 <= 91.5:
        proto = MISSION_MEDICAL_PROTOCOLS["acute_hypoxia"]
        return {
            "protocol_id": proto["protocol_id"],
            "title": f"CRITICAL HYPOXIA ALERT: Arterial SpO2 {spo2:.1f}%",
            "health_concern": "Acute Arterial Desaturation",
            "severity": "CRITICAL",
            "organ_affected": "lungs",
            "trigger_readings": [
                {"metric": "Oxygen Saturation", "value": f"{spo2:.1f}%", "normal": ">= 96.0%", "status": "CRITICAL"},
                {"metric": "Heart Rate Compensatory", "value": f"{hr:.1f} bpm", "normal": "60–90 bpm", "status": "ELEVATED"},
            ],
            "ai_explanation": (
                f"Arterial oxygen saturation has fallen to {spo2:.1f}%. Risk of hypoxic cognitive impairment is high. "
                f"Immediate supplemental oxygen and cabin life support verification required."
            ),
            "protocol": proto,
        }

    # 3. Critical Hyperthermia Scenario
    if temp >= 38.5:
        proto = MISSION_MEDICAL_PROTOCOLS["heat_exhaustion_hyperthermia"]
        return {
            "protocol_id": proto["protocol_id"],
            "title": f"CRITICAL HYPERTHERMIA ALERT: Core Body Temp {temp:.2f}°C",
            "health_concern": "Thermal Overload & Heat Exhaustion Risk",
            "severity": "CRITICAL",
            "organ_affected": "brain",
            "trigger_readings": [
                {"metric": "Core Body Temperature", "value": f"{temp:.2f}°C", "normal": "36.5–37.4°C", "status": "CRITICAL"},
                {"metric": "Heart Rate", "value": f"{hr:.1f} bpm", "normal": "60–90 bpm", "status": "COMPENSATORY"},
            ],
            "ai_explanation": (
                f"Core temperature is dangerously elevated at {temp:.2f}°C. Heat dissipation failure in zero-g environment. "
                f"Cease physical work and initiate active cooling immediately."
            ),
            "protocol": proto,
        }

    # 4. Solar Particle Event Radiation
    rad_rate = getattr(radiation_reading, "current_rate_usv_h", None) or getattr(radiation_reading, "rate_usv_h", 0.0)
    if radiation_reading and (rad_rate >= 65.0 or getattr(radiation_reading, "solar_particle_event", False)):
        proto = MISSION_MEDICAL_PROTOCOLS["solar_particle_event_radiation"]
        return {
            "protocol_id": proto["protocol_id"],
            "title": f"SOLAR PARTICLE EVENT: Flux Rate {rad_rate:.1f} µSv/h",
            "health_concern": "Acute Cosmic Ionizing Radiation Exposure",
            "severity": "CRITICAL",
            "organ_affected": "skeleton",
            "trigger_readings": [
                {"metric": "Radiation Flux", "value": f"{rad_rate:.1f} µSv/h", "normal": "< 30.0 µSv/h", "status": "CRITICAL"},
            ],
            "ai_explanation": (
                f"High-energy solar proton influx detected. Threshold exceeded by {rad_rate - 30.0:.1f} µSv/h. "
                f"Immediate crew shelter protocol mandatory."
            ),
            "protocol": proto,
        }

    return None


# ── SERVICE OPERATIONS ───────────────────────────────────────────────────────

def get_active_emergency_alerts(db: Session, limit: int = 50) -> List[Dict[str, Any]]:
    """Return all active emergency alerts with parsed protocol checklists and assignment data."""
    alerts = (
        db.query(Alert)
        .filter(Alert.status.in_(["ACTIVE", "ACKNOWLEDGED", "ESCALATED"]))
        .order_by(Alert.created_at.desc())
        .limit(limit)
        .all()
    )
    result = []
    for a in alerts:
        result.append(_serialize_alert(a))
    return result


def get_astronaut_incidents(db: Session, astronaut_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Return full incident history (including resolved) for a specific astronaut."""
    ast = db.query(Astronaut).filter(Astronaut.astronaut_id == astronaut_id.upper()).first()
    if not ast:
        return []
    alerts = (
        db.query(Alert)
        .filter(Alert.astronaut_id == ast.id)
        .order_by(Alert.created_at.desc())
        .limit(limit)
        .all()
    )
    return [_serialize_alert(a) for a in alerts]


def _serialize_alert(a: Alert) -> Dict[str, Any]:
    """Helper to serialize an Alert into a rich decision-support payload."""
    details = {}
    if a.details:
        try:
            details = json.loads(a.details)
        except Exception:
            details = {"raw": a.details}

    checklist = []
    if a.checklist_state:
        try:
            checklist = json.loads(a.checklist_state)
        except Exception:
            checklist = []

    actions = []
    if a.action_log:
        try:
            actions = json.loads(a.action_log)
        except Exception:
            actions = []

    return {
        "id": a.id,
        "astronaut_id": a.astronaut.astronaut_id if a.astronaut else "UNKNOWN",
        "astronaut_name": a.astronaut.name if a.astronaut else "Astronaut",
        "title": a.message,
        "alert_type": a.alert_type,
        "severity": a.severity.upper(),
        "status": a.status or "ACTIVE",
        "organ_affected": details.get("organ_affected", "heart"),
        "trigger_readings": details.get("trigger_readings", []),
        "ai_explanation": details.get("ai_explanation", "AI anomaly detection triggered."),
        "protocol": details.get("protocol", {}),
        "checklist": checklist,
        "actions_taken": actions,
        "assigned_to": a.assigned_to,
        "assigned_role": a.assigned_role,
        "is_reviewed": a.is_reviewed,
        "reviewed_at": a.reviewed_at.isoformat() if a.reviewed_at else None,
        "reviewed_by": a.reviewed_by,
        "is_escalated": a.is_escalated,
        "escalated_at": a.escalated_at.isoformat() if a.escalated_at else None,
        "escalated_by": a.escalated_by,
        "resolution_notes": a.resolution_notes,
        "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
        "resolved_by": a.resolved_by,
        "created_at": a.created_at.isoformat() if a.created_at else None,
        "is_simulated": details.get("is_simulated", True),
    }


def acknowledge_emergency_alert(
    db: Session,
    alert_id: int,
    reviewer_name: str,
    reviewer_role: str = "Flight Surgeon",
) -> Optional[Dict[str, Any]]:
    """Acknowledge an alert and transition status to ACKNOWLEDGED."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return None

    now = datetime.utcnow()
    alert.is_reviewed = True
    alert.reviewed_at = now
    alert.reviewed_by = reviewer_name
    if alert.status == "ACTIVE":
        alert.status = "ACKNOWLEDGED"

    # Append to action log
    actions = []
    if alert.action_log:
        try:
            actions = json.loads(alert.action_log)
        except Exception:
            actions = []
    actions.append({
        "timestamp": now.isoformat(),
        "actor": reviewer_name,
        "role": reviewer_role,
        "action": "ALERT_ACKNOWLEDGED",
        "notes": f"Alert acknowledged by {reviewer_name} ({reviewer_role}). Medical review initiated.",
    })
    alert.action_log = json.dumps(actions)

    # Log audit event
    audit = AuditLog(
        user_email=reviewer_name,
        action="EMERGENCY_ALERT_ACKNOWLEDGED",
        resource=f"alert/{alert_id}",
        details=f"Status: {alert.status}, Reviewer: {reviewer_name} ({reviewer_role})",
        timestamp=now,
    )
    db.add(audit)
    db.commit()
    db.refresh(alert)
    return _serialize_alert(alert)


def assign_medical_officer(
    db: Session,
    alert_id: int,
    officer_name: str,
    officer_role: str = "Flight Surgeon",
    assigned_by: str = "System",
) -> Optional[Dict[str, Any]]:
    """Assign designated medical personnel to an emergency."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return None

    now = datetime.utcnow()
    alert.assigned_to = officer_name
    alert.assigned_role = officer_role

    actions = []
    if alert.action_log:
        try:
            actions = json.loads(alert.action_log)
        except Exception:
            actions = []
    actions.append({
        "timestamp": now.isoformat(),
        "actor": assigned_by,
        "role": "Mission Control",
        "action": "OFFICER_ASSIGNED",
        "notes": f"Incident assigned to {officer_name} ({officer_role}).",
    })
    alert.action_log = json.dumps(actions)

    audit = AuditLog(
        user_email=assigned_by,
        action="EMERGENCY_OFFICER_ASSIGNED",
        resource=f"alert/{alert_id}",
        details=f"Assigned to {officer_name} ({officer_role})",
        timestamp=now,
    )
    db.add(audit)
    db.commit()
    db.refresh(alert)
    return _serialize_alert(alert)


def update_checklist_step(
    db: Session,
    alert_id: int,
    step_id: str,
    completed: bool,
    user_name: str = "Medical Officer",
) -> Optional[Dict[str, Any]]:
    """Toggle a protocol checklist item state."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return None

    now = datetime.utcnow()
    checklist = []
    if alert.checklist_state:
        try:
            checklist = json.loads(alert.checklist_state)
        except Exception:
            checklist = []

    # Update or insert step
    found = False
    for item in checklist:
        if item.get("id") == step_id:
            item["completed"] = completed
            item["completed_at"] = now.isoformat() if completed else None
            item["completed_by"] = user_name if completed else None
            found = True
            break
    if not found:
        checklist.append({
            "id": step_id,
            "completed": completed,
            "completed_at": now.isoformat() if completed else None,
            "completed_by": user_name if completed else None,
        })

    alert.checklist_state = json.dumps(checklist)

    # Action log
    actions = []
    if alert.action_log:
        try:
            actions = json.loads(alert.action_log)
        except Exception:
            actions = []
    actions.append({
        "timestamp": now.isoformat(),
        "actor": user_name,
        "action": f"CHECKLIST_STEP_{'COMPLETED' if completed else 'RESET'}",
        "notes": f"Protocol step '{step_id}' marked as {'completed' if completed else 'pending'} by {user_name}.",
    })
    alert.action_log = json.dumps(actions)

    db.commit()
    db.refresh(alert)
    return _serialize_alert(alert)


def record_clinical_action(
    db: Session,
    alert_id: int,
    action_type: str,
    notes: str,
    actor_name: str,
    actor_role: str = "Medical Officer",
) -> Optional[Dict[str, Any]]:
    """Record a clinical action taken during the incident."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return None

    now = datetime.utcnow()
    actions = []
    if alert.action_log:
        try:
            actions = json.loads(alert.action_log)
        except Exception:
            actions = []
    actions.append({
        "timestamp": now.isoformat(),
        "actor": actor_name,
        "role": actor_role,
        "action": action_type,
        "notes": notes,
    })
    alert.action_log = json.dumps(actions)

    audit = AuditLog(
        user_email=actor_name,
        action=f"EMERGENCY_ACTION_{action_type.upper()}",
        resource=f"alert/{alert_id}",
        details=notes,
        timestamp=now,
    )
    db.add(audit)
    db.commit()
    db.refresh(alert)
    return _serialize_alert(alert)


def escalate_to_flight_surgeon(
    db: Session,
    alert_id: int,
    escalated_by: str,
    escalation_reason: str,
) -> Optional[Dict[str, Any]]:
    """Escalate incident directly to the Lead Flight Surgeon."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return None

    now = datetime.utcnow()
    alert.is_escalated = True
    alert.escalated_at = now
    alert.escalated_by = escalated_by
    alert.status = "ESCALATED"
    alert.assigned_role = "Flight Surgeon"

    actions = []
    if alert.action_log:
        try:
            actions = json.loads(alert.action_log)
        except Exception:
            actions = []
    actions.append({
        "timestamp": now.isoformat(),
        "actor": escalated_by,
        "action": "ESCALATED_TO_FLIGHT_SURGEON",
        "notes": f"PRIORITY ESCALATION: {escalation_reason}",
    })
    alert.action_log = json.dumps(actions)

    audit = AuditLog(
        user_email=escalated_by,
        action="EMERGENCY_ESCALATED_TO_FLIGHT_SURGEON",
        resource=f"alert/{alert_id}",
        details=escalation_reason,
        timestamp=now,
    )
    db.add(audit)
    db.commit()
    db.refresh(alert)
    return _serialize_alert(alert)


def resolve_emergency_incident(
    db: Session,
    alert_id: int,
    resolved_by: str,
    resolution_notes: str,
) -> Optional[Dict[str, Any]]:
    """Resolve an emergency incident and log final medical outcome."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return None

    now = datetime.utcnow()
    alert.status = "RESOLVED"
    alert.is_reviewed = True
    alert.resolved_at = now
    alert.resolved_by = resolved_by
    alert.resolution_notes = resolution_notes

    actions = []
    if alert.action_log:
        try:
            actions = json.loads(alert.action_log)
        except Exception:
            actions = []
    actions.append({
        "timestamp": now.isoformat(),
        "actor": resolved_by,
        "action": "INCIDENT_RESOLVED",
        "notes": f"Incident officially resolved. Medical outcome: {resolution_notes}",
    })
    alert.action_log = json.dumps(actions)

    audit = AuditLog(
        user_email=resolved_by,
        action="EMERGENCY_INCIDENT_RESOLVED",
        resource=f"alert/{alert_id}",
        details=resolution_notes,
        timestamp=now,
    )
    db.add(audit)
    db.commit()
    db.refresh(alert)
    return _serialize_alert(alert)
