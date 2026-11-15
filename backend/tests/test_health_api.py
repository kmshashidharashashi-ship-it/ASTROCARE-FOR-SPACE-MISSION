"""
ASTRACARE – Tests for Health Records API.
"""

from __future__ import annotations

import pytest


class TestSubmitHealthRecord:
    def test_submit_valid_record(self, client, default_astronaut):
        payload = {
            "astronaut_id":     "AST-TEST",
            "heart_rate":       72.0,
            "systolic_bp":      120.0,
            "diastolic_bp":     80.0,
            "blood_sugar":      95.0,
            "body_temperature": 36.7,
            "oxygen_saturation":98.5,
            "sleep_duration":   7.5,
        }
        response = client.post("/api/health/records", json=payload)
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["heart_rate"] == 72.0
        assert data["is_simulated"] is False
        assert data["data_source"] == "manual"

    def test_submit_missing_astronaut(self, client):
        payload = {
            "astronaut_id": "AST-NONEXISTENT",
            "heart_rate":   72.0,
        }
        response = client.post("/api/health/records", json=payload)
        assert response.status_code == 404

    def test_submit_no_measurements_rejected(self, client, default_astronaut):
        payload = {
            "astronaut_id": "AST-TEST",
            # No measurement fields – should be rejected by validator
        }
        response = client.post("/api/health/records", json=payload)
        assert response.status_code == 422  # Unprocessable Entity

    def test_submit_out_of_range_value_rejected(self, client, default_astronaut):
        payload = {
            "astronaut_id": "AST-TEST",
            "heart_rate":   999.0,  # Exceeds max=300
        }
        response = client.post("/api/health/records", json=payload)
        assert response.status_code == 422

    def test_submit_simulated_record(self, client, default_astronaut):
        payload = {
            "astronaut_id": "AST-TEST",
            "heart_rate":   65.0,
            "data_source":  "simulated",
        }
        response = client.post("/api/health/records", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["is_simulated"] is True


class TestGetHealthRecords:
    def test_get_records_empty(self, client, default_astronaut):
        response = client.get("/api/health/records/AST-TEST")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["records"] == []

    def test_get_records_after_submission(self, client, default_astronaut):
        # Submit a record first
        payload = {"astronaut_id": "AST-TEST", "heart_rate": 70.0}
        client.post("/api/health/records", json=payload)

        response = client.get("/api/health/records/AST-TEST")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["records"]) == 1

    def test_get_records_nonexistent_astronaut(self, client):
        response = client.get("/api/health/records/AST-GHOST")
        assert response.status_code == 404

    def test_get_latest_no_records(self, client, default_astronaut):
        response = client.get("/api/health/records/AST-TEST/latest")
        assert response.status_code == 404

    def test_get_latest_returns_most_recent(self, client, default_astronaut):
        client.post("/api/health/records", json={"astronaut_id": "AST-TEST", "heart_rate": 60.0})
        client.post("/api/health/records", json={"astronaut_id": "AST-TEST", "heart_rate": 75.0})

        response = client.get("/api/health/records/AST-TEST/latest")
        assert response.status_code == 200
        data = response.json()
        assert data["heart_rate"] == 75.0


class TestDeleteHealthRecord:
    def test_delete_existing_record(self, client, default_astronaut):
        post_resp = client.post(
            "/api/health/records",
            json={"astronaut_id": "AST-TEST", "heart_rate": 68.0}
        )
        record_id = post_resp.json()["id"]

        del_resp = client.delete(f"/api/health/records/{record_id}")
        assert del_resp.status_code == 204

    def test_delete_nonexistent_record(self, client):
        response = client.delete("/api/health/records/999999")
        assert response.status_code == 404
