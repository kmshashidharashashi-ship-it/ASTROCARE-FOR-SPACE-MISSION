"""
ASTRACARE – Astronaut SQLAlchemy model.
"""

from __future__ import annotations

from datetime import datetime, date
from typing import List, TYPE_CHECKING

from sqlalchemy import Column, DateTime, Date, Integer, String
from sqlalchemy.orm import relationship

from app.database.connection import Base

if TYPE_CHECKING:
    from app.models.health_record import HealthRecord
    from app.models.wellness_record import WellnessRecord


class Astronaut(Base):
    __tablename__ = "astronauts"

    id                = Column(Integer, primary_key=True, index=True)
    astronaut_id      = Column(String(32), unique=True, index=True, nullable=False)  # e.g. "AST-001"
    name              = Column(String(128), nullable=False)
    age               = Column(Integer, nullable=True)
    gender            = Column(String(32), nullable=True)
    blood_type        = Column(String(8), nullable=True)
    mission_name      = Column(String(256), nullable=True)
    mission_start_date= Column(Date, nullable=True)
    role              = Column(String(128), nullable=True)
    avatar_initials   = Column(String(4), nullable=True)
    created_at        = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at        = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    health_records:   List["HealthRecord"]   = relationship("HealthRecord",   back_populates="astronaut", cascade="all, delete-orphan")
    wellness_records: List["WellnessRecord"] = relationship("WellnessRecord", back_populates="astronaut", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Astronaut id={self.id} astronaut_id={self.astronaut_id!r} name={self.name!r}>"
