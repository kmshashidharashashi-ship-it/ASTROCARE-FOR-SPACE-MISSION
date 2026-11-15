"""
ASTRACARE – Tests for Astro Medical Intelligence API (/api/astro-ai).
Verifies:
1. Retrieval of preconfigured aerospace questions.
2. 10-point AI medical assessment for organ targets (Heart, Lungs, Brain, Skeleton).
3. 10-point response for free-text questions (Tachycardia, Hypoxia, Fatigue, Radiation).
4. Evidence-based structure, baseline comparison, and disclaimer compliance.
"""

import pytest


def test_get_sample_questions(client):
    res = client.get("/api/astro-ai/questions")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["total"] >= 5
    assert any("heart" in q["question"].lower() for q in data["questions"])


def test_analyze_heart_organ(client):
    res = client.post("/api/astro-ai/analyze-organ/AST-001/heart")
    assert res.status_code == 200
    data = res.json()
    assert data["astronaut_id"] == "AST-001"
    assert data["organ_target"] == "heart"
    assert "problem_identified" in data
    assert len(data["supporting_measurements"]) >= 2
    assert "immediate_safety_actions" in data
    assert "recommended_medical_review" in data
    assert "confidence_and_uncertainty" in data
    assert "data_source_and_timestamp" in data
    assert "NASA Space Medicine Research" in data["disclaimer"]


def test_analyze_lungs_organ(client):
    res = client.post("/api/astro-ai/analyze-organ/AST-001/lungs")
    assert res.status_code == 200
    data = res.json()
    assert data["organ_target"] == "lungs"
    assert any("Oxygen" in m["metric"] for m in data["supporting_measurements"])


def test_analyze_brain_organ(client):
    res = client.post("/api/astro-ai/analyze-organ/AST-001/brain")
    assert res.status_code == 200
    data = res.json()
    assert data["organ_target"] == "brain"
    assert any("Sleep" in m["metric"] for m in data["supporting_measurements"])


def test_analyze_skeleton_organ(client):
    res = client.post("/api/astro-ai/analyze-organ/AST-001/skeleton")
    assert res.status_code == 200
    data = res.json()
    assert data["organ_target"] == "skeleton"


def test_ask_conversational_query_tachycardia(client):
    res = client.post("/api/astro-ai/query", json={
        "astronaut_id": "AST-001",
        "question": "Why is my heart rate increasing?",
        "role": "Mission Commander",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["organ_target"] == "heart"
    assert "problem_identified" in data
    assert len(data["immediate_safety_actions"]) > 0


def test_ask_conversational_query_hypoxia(client):
    res = client.post("/api/astro-ai/query", json={
        "astronaut_id": "AST-001",
        "question": "Why is my oxygen level decreasing?",
        "role": "Flight Surgeon",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["organ_target"] == "lungs"


def test_ask_conversational_query_radiation(client):
    res = client.post("/api/astro-ai/query", json={
        "astronaut_id": "AST-001",
        "question": "What happens if radiation exposure increases?",
        "role": "Mission Analyst",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["organ_target"] == "radiation"
    assert any("Radiation" in m["metric"] for m in data["supporting_measurements"])


def test_invalid_organ_target(client):
    res = client.post("/api/astro-ai/analyze-organ/AST-001/invalid_organ")
    assert res.status_code == 400
