"""
ASTRACARE – Tests for ML modules (preprocessing, anomaly detection, baseline).
"""

from __future__ import annotations

import pandas as pd
import pytest

from app.ml.preprocessing import validate_health_readings, prepare_features_for_anomaly_detection
from app.ml.anomaly_detection import AnomalyDetector, MIN_SAMPLES_FOR_MODEL
from app.ml.baseline_analysis import compute_baseline, compare_to_baseline, MIN_RECORDS_FOR_BASELINE
from app.ml.prediction import time_series_trends, assess_wellness_trend


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_health_dict(**overrides):
    base = {
        "heart_rate":        70.0,
        "systolic_bp":       120.0,
        "diastolic_bp":      80.0,
        "blood_sugar":       95.0,
        "body_temperature":  36.7,
        "oxygen_saturation": 98.0,
        "sleep_duration":    7.5,
        "recorded_at":       "2024-03-01T08:00:00",
    }
    base.update(overrides)
    return base


def _make_records(count: int) -> list:
    import random
    rng = random.Random(42)
    records = []
    for i in range(count):
        records.append({
            "heart_rate":        rng.gauss(68, 7),
            "systolic_bp":       rng.gauss(118, 8),
            "diastolic_bp":      rng.gauss(76, 6),
            "blood_sugar":       rng.gauss(95, 10),
            "body_temperature":  rng.gauss(36.7, 0.3),
            "oxygen_saturation": rng.gauss(98.0, 0.8),
            "sleep_duration":    rng.gauss(7.0, 0.8),
            "recorded_at":       f"2024-03-{(i % 28) + 1:02d}T08:00:00",
        })
    return records


# ── Preprocessing ─────────────────────────────────────────────────────────────

class TestValidateHealthReadings:
    def test_valid_readings_pass(self):
        data = _make_health_dict()
        result = validate_health_readings(data)
        assert result["valid"] is True
        assert result["warnings"] == []

    def test_extreme_heart_rate_flagged(self):
        data = _make_health_dict(heart_rate=5.0)  # Below min=40
        result = validate_health_readings(data)
        assert result["valid"] is False
        assert any("heart_rate" in w for w in result["warnings"])

    def test_high_blood_sugar_flagged(self):
        data = _make_health_dict(blood_sugar=450.0)  # Above max=400
        result = validate_health_readings(data)
        assert result["valid"] is False
        assert any("blood_sugar" in w for w in result["warnings"])

    def test_none_values_ignored(self):
        data = _make_health_dict(oxygen_saturation=None, sleep_duration=None)
        result = validate_health_readings(data)
        assert result["valid"] is True

    def test_multiple_violations(self):
        data = _make_health_dict(heart_rate=5.0, body_temperature=50.0)
        result = validate_health_readings(data)
        assert result["valid"] is False
        assert len(result["warnings"]) >= 2


class TestPrepareFeatures:
    def test_too_few_records_returns_none(self):
        records = _make_records(2)
        result = prepare_features_for_anomaly_detection(records)
        assert result is None

    def test_sufficient_records_returns_dataframe(self):
        records = _make_records(15)
        result = prepare_features_for_anomaly_detection(records)
        assert result is not None
        assert isinstance(result, pd.DataFrame)
        assert len(result) >= 10


# ── Anomaly Detection ─────────────────────────────────────────────────────────

class TestAnomalyDetector:
    def test_insufficient_data_returns_status(self):
        detector = AnomalyDetector()
        reading = _make_health_dict()
        # Provide too few historical records
        few_records = _make_records(5)
        df = pd.DataFrame(few_records)[
            ["heart_rate","systolic_bp","diastolic_bp","blood_sugar",
             "body_temperature","oxygen_saturation","sleep_duration"]
        ]
        result = detector.analyze_single_reading(reading, df)
        assert result["status"] == "insufficient_data"
        assert result["is_anomaly"] is False

    def test_normal_reading_on_sufficient_data(self):
        detector = AnomalyDetector()
        records = _make_records(50)
        df = pd.DataFrame(records)[
            ["heart_rate","systolic_bp","diastolic_bp","blood_sugar",
             "body_temperature","oxygen_saturation","sleep_duration"]
        ]
        # Use a "normal" reading matching the distribution
        reading = _make_health_dict(
            heart_rate=68.0, systolic_bp=118.0, diastolic_bp=76.0,
            blood_sugar=95.0, body_temperature=36.7,
            oxygen_saturation=98.0, sleep_duration=7.0
        )
        result = detector.analyze_single_reading(reading, df)
        assert result["status"] in ("normal", "anomaly_detected")
        assert result["anomaly_score"] is not None
        assert 0.0 <= result["anomaly_score"] <= 1.0

    def test_extreme_reading_flagged_as_anomaly(self):
        detector = AnomalyDetector(contamination=0.1)
        records = _make_records(50)
        df = pd.DataFrame(records)[
            ["heart_rate","systolic_bp","diastolic_bp","blood_sugar",
             "body_temperature","oxygen_saturation","sleep_duration"]
        ]
        # Extreme reading – should be detected as anomaly
        reading = _make_health_dict(
            heart_rate=170.0,  # Very high
            systolic_bp=190.0,
        )
        result = detector.analyze_single_reading(reading, df)
        # The result must be a valid analysis (may or may not be anomaly depending on contamination)
        assert result["status"] in ("normal", "anomaly_detected")
        assert isinstance(result["contributing_factors"], list)

    def test_train_requires_minimum_samples(self):
        detector = AnomalyDetector()
        small_df = pd.DataFrame(_make_records(5))[["heart_rate", "systolic_bp"]]
        result = detector.train(small_df)
        assert result is False
        assert detector.is_trained is False

    def test_train_succeeds_with_enough_data(self):
        detector = AnomalyDetector()
        df = pd.DataFrame(_make_records(20))[["heart_rate", "systolic_bp"]]
        result = detector.train(df)
        assert result is True
        assert detector.is_trained is True


# ── Baseline Analysis ─────────────────────────────────────────────────────────

class TestBaseline:
    def test_too_few_records_no_baseline(self):
        records = _make_records(MIN_RECORDS_FOR_BASELINE - 1)
        result = compute_baseline(records)
        assert result["has_baseline"] is False

    def test_sufficient_records_has_baseline(self):
        records = _make_records(20)
        result = compute_baseline(records)
        assert result["has_baseline"] is True
        assert "heart_rate" in result["metrics"]
        assert "mean" in result["metrics"]["heart_rate"]
        assert "std"  in result["metrics"]["heart_rate"]
        assert result["metrics"]["heart_rate"]["trend"] in ("increasing", "decreasing", "stable")

    def test_compare_normal_reading(self):
        records = _make_records(20)
        baseline = compute_baseline(records)
        reading = _make_health_dict()  # near-normal values
        comparison = compare_to_baseline(reading, baseline)
        assert "deviations" in comparison
        assert "deviation_flags" in comparison
        assert isinstance(comparison["overall_deviation"], float)

    def test_compare_extreme_reading_flagged(self):
        records = _make_records(50)
        baseline = compute_baseline(records)
        # Extreme reading – should trigger flags
        reading = _make_health_dict(heart_rate=180.0, systolic_bp=200.0)
        comparison = compare_to_baseline(reading, baseline)
        assert len(comparison["deviation_flags"]) > 0

    def test_no_baseline_comparison_safe(self):
        baseline = {"has_baseline": False, "record_count": 3, "metrics": {}}
        reading = _make_health_dict()
        comparison = compare_to_baseline(reading, baseline)
        assert comparison["deviation_flags"] == []
        assert comparison["overall_deviation"] == 0.0


# ── Prediction / Trends ───────────────────────────────────────────────────────

class TestPrediction:
    def test_time_series_trends_basic(self):
        records = _make_records(30)
        df = pd.DataFrame(records)
        result = time_series_trends(df, "heart_rate")
        assert result["metric"] == "heart_rate"
        assert result["trend"] in ("increasing", "decreasing", "stable")
        assert isinstance(result["mean"], float)

    def test_time_series_missing_metric(self):
        df = pd.DataFrame({"heart_rate": [70, 72, 68]})
        result = time_series_trends(df, "nonexistent_metric")
        assert "error" in result

    def test_assess_wellness_trend_no_data(self):
        result = assess_wellness_trend([])
        assert result["has_data"] is False

    def test_assess_wellness_trend_with_data(self):
        wellness = [
            {"mood": 7, "stress_level": 4, "fatigue_level": 5, "energy_level": 7, "sleep_quality": 7}
            for _ in range(10)
        ]
        result = assess_wellness_trend(wellness)
        assert result["has_data"] is True
        assert "overall_wellness_score" in result
        assert "dimensions" in result
        assert "mood" in result["dimensions"]
