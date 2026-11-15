"""
ASTRACARE – Tests for NASA Open-Data Explorer API.
"""

from __future__ import annotations

import pytest


class TestNasaAPI:
    def test_get_nasa_datasets(self, client):
        res = client.get("/api/nasa/datasets")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert data["total"] >= 5
        assert len(data["datasets"]) >= 5

    def test_filter_nasa_datasets_by_category(self, client):
        res = client.get("/api/nasa/datasets?category=Genomics")
        assert res.status_code == 200
        data = res.json()
        assert data["total"] >= 1
        for d in data["datasets"]:
            assert "genomics" in d["category"].lower()

    def test_search_nasa_datasets(self, client):
        res = client.get("/api/nasa/datasets?search=Twins")
        assert res.status_code == 200
        data = res.json()
        assert data["total"] >= 1
        assert "twins" in data["datasets"][0]["title"].lower()

    def test_search_live_fallback(self, client):
        res = client.get("/api/nasa/search?query=Radiation")
        assert res.status_code == 200
        data = res.json()
        assert data["count"] >= 1
        assert "mode" in data
