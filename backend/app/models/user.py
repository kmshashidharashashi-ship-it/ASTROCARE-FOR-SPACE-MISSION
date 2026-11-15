"""
ASTRACARE – User and AuditLog SQLAlchemy models.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.connection import Base


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name       = Column(String(128), nullable=False)
    role            = Column(String(64), nullable=False, default="Medical Officer")
    callsign        = Column(String(64), nullable=True)
    is_active       = Column(Boolean, default=True, nullable=False)
    created_at      = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r} role={self.role!r}>"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_email = Column(String(255), nullable=True)
    action     = Column(String(128), nullable=False)
    resource   = Column(String(128), nullable=True)
    details    = Column(Text, nullable=True)
    ip_address = Column(String(64), nullable=True)
    timestamp  = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User")

    def __repr__(self) -> str:
        return f"<AuditLog id={self.id} action={self.action!r} at={self.timestamp}>"
