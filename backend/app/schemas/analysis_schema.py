"""
ASTRACARE – Pydantic schemas for AnalysisResult / Insights.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class ContributingFactor(BaseModel):
    metric:         str
    value:          float
    personal_mean:  float
    deviation_std:  float


class AnomalyAnalysis(BaseModel):
    is_anomaly:           bool
    anomaly_score:        Optional[float]
    status:               str           # "normal" | "anomaly_detected" | "insufficient_data" | "incomplete_data"
    explanation:          str
    recommendation:       str
    contributing_factors: List[ContributingFactor] = []


class BaselineMetric(BaseModel):
    mean:  float
    std:   float
    trend: str   # "increasing" | "decreasing" | "stable"
    count: int


class BaselineComparison(BaseModel):
    has_baseline:    bool
    record_count:    int
    metrics:         Dict[str, BaselineMetric] = {}
    deviation_flags: List[str] = []


class InsightResponse(BaseModel):
    astronaut_id:        str
    health_record_id:    Optional[int]
    analyzed_at:         datetime
    anomaly:             AnomalyAnalysis
    baseline_comparison: BaselineComparison
    insight_text:        str
    recommendation:      str


class SimulateReadingResponse(BaseModel):
    message:         str
    health_record:   Dict[str, Any]
    analysis:        Optional[AnomalyAnalysis]
