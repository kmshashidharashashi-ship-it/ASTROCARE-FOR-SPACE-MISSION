"""
ASTRACARE – Tests for Wellness API.
"""

from __future__ import annotations

import pytest


class TestSubmitWellnessCheckin:
    def test_submit_valid_checkin(self, client, default_astronaut):
        payload = {
            "astronaut_id":  "AST-TEST",
            "mood":          8,
            "stress_level":  3,
            "fatigue_level": 4,
            "energy_level":  7,
            "sleep_quality": 8,
        }
        response = client.post("/api/wellness/checkins", json=payload)
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["mood"] == 8
        assert data["stress_level"] == 3
        assert data["is_simulated"] is False

    def test_submit_journal_only(self, client, default_astronaut):
        payload = {
            "astronaut_id":  "AST-TEST",
            "journal_entry": "Feeling good today. Zero gravity is still amazing.",
        }
        response = client.post("/api/wellness/checkins", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["journal_entry"] == "Feeling good today. Zero gravity is still amazing."

    def test_submit_empty_checkin_rejected(self, client, default_astronaut):
        payload = {"astronaut_id": "AST-TEST"}  # No fields
        response = client.post("/api/wellness/checkins", json=payload)
        assert response.status_code == 422

    def test_submit_out_of_range_mood(self, client, default_astronaut):
        payload = {"astronaut_id": "AST-TEST", "mood": 11}  # max is 10
        response = client.post("/api/wellness/checkins", json=payload)
        assert response.status_code == 422

    def test_submit_missing_astronaut(self, client):
        payload = {"astronaut_id": "AST-NOBODY", "mood": 5}
        response = client.post("/api/wellness/checkins", json=payload)
        assert response.status_code == 404


class TestGetWellnessCheckins:
    def test_get_checkins_empty(self, client, default_astronaut):
        response = client.get("/api/wellness/checkins/AST-TEST")
        assert response.status_code == 200
        assert response.json() == []

    def test_get_checkins_after_submission(self, client, default_astronaut):
        client.post("/api/wellness/checkins", json={"astronaut_id": "AST-TEST", "mood": 7})
        client.post("/api/wellness/checkins", json={"astronaut_id": "AST-TEST", "mood": 6})

        response = client.get("/api/wellness/checkins/AST-TEST")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    def test_get_latest_checkin(self, client, default_astronaut):
        client.post("/api/wellness/checkins", json={"astronaut_id": "AST-TEST", "mood": 5})
        client.post("/api/wellness/checkins", json={"astronaut_id": "AST-TEST", "mood": 9})

        response = client.get("/api/wellness/checkins/AST-TEST/latest")
        assert response.status_code == 200
        data = response.json()
        assert data["mood"] == 9

    def test_get_latest_no_records(self, client, default_astronaut):
        response = client.get("/api/wellness/checkins/AST-TEST/latest")
        assert response.status_code == 404

    def test_get_trends(self, client, default_astronaut):
        for mood_val in [5, 6, 7, 8, 9]:
            client.post(
                "/api/wellness/checkins",
                json={"astronaut_id": "AST-TEST", "mood": mood_val}
            )

        response = client.get("/api/wellness/checkins/AST-TEST/trends")
        assert response.status_code == 200
        data = response.json()
        assert data["total_records"] == 5
        assert len(data["data"]) == 5
