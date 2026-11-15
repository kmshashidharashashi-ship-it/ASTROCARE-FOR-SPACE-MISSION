"""
ASTRACARE – Tests for Radiation Monitoring API.
"""

from __future__ import annotations

import pytest


class TestRadiationAPI:
    def test_submit_radiation_reading(self, client, default_astronaut):
        payload = {
            "astronaut_id": "AST-TEST",
            "current_rate_usv_h": 28.5,
            "cumulative_dose_msv": 15.6,
            "ionizing_index": 2.4,
            "radiation_status": "normal",
            "solar_particle_event": False,
        }
        res = client.post("/api/radiation/readings", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["current_rate_usv_h"] == 28.5
        assert data["cumulative_dose_msv"] == 15.6
        assert data["is_simulated"] is True

    def test_get_radiation_summary(self, client, default_astronaut):
        # Submit reading
        client.post("/api/radiation/readings", json={
            "astronaut_id": "AST-TEST",
            "current_rate_usv_h": 32.0,
            "cumulative_dose_msv": 18.0,
        })

        res = client.get("/api/radiation/AST-TEST")
        assert res.status_code == 200
        data = res.json()
        assert data["astronaut_id"] == "AST-TEST"
        assert data["latest_rate_usv_h"] == 32.0
        assert data["cumulative_dose_msv"] == 18.0
        assert len(data["history"]) >= 1
