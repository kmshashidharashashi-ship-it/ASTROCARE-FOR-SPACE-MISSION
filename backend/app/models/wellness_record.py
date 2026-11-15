"""
ASTRACARE – WellnessRecord SQLAlchemy model.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey,
    Integer, String, Text,
)
from sqlalchemy.orm import relationship

from app.database.connection import Base

if TYPE_CHECKING:
    from app.models.astronaut import Astronaut


class WellnessRecord(Base):
    __tablename__ = "wellness_records"

    id             = Column(Integer, primary_key=True, index=True)
    astronaut_id   = Column(Integer, ForeignKey("astronauts.id", ondelete="CASCADE"), nullable=False, index=True)
    recorded_at    = Column(DateTime, nullable=False, default=datetime.utcnow)
    mood           = Column(Integer, nullable=True)         # 1-10
    stress_level   = Column(Integer, nullable=True)         # 1-10
    fatigue_level  = Column(Integer, nullable=True)         # 1-10
    energy_level   = Column(Integer, nullable=True)         # 1-10
    sleep_quality  = Column(Integer, nullable=True)         # 1-10
    journal_entry  = Column(Text, nullable=True)
    data_source    = Column(String(32), default="manual")
    is_simulated   = Column(Boolean, default=False, nullable=False)
    created_at     = Column(DateTime, default=datetime.utcnow, nullable=False)

    astronaut: "Astronaut" = relationship("Astronaut", back_populates="wellness_records")

    def __repr__(self) -> str:
        return f"<WellnessRecord id={self.id} astronaut_id={self.astronaut_id} recorded_at={self.recorded_at}>"
