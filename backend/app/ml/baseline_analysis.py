"""
ASTRACARE – Personal baseline analysis.

Computes a per-astronaut baseline from historical readings and compares
new readings against it.  Requires a minimum of 7 records before a baseline
is considered reliable.
"""

from __future__ import annotations

from typing import Dict, List, Optional

import numpy as np
import pandas as pd

from app.ml.preprocessing import HEALTH_FEATURE_COLUMNS, records_to_dataframe

MIN_RECORDS_FOR_BASELINE: int = 7
ROLLING_WINDOW: int = 7


def _linear_trend(series: pd.Series) -> str:
    """
    Fit a simple linear trend to a numeric series.
    Returns 'increasing', 'decreasing', or 'stable'.
    """
    cleaned = series.dropna()
    if len(cleaned) < 3:
        return "stable"
    x = np.arange(len(cleaned), dtype=float)
    y = cleaned.values.astype(float)
    # least-squares slope
    slope = np.polyfit(x, y, 1)[0]
    # 'significant' if slope exceeds 1% of the mean per step
    mean_val = np.mean(y)
    threshold = 0.01 * mean_val if mean_val != 0 else 0.01
    if slope > threshold:
        return "increasing"
    elif slope < -threshold:
        return "decreasing"
    return "stable"


def compute_rolling_stats(df: pd.DataFrame, window: int = ROLLING_WINDOW) -> pd.DataFrame:
    """
    Compute rolling mean and rolling std for each health feature column.
    Returns a new DataFrame with '<feature>_roll_mean' and '<feature>_roll_std' columns.
    """
    result = df.copy()
    for col in HEALTH_FEATURE_COLUMNS:
        if col in df.columns:
            result[f"{col}_roll_mean"] = df[col].rolling(window=window, min_periods=1).mean()
            result[f"{col}_roll_std"]  = df[col].rolling(window=window, min_periods=1).std()
    return result


def compute_baseline(records: List[Dict]) -> Dict:
    """
    Compute a personal baseline from a list of health record dicts.

    Returns:
        {
            "has_baseline": bool,
            "record_count": int,
            "metrics": {
                "<metric>": {"mean": float, "std": float, "trend": str, "count": int},
                ...
            }
        }
    """
    if len(records) < MIN_RECORDS_FOR_BASELINE:
        return {
            "has_baseline": False,
            "record_count": len(records),
            "metrics":      {},
            "message":      (
                f"Baseline requires at least {MIN_RECORDS_FOR_BASELINE} records. "
                f"Currently have {len(records)}."
            ),
        }

    df = records_to_dataframe(records)
    metrics: Dict[str, Dict] = {}

    for col in HEALTH_FEATURE_COLUMNS:
        if col not in df.columns:
            continue
        series = df[col].dropna()
        if series.empty:
            continue
        metrics[col] = {
            "mean":  round(float(series.mean()), 3),
            "std":   round(float(series.std(ddof=1)) if len(series) > 1 else 0.0, 3),
            "trend": _linear_trend(series),
            "count": int(series.count()),
        }

    return {
        "has_baseline": True,
        "record_count": len(records),
        "metrics":      metrics,
    }


def compare_to_baseline(current_reading: Dict, baseline: Dict) -> Dict:
    """
    Compare a single reading against a computed baseline.

    Returns:
        {
            "deviations":        {metric: {"value", "baseline_mean", "z_score", "flag"}},
            "deviation_flags":   [list of flagged metric names],
            "overall_deviation": float  (mean absolute z-score across flagged metrics)
        }
    """
    if not baseline.get("has_baseline"):
        return {
            "deviations":        {},
            "deviation_flags":   [],
            "overall_deviation": 0.0,
            "note":              "No baseline available for comparison.",
        }

    baseline_metrics = baseline.get("metrics", {})
    deviations: Dict[str, Dict] = {}
    flags: List[str] = []
    z_scores: List[float] = []

    for metric, stats in baseline_metrics.items():
        value = current_reading.get(metric)
        if value is None:
            continue

        mean = stats["mean"]
        std  = stats["std"]

        if std > 0:
            z_score = abs((float(value) - mean) / std)
        else:
            z_score = 0.0

        is_flagged = z_score > 2.0  # more than 2 standard deviations
        deviations[metric] = {
            "value":          round(float(value), 3),
            "baseline_mean":  round(mean, 3),
            "baseline_std":   round(std, 3),
            "z_score":        round(z_score, 3),
            "flag":           is_flagged,
        }
        if is_flagged:
            flags.append(metric)
            z_scores.append(z_score)

    overall = round(float(np.mean(z_scores)), 3) if z_scores else 0.0

    return {
        "deviations":        deviations,
        "deviation_flags":   flags,
        "overall_deviation": overall,
    }


class PersonalBaseline:
    """Convenience class for managing an astronaut's personal baseline."""

    def __init__(self):
        self._baseline: Dict = {"has_baseline": False, "record_count": 0, "metrics": {}}

    def update(self, records: List[Dict]) -> None:
        self._baseline = compute_baseline(records)

    def compare(self, reading: Dict) -> Dict:
        return compare_to_baseline(reading, self._baseline)

    @property
    def has_baseline(self) -> bool:
        return self._baseline.get("has_baseline", False)

    @property
    def summary(self) -> Dict:
        return self._baseline
