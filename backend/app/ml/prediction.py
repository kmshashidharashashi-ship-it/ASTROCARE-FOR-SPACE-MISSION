"""
ASTRACARE – Trend analysis and human-readable insight generation.
"""

from __future__ import annotations

from typing import Dict, List, Optional

import numpy as np
import pandas as pd

from app.ml.preprocessing import HEALTH_FEATURE_COLUMNS, records_to_dataframe


# ── Time-series trend analysis ────────────────────────────────────────────────

def _slope_direction(series: pd.Series) -> str:
    cleaned = series.dropna()
    if len(cleaned) < 3:
        return "stable"
    x = np.arange(len(cleaned), dtype=float)
    y = cleaned.values.astype(float)
    slope = np.polyfit(x, y, 1)[0]
    mean_val = np.mean(y)
    threshold = 0.015 * abs(mean_val) if mean_val != 0 else 0.01
    if slope > threshold:
        return "increasing"
    elif slope < -threshold:
        return "decreasing"
    return "stable"


def time_series_trends(df: pd.DataFrame, metric: str) -> Dict:
    """
    Compute trend statistics for a single metric in a DataFrame.

    Returns a dict with:
        {
            "metric": str,
            "count": int,
            "mean": float,
            "std": float,
            "min": float,
            "max": float,
            "trend": "increasing" | "decreasing" | "stable",
            "pct_change_7d": float | None,  # % change over last 7 readings
        }
    """
    if metric not in df.columns:
        return {"metric": metric, "error": "metric not in dataframe"}

    series = df[metric].dropna()
    if series.empty:
        return {"metric": metric, "count": 0, "error": "no data"}

    result: Dict = {
        "metric": metric,
        "count":  int(series.count()),
        "mean":   round(float(series.mean()), 3),
        "std":    round(float(series.std(ddof=1)) if len(series) > 1 else 0.0, 3),
        "min":    round(float(series.min()), 3),
        "max":    round(float(series.max()), 3),
        "trend":  _slope_direction(series),
        "pct_change_7d": None,
    }

    if len(series) >= 14:
        last_7   = series.iloc[-7:].mean()
        prev_7   = series.iloc[-14:-7].mean()
        if prev_7 != 0:
            result["pct_change_7d"] = round(((last_7 - prev_7) / abs(prev_7)) * 100, 2)

    return result


def analyze_all_trends(records: List[Dict]) -> Dict:
    """
    Run time_series_trends on all health feature columns.
    Returns a dict keyed by metric name.
    """
    if not records:
        return {}

    df = records_to_dataframe(records)
    return {
        metric: time_series_trends(df, metric)
        for metric in HEALTH_FEATURE_COLUMNS
        if metric in df.columns
    }


# ── Human-readable insight text ───────────────────────────────────────────────

def generate_insight_text(analysis_result: Dict, baseline_comparison: Dict) -> str:
    """
    Combine anomaly detection output and baseline comparison into a
    clear, human-readable paragraph for the astronaut.
    """
    lines: List[str] = []

    status = analysis_result.get("status", "insufficient_data")

    if status == "insufficient_data":
        lines.append(
            "Not enough historical data is available yet to perform personalised analysis. "
            "Keep logging your health readings — analysis will begin automatically once "
            "sufficient data has been collected."
        )
        return " ".join(lines)

    if status == "incomplete_data":
        lines.append(
            "Some measurements were missing from this reading, which limits the accuracy of the analysis. "
            "Please ensure all required fields are filled in for best results."
        )
        return " ".join(lines)

    # Normal or anomaly detected
    is_anomaly   = analysis_result.get("is_anomaly", False)
    score        = analysis_result.get("anomaly_score")
    factors      = analysis_result.get("contributing_factors", [])
    flags        = baseline_comparison.get("deviation_flags", [])

    if is_anomaly:
        lines.append("⚠️  ALERT: One or more of your vitals deviates from your personal norm.")
        if factors:
            top = factors[0]
            lines.append(
                f"Your {top['metric'].replace('_', ' ')} reading of {top['value']} "
                f"is {top['deviation_std']:.1f} standard deviations from your personal average "
                f"of {top['personal_mean']}."
            )
        if len(factors) > 1:
            others = ", ".join(f['metric'].replace('_', ' ') for f in factors[1:3])
            lines.append(f"Additional metrics of note: {others}.")
        lines.append(
            "This does not constitute a medical diagnosis. If symptoms are present or "
            "readings remain elevated, please contact your mission medical officer."
        )
    else:
        lines.append("✅  Your health readings look consistent with your personal baseline.")
        if score is not None:
            lines.append(f"Anomaly confidence score: {score:.2%} (lower is better).")

    if flags:
        flag_names = ", ".join(f.replace("_", " ") for f in flags)
        lines.append(
            f"Baseline comparison flagged the following for review: {flag_names}."
        )

    return " ".join(lines)


# ── Wellness trend assessment ─────────────────────────────────────────────────

def assess_wellness_trend(wellness_records: List[Dict]) -> Dict:
    """
    Summarise wellness trends from a list of wellness record dicts.

    Returns a dict with per-dimension summaries and an overall score.
    """
    if not wellness_records:
        return {"has_data": False, "message": "No wellness records available."}

    dimensions = ["mood", "stress_level", "fatigue_level", "energy_level", "sleep_quality"]
    df = pd.DataFrame(wellness_records)

    summary: Dict = {"has_data": True, "record_count": len(df), "dimensions": {}}

    for dim in dimensions:
        if dim not in df.columns:
            continue
        series = df[dim].dropna()
        if series.empty:
            continue
        trend = _slope_direction(series)
        # For stress/fatigue, increasing is bad; for others, decreasing is bad
        if dim in ("stress_level", "fatigue_level"):
            if trend == "increasing":
                concern = "high"
            elif trend == "decreasing":
                concern = "low"
            else:
                concern = "stable"
        else:
            if trend == "decreasing":
                concern = "high"
            elif trend == "increasing":
                concern = "low"
            else:
                concern = "stable"

        summary["dimensions"][dim] = {
            "mean":    round(float(series.mean()), 2),
            "std":     round(float(series.std()) if len(series) > 1 else 0.0, 2),
            "trend":   trend,
            "concern": concern,
        }

    # Overall wellness score (0-100)
    positive_dims = ["mood", "energy_level", "sleep_quality"]
    negative_dims = ["stress_level", "fatigue_level"]
    scores: List[float] = []

    for dim in positive_dims:
        if dim in summary["dimensions"]:
            scores.append(summary["dimensions"][dim]["mean"] * 10)

    for dim in negative_dims:
        if dim in summary["dimensions"]:
            scores.append((11 - summary["dimensions"][dim]["mean"]) * 10)

    summary["overall_wellness_score"] = round(float(np.mean(scores)), 1) if scores else None
    return summary
