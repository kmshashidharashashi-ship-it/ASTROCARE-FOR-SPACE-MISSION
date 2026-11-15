"""
ASTRACARE – Astro Medical Intelligence Schemas.
Standardized 10-point clinical decision support payload for astronauts & flight surgeons.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SupportingMeasurement(BaseModel):
    metric: str
    current_value: str
    baseline_value: str
    normal_range: str
    deviation: str
    status: str  # NORMAL, ELEVATED, DEPRESSED, CRITICAL


class AstroAiQueryRequest(BaseModel):
    astronaut_id: str = Field(default="AST-001", description="Astronaut identifier")
    question: Optional[str] = Field(None, description="Free-text clinical question or query")
    organ_target: Optional[str] = Field(None, description="'heart' | 'lungs' | 'brain' | 'skeleton'")
    role: str = Field(default="Mission Commander", description="User role (Flight Surgeon, Commander, etc.)")
    context_notes: Optional[str] = Field(None, description="Optional extra clinical observations")


class AstroAiResponse(BaseModel):
    query: str
    astronaut_id: str
    astronaut_name: str
    organ_target: Optional[str] = None
    
    # ── Standard 10-Point Medical Response Format ──
    problem_identified: str
    supporting_measurements: List[SupportingMeasurement]
    possible_explanations: str
    severity: str  # NORMAL | MONITOR | WARNING | CRITICAL
    immediate_safety_actions: List[str]
    recommended_medical_review: str
    follow_up_monitoring: str
    missing_information: str
    confidence_and_uncertainty: str
    data_source_and_timestamp: str
    
    formatted_markdown: str
    disclaimer: str
