"""
ASTRACARE – HealthRecord SQLAlchemy model.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey,
    Integer, String, Text,
)
from sqlalchemy.orm import relationship

from app.database.connection import Base

if TYPE_CHECKING:
    from app.models.astronaut import Astronaut


class HealthRecord(Base):
    __tablename__ = "health_records"

    id                 = Column(Integer, primary_key=True, index=True)
    astronaut_id       = Column(Integer, ForeignKey("astronauts.id", ondelete="CASCADE"), nullable=False, index=True)
    recorded_at        = Column(DateTime, nullable=False, default=datetime.utcnow)
    heart_rate         = Column(Float, nullable=True)          # bpm
    systolic_bp        = Column(Float, nullable=True)          # mmHg
    diastolic_bp       = Column(Float, nullable=True)          # mmHg
    blood_sugar        = Column(Float, nullable=True)          # mg/dL
    body_temperature   = Column(Float, nullable=True)          # °C
    oxygen_saturation  = Column(Float, nullable=True)          # %
    sleep_duration     = Column(Float, nullable=True)          # hours
    symptoms           = Column(Text, nullable=True)
    notes              = Column(Text, nullable=True)
    data_source        = Column(String(32), default="manual")  # "manual" | "simulated" | "nasa"
    is_simulated       = Column(Boolean, default=False, nullable=False)
    anomaly_score      = Column(Float, nullable=True)
    is_anomaly         = Column(Boolean, nullable=True)
    created_at         = Column(DateTime, default=datetime.utcnow, nullable=False)

    astronaut: "Astronaut" = relationship("Astronaut", back_populates="health_records")

    def __repr__(self) -> str:
        return f"<HealthRecord id={self.id} astronaut_id={self.astronaut_id} recorded_at={self.recorded_at}>"
