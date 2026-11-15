"""
ASTRACARE – EnvironmentalReading SQLAlchemy model.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text

from app.database.connection import Base


class EnvironmentalReading(Base):
    __tablename__ = "environmental_readings"

    id                       = Column(Integer, primary_key=True, index=True)
    recorded_at              = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    cabin_oxygen_pct         = Column(Float, nullable=False)        # % (normal ~20.9% - 21.5%)
    carbon_dioxide_mmhg      = Column(Float, nullable=False)        # mmHg (normal < 3.0 mmHg)
    cabin_pressure_kpa       = Column(Float, nullable=False)        # kPa (normal 101.3 kPa)
    cabin_temp_c             = Column(Float, nullable=False)        # °C (normal 21°C - 24°C)
    humidity_pct             = Column(Float, nullable=False)        # % (normal 40% - 60%)
    radiation_ambient_usv_h  = Column(Float, nullable=True)         # uSv/h ambient cabin
    air_quality_index        = Column(Float, nullable=True)         # 0-100 score
    status                   = Column(String(32), default="nominal") # "nominal" | "warning" | "hazard"
    warnings_json            = Column(Text, nullable=True)          # JSON list of active warnings
    is_simulated             = Column(Boolean, default=True, nullable=False)
    created_at               = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<EnvironmentalReading id={self.id} O2={self.cabin_oxygen_pct}% CO2={self.carbon_dioxide_mmhg}mmHg>"
