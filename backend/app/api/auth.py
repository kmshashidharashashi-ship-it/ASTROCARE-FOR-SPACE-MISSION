"""
ASTRACARE – Authentication API Router.
Endpoints for user registration, login, profile inspection, and audit trail.
"""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import AuditLog, User
from app.schemas.auth_schema import (
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    get_current_user,
    register_user,
    require_role,
)

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegisterRequest, request: Request, db: Session = Depends(get_db)):
    """Register a new space medicine / mission control user."""
    client_ip = request.client.host if request.client else None
    user = register_user(db, payload, ip_address=client_ip)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLoginRequest, request: Request, db: Session = Depends(get_db)):
    """Authenticate mission control personnel and issue JWT access token."""
    client_ip = request.client.host if request.client else None
    user = authenticate_user(db, payload.email, payload.password, ip_address=client_ip)
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve profile of currently authenticated user."""
    return current_user


@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 50,
    current_user: User = Depends(require_role(["Mission Commander", "Flight Surgeon", "Administrator"])),
    db: Session = Depends(get_db),
):
    """Retrieve system security and medical action audit logs."""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "user_email": l.user_email,
            "action": l.action,
            "resource": l.resource,
            "details": l.details,
            "ip_address": l.ip_address,
            "timestamp": l.timestamp.isoformat(),
        }
        for l in logs
    ]
