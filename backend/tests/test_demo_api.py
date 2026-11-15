"""
ASTRACARE – Tests for Interactive Hackathon Demonstration API.
"""

from __future__ import annotations

import pytest


class TestDemonstrationAPI:
    def test_get_demo_status(self, client):
        res = client.get("/api/demo/status")
        assert res.status_code == 200
        data = res.json()
        assert "current_step" in data
        assert "total_steps" in data
        assert data["total_steps"] == 8

    def test_start_and_pause_resume_demo(self, client, default_astronaut):
        # Start
        res_start = client.post("/api/demo/start?astronaut_id=AST-TEST")
        assert res_start.status_code == 200
        assert res_start.json()["state"]["status"] == "running"
        assert res_start.json()["state"]["current_step"] == 1

        # Pause
        res_pause = client.post("/api/demo/pause")
        assert res_pause.status_code == 200
        assert res_pause.json()["status"] == "paused"

        # Resume
        res_resume = client.post("/api/demo/resume")
        assert res_resume.status_code == 200
        assert res_resume.json()["status"] == "running"

    def test_step_progression(self, client):
        client.post("/api/demo/start")
        res_step = client.post("/api/demo/step/3")
        assert res_step.status_code == 200
        assert res_step.json()["current_step"] == 3

    def test_trigger_simulated_abnormal_reading(self, client, default_astronaut):
        client.post("/api/demo/start?astronaut_id=AST-TEST")

        res = client.post("/api/demo/trigger-abnormal?astronaut_id=AST-TEST&scenario=cardiovascular_tachycardia")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        event = data["event"]
        assert event["event"] == "ABNORMAL_READING_TRIGGERED"
        assert event["organ_affected"] == "heart"
        assert event["risk_category"] == "CRITICAL"
        assert event["health_record"]["heart_rate"] == 142.0
        assert event["health_record"]["is_simulated"] is True
        assert "details" in event["alert"]
        assert event["alert"]["severity"] == "critical"

    def test_reset_demo(self, client):
        client.post("/api/demo/start")
        res = client.post("/api/demo/reset")
        assert res.status_code == 200
        assert res.json()["state"]["status"] == "idle"
        assert res.json()["state"]["current_step"] == 1
