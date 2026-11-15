"""
ASTRACARE – Authentication Service Layer.
Handles password hashing with bcrypt, JWT token generation & verification,
role-based authorization, and user registration.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database.connection import get_db
from app.models.user import AuditLog, User
from app.schemas.auth_schema import UserRegisterRequest, VALID_ROLES

logger = logging.getLogger("astracare.auth")

security_scheme = HTTPBearer(auto_error=False)

JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_MINUTES = 60 * 24  # 24 hours for aerospace telemetry missions


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception as e:
        logger.warning(f"Password verification error: {e}")
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=JWT_EXPIRATION_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def log_audit_event(
    db: Session,
    action: str,
    user_id: Optional[int] = None,
    user_email: Optional[str] = None,
    resource: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> None:
    try:
        audit = AuditLog(
            user_id=user_id,
            user_email=user_email,
            action=action,
            resource=resource,
            details=details,
            ip_address=ip_address,
            timestamp=datetime.utcnow(),
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to record audit log: {e}")
        db.rollback()


def register_user(db: Session, payload: UserRegisterRequest, ip_address: Optional[str] = None) -> User:
    email_clean = payload.email.strip().lower()
    if not email_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mission email address is required.",
        )

    # Check for existing user
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An account with email '{email_clean}' is already registered.",
        )

    role = payload.role.strip()
    if role not in VALID_ROLES:
        role = "Medical Officer"

    hashed_pwd = hash_password(payload.password)
    new_user = User(
        email=email_clean,
        hashed_password=hashed_pwd,
        full_name=payload.full_name.strip(),
        role=role,
        callsign=payload.callsign.strip() if payload.callsign else None,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit_event(
        db=db,
        action="USER_REGISTERED",
        user_id=new_user.id,
        user_email=new_user.email,
        resource="auth",
        details=f"Registered with role {new_user.role}",
        ip_address=ip_address,
    )
    logger.info(f"Registered user: {new_user.email} (Role: {new_user.role})")
    return new_user


def authenticate_user(db: Session, email: str, password: str, ip_address: Optional[str] = None) -> User:
    email_clean = email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(password, user.hashed_password):
        log_audit_event(
            db=db,
            action="LOGIN_FAILED",
            user_email=email_clean,
            resource="auth",
            details="Invalid email or password",
            ip_address=ip_address,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect mission email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account has been deactivated. Contact Mission Control.",
        )

    log_audit_event(
        db=db,
        action="LOGIN_SUCCESS",
        user_id=user.id,
        user_email=user.email,
        resource="auth",
        details=f"Login successful. Role: {user.role}",
        ip_address=ip_address,
    )
    return user


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
        )
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or account deactivated.",
        )
    return user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not credentials or not credentials.credentials:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = payload.get("sub")
        if user_id:
            return db.query(User).filter(User.id == int(user_id)).first()
    except Exception:
        pass
    return None


def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles and current_user.role != "Administrator":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {', '.join(allowed_roles)}",
            )
        return current_user
    return role_checker
