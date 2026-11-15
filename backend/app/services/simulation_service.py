"""
ASTRACARE – Simulation service.

Generates realistic, clearly-labelled SIMULATED health readings.
All generated records are marked is_simulated=True and data_source="simulated".
"""

from __future__ import annotations

import math
import random
from datetime import date, datetime
from typing import Dict, Optional, Tuple

import numpy as np
from sqlalchemy.orm import Session

from app.models.astronaut import Astronaut
from app.models.health_record import HealthRecord

# ── Baseline simulation parameters ───────────────────────────────────────────
# Scientifically-plausible ranges; not actual medical records.

_BASELINES: Dict[str, Dict] = {
    "heart_rate":        {"mean": 68.0,  "std": 7.0,  "min": 45,   "max": 180},
    "systolic_bp":       {"mean": 118.0, "std": 8.0,  "min": 85,   "max": 170},
    "diastolic_bp":      {"mean": 76.0,  "std": 6.0,  "min": 55,   "max": 110},
    "blood_sugar":       {"mean": 95.0,  "std": 10.0, "min": 60,   "max": 180},
    "body_temperature":  {"mean": 36.7,  "std": 0.3,  "min": 35.5, "max": 39.5},
    "oxygen_saturation": {"mean": 98.0,  "std": 0.8,  "min": 92,   "max": 100},
    "sleep_duration":    {"mean": 7.0,   "std": 0.8,  "min": 3.0,  "max": 11.0},
}

_ANOMALY_RATE = 0.08  # ~8% of generated readings are injected anomalies


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def _mission_day(astronaut: Astronaut) -> int:
    """Calculate the current mission day."""
    if not astronaut.mission_start_date:
        return 1
    delta = date.today() - astronaut.mission_start_date
    return max(1, delta.days + 1)


def _apply_microgravity_drift(value: float, metric: str, mission_day: int, rng: random.Random) -> float:
    """
    Apply scientifically-plausible microgravity-induced drift.
    Based on known cardiovascular deconditioning and fluid-shift research.
    """
    drift = mission_day / 365.0
    if metric == "heart_rate":
        value += drift * rng.gauss(2.5, 0.5)
    elif metric == "systolic_bp":
        value += drift * rng.gauss(2.0, 1.0) if mission_day < 30 else -drift * rng.gauss(1.0, 0.5)
    elif metric == "sleep_duration":
        value -= drift * rng.gauss(0.4, 0.2)
    elif metric == "oxygen_saturation":
        value -= drift * rng.gauss(0.2, 0.1)
    return value


def _sample_metric(metric: str, mission_day: int, rng: random.Random) -> float:
    cfg = _BASELINES[metric]
    value = rng.gauss(cfg["mean"], cfg["std"])
    value = _apply_microgravity_drift(value, metric, mission_day, rng)
    value = _clamp(value, cfg["min"], cfg["max"])
    if metric in ("heart_rate", "systolic_bp", "diastolic_bp", "blood_sugar"):
        return round(value, 1)
    return round(value, 2)


def _inject_anomaly(readings: Dict, rng: random.Random) -> str:
    """Randomly spike one metric to inject a detectable anomaly."""
    metric = rng.choice(list(_BASELINES.keys()))
    cfg = _BASELINES[metric]
    direction = rng.choice([-1, 1])
    spike = cfg["mean"] + direction * cfg["std"] * rng.uniform(3.5, 5.5)
    spike = _clamp(spike, cfg["min"], cfg["max"])
    readings[metric] = round(spike, 2)
    return metric


def generate_simulated_reading(
    db: Session, ast: Astronaut
) -> Tuple[Dict, Optional[Dict]]:
    """
    Generate and persist one simulated health reading for the given astronaut.

    Returns:
        (record_dict, anomaly_analysis_dict)
    """
    rng = random.Random()  # Non-seeded for genuine variability each call
    mission_day = _mission_day(ast)

    readings: Dict[str, float] = {
        metric: _sample_metric(metric, mission_day, rng)
        for metric in _BASELINES
    }

    inject_anomaly = rng.random() < _ANOMALY_RATE
    injected_metric: Optional[str] = None
    if inject_anomaly:
        injected_metric = _inject_anomaly(readings, rng)

    record = HealthRecord(
        astronaut_id      = ast.id,
        recorded_at       = datetime.utcnow(),
        heart_rate        = readings["heart_rate"],
        systolic_bp       = readings["systolic_bp"],
        diastolic_bp      = readings["diastolic_bp"],
        blood_sugar       = readings["blood_sugar"],
        body_temperature  = readings["body_temperature"],
        oxygen_saturation = readings["oxygen_saturation"],
        sleep_duration    = readings["sleep_duration"],
        data_source       = "simulated",
        is_simulated      = True,
        notes             = (
            f"[SIMULATED] Mission day {mission_day}. "
            + (f"Injected anomaly in '{injected_metric}'." if injected_metric else "Normal reading.")
        ),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # Run anomaly detection on stored historical data
    from app.services.health_service import _run_anomaly_detection_and_alert
    _run_anomaly_detection_and_alert(db, ast, record)
    db.refresh(record)

    record_dict = {
        "id":                record.id,
        "astronaut_id":      ast.astronaut_id,
        "recorded_at":       record.recorded_at.isoformat(),
        "heart_rate":        record.heart_rate,
        "systolic_bp":       record.systolic_bp,
        "diastolic_bp":      record.diastolic_bp,
        "blood_sugar":       record.blood_sugar,
        "body_temperature":  record.body_temperature,
        "oxygen_saturation": record.oxygen_saturation,
        "sleep_duration":    record.sleep_duration,
        "is_simulated":      True,
        "data_source":       "simulated",
        "is_anomaly":        record.is_anomaly,
        "anomaly_score":     record.anomaly_score,
    }

    analysis: Optional[Dict] = None
    if record.is_anomaly is not None:
        analysis = {
            "is_anomaly":    record.is_anomaly,
            "anomaly_score": record.anomaly_score,
            "status":        "anomaly_detected" if record.is_anomaly else "normal",
            "explanation":   "Simulated reading analysed against historical baseline.",
            "recommendation": "Review if anomaly detected." if record.is_anomaly else "Continue monitoring.",
            "contributing_factors": [],
        }

    return record_dict, analysis
