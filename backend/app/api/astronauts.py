"""
ASTRACARE – Astronauts API router.
"""

from __future__ import annotations

from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.astronaut import Astronaut
from app.schemas.astronaut_schema import (
    AstronautCreate,
    AstronautResponse,
    AstronautUpdate,
    MissionDayResponse,
)

router = APIRouter()


def _get_astronaut_or_404(astronaut_id: str, db: Session) -> Astronaut:
    ast = db.query(Astronaut).filter(Astronaut.astronaut_id == astronaut_id.upper()).first()
    if not ast:
        raise HTTPException(status_code=404, detail=f"Astronaut '{astronaut_id}' not found.")
    return ast


# ── List all ──────────────────────────────────────────────────────────────────

@router.get("", response_model=List[AstronautResponse])
def list_astronauts(db: Session = Depends(get_db)):
    """Return all astronauts."""
    return db.query(Astronaut).order_by(Astronaut.astronaut_id).all()


# ── Get one ───────────────────────────────────────────────────────────────────

@router.get("/{astronaut_id}", response_model=AstronautResponse)
def get_astronaut(astronaut_id: str, db: Session = Depends(get_db)):
    """Return a single astronaut by their public ID (e.g. AST-001)."""
    return _get_astronaut_or_404(astronaut_id, db)


# ── Create ────────────────────────────────────────────────────────────────────

@router.post("", response_model=AstronautResponse, status_code=status.HTTP_201_CREATED)
def create_astronaut(payload: AstronautCreate, db: Session = Depends(get_db)):
    """Create a new astronaut profile."""
    existing = db.query(Astronaut).filter(Astronaut.astronaut_id == payload.astronaut_id).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Astronaut ID '{payload.astronaut_id}' already exists.")

    ast = Astronaut(**payload.model_dump())
    db.add(ast)
    db.commit()
    db.refresh(ast)
    return ast


# ── Update ────────────────────────────────────────────────────────────────────

@router.put("/{astronaut_id}", response_model=AstronautResponse)
def update_astronaut(astronaut_id: str, payload: AstronautUpdate, db: Session = Depends(get_db)):
    """Update mutable fields of an astronaut profile."""
    ast = _get_astronaut_or_404(astronaut_id, db)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ast, field, value)
    db.commit()
    db.refresh(ast)
    return ast


# ── Mission day ───────────────────────────────────────────────────────────────

@router.get("/{astronaut_id}/mission-day", response_model=MissionDayResponse)
def get_mission_day(astronaut_id: str, db: Session = Depends(get_db)):
    """Calculate the current mission day from the mission start date."""
    ast = _get_astronaut_or_404(astronaut_id, db)

    if not ast.mission_start_date:
        return MissionDayResponse(
            astronaut_id=ast.astronaut_id,
            mission_name=ast.mission_name,
            mission_start_date=None,
            mission_day=None,
            message="Mission start date not set.",
        )

    today = date.today()
    mission_day = (today - ast.mission_start_date).days + 1  # Day 1 = start date
    return MissionDayResponse(
        astronaut_id=ast.astronaut_id,
        mission_name=ast.mission_name,
        mission_start_date=ast.mission_start_date,
        mission_day=max(1, mission_day),
        message=f"Mission day {max(1, mission_day)} of {ast.mission_name or 'current mission'}.",
    )
