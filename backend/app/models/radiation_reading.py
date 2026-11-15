"""
ASTRACARE – RadiationReading SQLAlchemy model.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.connection import Base


class RadiationReading(Base):
    __tablename__ = "radiation_readings"

    id                    = Column(Integer, primary_key=True, index=True)
    astronaut_id          = Column(Integer, ForeignKey("astronauts.id", ondelete="CASCADE"), nullable=False, index=True)
    recorded_at           = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    current_rate_usv_h    = Column(Float, nullable=False)        # microSieverts per hour (uSv/h)
    cumulative_dose_msv   = Column(Float, nullable=False)        # milliSieverts total (mSv)
    ionizing_index        = Column(Float, nullable=True)         # composite index 1.0 - 10.0
    radiation_status      = Column(String(32), default="normal") # "normal" | "elevated" | "warning" | "critical"
    solar_particle_event  = Column(Boolean, default=False)       # SPE active flag
    data_source           = Column(String(64), default="simulated_dosimeter")
    is_simulated          = Column(Boolean, default=True, nullable=False)
    notes                 = Column(Text, nullable=True)
    created_at            = Column(DateTime, default=datetime.utcnow, nullable=False)

    astronaut = relationship("Astronaut")

    def __repr__(self) -> str:
        return f"<RadiationReading id={self.id} rate={self.current_rate_usv_h} cumulative={self.cumulative_dose_msv}>"
