"""
ASTRACARE – Alert service layer.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.alert import Alert


def create_alert(
    db: Session,
    astronaut_id: int,
    alert_type: str,
    message: str,
    severity: str = "medium",
    related_record_id: Optional[int] = None,
    details: Optional[str] = None,
) -> Alert:
    """Create and persist a new alert."""
    alert = Alert(
        astronaut_id      = astronaut_id,
        alert_type        = alert_type,
        severity          = severity,
        message           = message,
        details           = details,
        related_record_id = related_record_id,
        is_reviewed       = False,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def get_alerts(
    db: Session, astronaut_id: int, include_reviewed: bool = False
) -> List[Alert]:
    """Return alerts for an astronaut, ordered by creation time descending."""
    query = db.query(Alert).filter(Alert.astronaut_id == astronaut_id)
    if not include_reviewed:
        query = query.filter(Alert.is_reviewed == False)  # noqa: E712
    return query.order_by(Alert.created_at.desc()).all()


def mark_alert_reviewed(
    db: Session, alert_id: int, reviewed_by: Optional[str] = None
) -> Optional[Alert]:
    """Mark an alert as reviewed. Returns None if not found."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return None
    alert.is_reviewed = True
    alert.reviewed_at = datetime.utcnow()
    alert.reviewed_by = reviewed_by
    db.commit()
    db.refresh(alert)
    return alert
