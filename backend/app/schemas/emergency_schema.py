"""
ASTRACARE – Schemas for AI Astronaut Medical Emergency Assistant.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AcknowledgeRequest(BaseModel):
    reviewer_name: str = Field(..., description="Name of acknowledging medical personnel")
    reviewer_role: str = Field("Flight Surgeon", description="Role of reviewer")


class AssignRequest(BaseModel):
    officer_name: str = Field(..., description="Name of assigned medical officer")
    officer_role: str = Field("Flight Surgeon", description="Assigned clinical role")
    assigned_by: str = Field("Mission Control", description="Assigning authority")


class ChecklistStepRequest(BaseModel):
    step_id: str = Field(..., description="Protocol step identifier")
    completed: bool = Field(True, description="Step completion status")
    user_name: str = Field("Medical Officer", description="Name of user performing step")


class ActionRequest(BaseModel):
    action_type: str = Field(..., description="Categorized clinical action (e.g. O2_ADMINISTERED, ECG_APPLIED)")
    notes: str = Field(..., description="Clinical observation and response notes")
    actor_name: str = Field(..., description="Personnel recording the action")
    actor_role: str = Field("Medical Officer", description="Role of actor")


class EscalateRequest(BaseModel):
    escalated_by: str = Field(..., description="Personnel initiating escalation")
    escalation_reason: str = Field(..., description="Clinical justification for surgeon escalation")


class ResolveRequest(BaseModel):
    resolved_by: str = Field(..., description="Flight Surgeon or Medical Officer resolving incident")
    resolution_notes: str = Field(..., description="Final clinical assessment and return-to-nominal notes")


class SimulateScenarioRequest(BaseModel):
    astronaut_id: str = Field("AST-001", description="Target astronaut identifier")
    scenario: str = Field("cardiac_tachycardia", description="Clinical scenario key")
