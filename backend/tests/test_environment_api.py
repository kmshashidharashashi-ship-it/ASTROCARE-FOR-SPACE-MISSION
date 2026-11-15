"""
ASTRACARE – Tests for Spacecraft Environmental Telemetry API.
"""

from __future__ import annotations

import pytest


class TestEnvironmentAPI:
    def test_get_latest_environmental(self, client):
        res = client.get("/api/environment/latest")
        assert res.status_code == 200
        data = res.json()
        assert "cabin_oxygen_pct" in data
        assert "carbon_dioxide_mmhg" in data
        assert "cabin_pressure_kpa" in data
        assert data["status"] in ["nominal", "warning", "hazard"]

    def test_submit_environmental_reading(self, client):
        payload = {
            "cabin_oxygen_pct": 21.2,
            "carbon_dioxide_mmhg": 2.0,
            "cabin_pressure_kpa": 101.3,
            "cabin_temp_c": 22.0,
            "humidity_pct": 46.0,
        }
        res = client.post("/api/environment/readings", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["cabin_oxygen_pct"] == 21.2
        assert data["status"] == "nominal"

    def test_submit_hazardous_environmental_reading(self, client):
        payload = {
            "cabin_oxygen_pct": 18.0,  # Below 19.5% hypoxic threshold
            "carbon_dioxide_mmhg": 5.5, # High CO2
            "cabin_pressure_kpa": 98.0,
            "cabin_temp_c": 23.0,
            "humidity_pct": 50.0,
        }
        res = client.post("/api/environment/readings", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["status"] == "hazard"
        assert "Hypoxic Cabin Hazard" in data["warnings_json"]
