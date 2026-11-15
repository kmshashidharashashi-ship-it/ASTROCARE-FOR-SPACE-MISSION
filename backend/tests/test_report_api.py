"""
ASTRACARE – Tests for Medical Reports API and PDF generation.
"""

from __future__ import annotations

import pytest


class TestReportsAPI:
    def test_get_reports_empty(self, client):
        res = client.get("/api/reports/")
        assert res.status_code == 200
        data = res.json()
        assert "reports" in data
        assert isinstance(data["reports"], list)

    def test_generate_report(self, client, default_astronaut):
        # Generate report for default astronaut
        payload = {
            "astronaut_id": default_astronaut.astronaut_id,
            "report_type": "full",
            "notes": "Test flight medical dossier generation.",
        }
        res = client.post("/api/reports/generate", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["astronaut_id"] == default_astronaut.id
        assert data["report_type"] == "full"
        assert data["file_path"] is not None

        # Download report
        report_id = data["id"]
        res_dl = client.get(f"/api/reports/{report_id}/download")
        assert res_dl.status_code == 200
        assert res_dl.headers.get("content-type") == "application/pdf"
