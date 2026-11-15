"""
ASTRACARE – Insight service layer.
Orchestrates ML analysis (anomaly detection + baseline + trends) for an astronaut.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.ml.anomaly_detection import AnomalyDetector
from app.ml.baseline_analysis import compute_baseline, compare_to_baseline
from app.ml.prediction import generate_insight_text, analyze_all_trends
from app.ml.preprocessing import prepare_features_for_anomaly_detection
from app.models.astronaut import Astronaut
from app.models.health_record import HealthRecord
from app.models.analysis_result import AnalysisResult
from app.schemas.analysis_schema import (
    AnomalyAnalysis,
    BaselineComparison,
    BaselineMetric,
    ContributingFactor,
    InsightResponse,
)


def _record_to_dict(record: HealthRecord) -> dict:
    return {
        "id":                record.id,
        "recorded_at":       record.recorded_at.isoformat() if record.recorded_at else None,
        "heart_rate":        record.heart_rate,
        "systolic_bp":       record.systolic_bp,
        "diastolic_bp":      record.diastolic_bp,
        "blood_sugar":       record.blood_sugar,
        "body_temperature":  record.body_temperature,
        "oxygen_saturation": record.oxygen_saturation,
        "sleep_duration":    record.sleep_duration,
    }


def run_full_analysis(db: Session, astronaut_id: str) -> Optional[InsightResponse]:
    """
    Run the full ML pipeline for an astronaut:
      1. Fetch latest + all historical records
      2. Compute personal baseline
      3. Compare latest reading to baseline
      4. Run Isolation Forest anomaly detection
      5. Generate human-readable insight text
      6. Persist AnalysisResult
      7. Return InsightResponse
    """
    ast = db.query(Astronaut).filter(
        Astronaut.astronaut_id == astronaut_id.upper()
    ).first()
    if not ast:
        return None

    all_records = (
        db.query(HealthRecord)
        .filter(HealthRecord.astronaut_id == ast.id)
        .order_by(HealthRecord.recorded_at.asc())
        .all()
    )

    if not all_records:
        return InsightResponse(
            astronaut_id=astronaut_id,
            health_record_id=None,
            analyzed_at=datetime.utcnow(),
            anomaly=AnomalyAnalysis(
                is_anomaly=False,
                anomaly_score=None,
                status="insufficient_data",
                explanation="No health records found for this astronaut.",
                recommendation="Start by submitting health measurements.",
                contributing_factors=[],
            ),
            baseline_comparison=BaselineComparison(
                has_baseline=False,
                record_count=0,
            ),
            insight_text="No data available for analysis.",
            recommendation="Please submit health readings to begin monitoring.",
        )

    latest_record = all_records[-1]
    history_dicts = [_record_to_dict(r) for r in all_records[:-1]]  # exclude latest
    latest_dict   = _record_to_dict(latest_record)

    # ── Baseline ──
    baseline = compute_baseline(history_dicts)
    baseline_cmp = compare_to_baseline(latest_dict, baseline)

    # Build BaselineComparison schema
    metrics_schema = {}
    for metric, stats in baseline.get("metrics", {}).items():
        metrics_schema[metric] = BaselineMetric(
            mean=stats["mean"],
            std=stats["std"],
            trend=stats["trend"],
            count=stats["count"],
        )
    baseline_response = BaselineComparison(
        has_baseline=baseline.get("has_baseline", False),
        record_count=baseline.get("record_count", 0),
        metrics=metrics_schema,
        deviation_flags=baseline_cmp.get("deviation_flags", []),
    )

    # ── Anomaly detection ──
    features = prepare_features_for_anomaly_detection(history_dicts)
    detector = AnomalyDetector()
    anomaly_raw = detector.analyze_single_reading(latest_dict, features if features is not None else __import__("pandas").DataFrame())

    factors_schema = [
        ContributingFactor(
            metric=f["metric"],
            value=f["value"],
            personal_mean=f["personal_mean"],
            deviation_std=f["deviation_std"],
        )
        for f in anomaly_raw.get("contributing_factors", [])
    ]

    anomaly_response = AnomalyAnalysis(
        is_anomaly=anomaly_raw.get("is_anomaly", False),
        anomaly_score=anomaly_raw.get("anomaly_score"),
        status=anomaly_raw.get("status", "insufficient_data"),
        explanation=anomaly_raw.get("explanation", ""),
        recommendation=anomaly_raw.get("recommendation", ""),
        contributing_factors=factors_schema,
    )

    # ── Insight text ──
    insight_text   = generate_insight_text(anomaly_raw, baseline_cmp)
    recommendation = anomaly_raw.get("recommendation", "Continue regular monitoring.")

    # ── Persist ──
    import json
    ar = AnalysisResult(
        astronaut_id         = ast.id,
        health_record_id     = latest_record.id,
        is_anomaly           = anomaly_raw.get("is_anomaly"),
        anomaly_score        = anomaly_raw.get("anomaly_score"),
        anomaly_status       = anomaly_raw.get("status"),
        anomaly_explanation  = anomaly_raw.get("explanation"),
        contributing_factors = json.dumps(anomaly_raw.get("contributing_factors", [])),
        baseline_comparison  = json.dumps(baseline_cmp),
        trend_summary        = json.dumps(analyze_all_trends([_record_to_dict(r) for r in all_records])),
        insight_text         = insight_text,
        recommendation       = recommendation,
    )
    db.add(ar)
    db.commit()

    return InsightResponse(
        astronaut_id=astronaut_id,
        health_record_id=latest_record.id,
        analyzed_at=datetime.utcnow(),
        anomaly=anomaly_response,
        baseline_comparison=baseline_response,
        insight_text=insight_text,
        recommendation=recommendation,
    )
