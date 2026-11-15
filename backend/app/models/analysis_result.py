"""
ASTRACARE – AnalysisResult SQLAlchemy model.
Stores ML analysis outputs for a given health record or astronaut session.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.connection import Base


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id                   = Column(Integer, primary_key=True, index=True)
    astronaut_id         = Column(Integer, ForeignKey("astronauts.id", ondelete="CASCADE"), nullable=False, index=True)
    health_record_id     = Column(Integer, ForeignKey("health_records.id", ondelete="SET NULL"), nullable=True)
    analyzed_at          = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Anomaly detection output
    is_anomaly           = Column(Boolean, nullable=True)
    anomaly_score        = Column(Float, nullable=True)      # 0.0 – 1.0 (higher = more anomalous)
    anomaly_status       = Column(String(32), nullable=True) # "normal" | "anomaly_detected" | "insufficient_data"
    anomaly_explanation  = Column(Text, nullable=True)
    contributing_factors = Column(Text, nullable=True)       # JSON list

    # Baseline comparison
    baseline_comparison  = Column(Text, nullable=True)       # JSON dict

    # Trend analysis
    trend_summary        = Column(Text, nullable=True)       # JSON dict

    # Human-readable insight
    insight_text         = Column(Text, nullable=True)
    recommendation       = Column(Text, nullable=True)

    created_at           = Column(DateTime, default=datetime.utcnow, nullable=False)

    astronaut    = relationship("Astronaut")
    health_record = relationship("HealthRecord")

    def __repr__(self) -> str:
        return f"<AnalysisResult id={self.id} astronaut_id={self.astronaut_id} anomaly={self.is_anomaly}>"
