"""
ASTRACARE – Astro Medical Intelligence API Router.
Endpoints for interactive AI clinical questions and organ-specific health assessments.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.astro_ai_schema import AstroAiQueryRequest, AstroAiResponse
from app.services.astro_ai_service import evaluate_astro_ai

router = APIRouter()

PRECONFIGURED_QUESTIONS = [
    {
        "id": "q-hr",
        "question": "Why is my heart rate increasing?",
        "category": "Cardiovascular",
        "organ": "heart",
    },
    {
        "id": "q-o2",
        "question": "Why is my oxygen level decreasing?",
        "category": "Respiratory",
        "organ": "lungs",
    },
    {
        "id": "q-breath",
        "question": "What should I do if I experience breathing difficulty?",
        "category": "Emergency Response",
        "organ": "lungs",
    },
    {
        "id": "q-fatigue",
        "question": "Why am I feeling fatigued?",
        "category": "Neuro-Cognitive",
        "organ": "brain",
    },
    {
        "id": "q-sleep",
        "question": "What can I do to improve my sleep in microgravity?",
        "category": "Wellness",
        "organ": "brain",
    },
    {
        "id": "q-rad",
        "question": "What happens if radiation exposure increases?",
        "category": "Space Environment",
        "organ": "radiation",
    },
    {
        "id": "q-bone",
        "question": "Why am I experiencing reduced physical activity or spinal decompression?",
        "category": "Musculoskeletal",
        "organ": "skeleton",
    },
    {
        "id": "q-triage",
        "question": "Which health measurements require immediate attention right now?",
        "category": "Clinical Triage",
        "organ": None,
    },
]


@router.get("/questions")
def get_sample_questions():
    """Retrieve preconfigured high-yield space medicine questions."""
    return {
        "status": "success",
        "total": len(PRECONFIGURED_QUESTIONS),
        "questions": PRECONFIGURED_QUESTIONS,
    }


@router.post("/query", response_model=AstroAiResponse)
def query_astro_ai(req: AstroAiQueryRequest, db: Session = Depends(get_db)):
    """
    Generate an explainable 10-point AI medical assessment for an astronaut
    based on actual telemetry, baselines, and clinical mission rules.
    """
    return evaluate_astro_ai(db, req)


@router.post("/analyze-organ/{astronaut_id}/{organ}", response_model=AstroAiResponse)
def analyze_organ_health(astronaut_id: str, organ: str, db: Session = Depends(get_db)):
    """
    Perform a targeted deep AI health evaluation for a specific anatomical system
    ('heart' | 'lungs' | 'brain' | 'skeleton').
    """
    if organ.lower() not in ["heart", "lungs", "brain", "skeleton", "radiation"]:
        raise HTTPException(status_code=400, detail=f"Invalid organ '{organ}'.")
    req = AstroAiQueryRequest(
        astronaut_id=astronaut_id,
        organ_target=organ.lower(),
        question=f"ANALYZE {organ.upper()} HEALTH",
    )
    return evaluate_astro_ai(db, req)
