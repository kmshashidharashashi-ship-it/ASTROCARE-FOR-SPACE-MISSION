"""
ASTRACARE – Tests for AI Astronaut Medical Emergency Assistant API.
"""

from __future__ import annotations

import pytest
from app.models.health_record import HealthRecord
from datetime import datetime


class TestEmergencyAPI:
    def test_get_medical_protocols(self, client):
        res = client.get("/api/emergency/protocols")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert "cardiac_tachycardia" in data["protocols"]
        assert "acute_hypoxia" in data["protocols"]
        assert "disclaimer" in data

    def test_detect_nominal_telemetry(self, client, default_astronaut, db_session):
        # Create normal health record
        rec = HealthRecord(
            astronaut_id=default_astronaut.id,
            recorded_at=datetime.utcnow(),
            heart_rate=72.0,
            systolic_bp=120.0,
            diastolic_bp=80.0,
            blood_sugar=95.0,
            body_temperature=36.7,
            oxygen_saturation=98.5,
            sleep_duration=7.5,
            data_source="sensor",
            is_simulated=False,
        )
        db_session.add(rec)
        db_session.commit()

        res = client.post(f"/api/emergency/detect/{default_astronaut.astronaut_id}")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "nominal"
        assert data["is_emergency"] is False

    def test_simulate_cardiac_scenario_and_lifecycle(self, client, default_astronaut):
        # 1. Trigger simulated cardiac crisis
        sim_payload = {
            "astronaut_id": default_astronaut.astronaut_id,
            "scenario": "cardiac_tachycardia",
        }
        res_sim = client.post("/api/emergency/simulate-scenario", json=sim_payload)
        assert res_sim.status_code == 200
        data_sim = res_sim.json()
        assert data_sim["status"] == "success"
        alert = data_sim["alert"]
        alert_id = alert["id"]
        assert alert["severity"] == "CRITICAL"
        assert alert["organ_affected"] == "heart"
        assert alert["status"] == "ACTIVE"
        assert len(alert["checklist"]) >= 4

        # 2. Check active alerts endpoint
        res_active = client.get("/api/emergency/alerts/active")
        assert res_active.status_code == 200
        active_data = res_active.json()
        assert active_data["total_active"] >= 1
        assert any(a["id"] == alert_id for a in active_data["alerts"])

        # 3. Acknowledge alert
        ack_payload = {
            "reviewer_name": "Dr. Eleanor Smith",
            "reviewer_role": "Flight Surgeon",
        }
        res_ack = client.post(f"/api/emergency/alerts/{alert_id}/acknowledge", json=ack_payload)
        assert res_ack.status_code == 200
        assert res_ack.json()["alert"]["status"] == "ACKNOWLEDGED"
        assert res_ack.json()["alert"]["reviewed_by"] == "Dr. Eleanor Smith"

        # 4. Assign Medical Officer
        assign_payload = {
            "officer_name": "Dr. Sarah Lindqvist",
            "officer_role": "Flight Surgeon",
            "assigned_by": "Mission Commander",
        }
        res_assign = client.post(f"/api/emergency/alerts/{alert_id}/assign", json=assign_payload)
        assert res_assign.status_code == 200
        assert res_assign.json()["alert"]["assigned_to"] == "Dr. Sarah Lindqvist"

        # 5. Toggle Checklist Step
        step_id = alert["checklist"][0]["id"]
        step_payload = {
            "step_id": step_id,
            "completed": True,
            "user_name": "Dr. Sarah Lindqvist",
        }
        res_step = client.post(f"/api/emergency/alerts/{alert_id}/checklist-step", json=step_payload)
        assert res_step.status_code == 200
        updated_checklist = res_step.json()["alert"]["checklist"]
        step_entry = next((s for s in updated_checklist if s["id"] == step_id), None)
        assert step_entry is not None
        assert step_entry["completed"] is True

        # 6. Record Clinical Action Taken
        action_payload = {
            "action_type": "ECG_HARNESS_APPLIED",
            "notes": "12-lead bioharness affixed. Continuous 500 Hz telemetry confirms sinus tachycardia without ST segment elevation.",
            "actor_name": "Dr. Sarah Lindqvist",
            "actor_role": "Flight Surgeon",
        }
        res_action = client.post(f"/api/emergency/alerts/{alert_id}/action", json=action_payload)
        assert res_action.status_code == 200
        actions = res_action.json()["alert"]["actions_taken"]
        assert len(actions) >= 1
        assert any("ECG_HARNESS_APPLIED" in a.get("action", "") for a in actions)

        # 7. Escalate to Flight Surgeon
        esc_payload = {
            "escalated_by": "Medical Officer Marcus",
            "escalation_reason": "Sustained heart rate above 140 bpm despite rest interval. Requesting pharmacological guidance.",
        }
        res_esc = client.post(f"/api/emergency/alerts/{alert_id}/escalate", json=esc_payload)
        assert res_esc.status_code == 200
        assert res_esc.json()["alert"]["status"] == "ESCALATED"
        assert res_esc.json()["alert"]["is_escalated"] is True

        # 8. Resolve Incident
        res_payload = {
            "resolved_by": "Dr. Eleanor Smith (Lead Surgeon)",
            "resolution_notes": "Astronaut returned to nominal heart rate (76 bpm) post 20-minute rest & electrolyte hydration. Cleared for light duties.",
        }
        res_resolve = client.post(f"/api/emergency/alerts/{alert_id}/resolve", json=res_payload)
        assert res_resolve.status_code == 200
        assert res_resolve.json()["alert"]["status"] == "RESOLVED"
        assert res_resolve.json()["alert"]["resolution_notes"] is not None

        # 9. Verify incident history
        res_hist = client.get(f"/api/emergency/incidents/{default_astronaut.astronaut_id}")
        assert res_hist.status_code == 200
        incidents = res_hist.json()["incidents"]
        assert len(incidents) >= 1
        assert any(i["id"] == alert_id for i in incidents)

    def test_hypoxia_scenario(self, client, default_astronaut):
        res = client.post("/api/emergency/simulate-scenario", json={
            "astronaut_id": default_astronaut.astronaut_id,
            "scenario": "hypoxia",
        })
        assert res.status_code == 200
        data = res.json()["alert"]
        assert data["organ_affected"] == "lungs"
        assert data["severity"] == "CRITICAL"
        assert "HYPOXIA" in data["title"].upper()
