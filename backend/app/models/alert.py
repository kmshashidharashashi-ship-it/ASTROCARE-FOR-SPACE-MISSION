"""
ASTRACARE – Alert SQLAlchemy model.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.connection import Base


class Alert(Base):
    __tablename__ = "alerts"

    id                = Column(Integer, primary_key=True, index=True)
    astronaut_id      = Column(Integer, ForeignKey("astronauts.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type        = Column(String(64), nullable=False)   # "anomaly" | "threshold" | "trend" | "wellness"
    severity          = Column(String(16), nullable=False)   # "low" | "medium" | "high" | "critical"
    message           = Column(Text, nullable=False)
    details           = Column(Text, nullable=True)          # JSON string with extra context
    related_record_id = Column(Integer, nullable=True)       # FK to health_records (optional)
    is_reviewed       = Column(Boolean, default=False, nullable=False)
    reviewed_at       = Column(DateTime, nullable=True)
    reviewed_by       = Column(String(128), nullable=True)
    created_at        = Column(DateTime, default=datetime.utcnow, nullable=False)

    # ── AI Emergency Decision Support extensions ─────────────────────────────
    status            = Column(String(32), default="ACTIVE", nullable=False) # "ACTIVE" | "ACKNOWLEDGED" | "ESCALATED" | "RESOLVED"
    assigned_to       = Column(String(128), nullable=True)                  # e.g., "Dr. Sarah Lindqvist"
    assigned_role     = Column(String(64), nullable=True)                   # "Flight Surgeon" | "Medical Officer"
    checklist_state   = Column(Text, nullable=True)                         # JSON list of protocol checklist items
    action_log        = Column(Text, nullable=True)                         # JSON list of clinical actions taken
    is_escalated      = Column(Boolean, default=False, nullable=False)
    escalated_at      = Column(DateTime, nullable=True)
    escalated_by      = Column(String(128), nullable=True)
    resolution_notes  = Column(Text, nullable=True)
    resolved_at       = Column(DateTime, nullable=True)
    resolved_by       = Column(String(128), nullable=True)

    astronaut = relationship("Astronaut")

    def __repr__(self) -> str:
        return f"<Alert id={self.id} type={self.alert_type!r} severity={self.severity!r}>"
