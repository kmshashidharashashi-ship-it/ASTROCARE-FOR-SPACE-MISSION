"""
ASTRACARE – Report SQLAlchemy model.
Stores generated PDF/JSON health reports.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.connection import Base


class Report(Base):
    __tablename__ = "reports"

    id            = Column(Integer, primary_key=True, index=True)
    astronaut_id  = Column(Integer, ForeignKey("astronauts.id", ondelete="CASCADE"), nullable=False, index=True)
    report_type   = Column(String(32), nullable=False, default="health_summary")  # "health_summary" | "wellness" | "full"
    period_start  = Column(DateTime, nullable=True)
    period_end    = Column(DateTime, nullable=True)
    generated_at  = Column(DateTime, default=datetime.utcnow, nullable=False)
    file_path     = Column(String(512), nullable=True)   # server-side path to PDF file
    file_size     = Column(Integer, nullable=True)        # bytes
    summary_json  = Column(Text, nullable=True)           # JSON snapshot of key stats
    notes         = Column(Text, nullable=True)
    created_at    = Column(DateTime, default=datetime.utcnow, nullable=False)

    astronaut = relationship("Astronaut")

    def __repr__(self) -> str:
        return f"<Report id={self.id} type={self.report_type!r} astronaut_id={self.astronaut_id}>"
