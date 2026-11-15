"""
ASTRACARE – Health data preprocessing utilities.
"""

from __future__ import annotations

from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

HEALTH_FEATURE_COLUMNS: List[str] = [
    "heart_rate",
    "systolic_bp",
    "diastolic_bp",
    "blood_sugar",
    "body_temperature",
    "oxygen_saturation",
    "sleep_duration",
]

REFERENCE_RANGES: Dict[str, Dict] = {
    "heart_rate":        {"min": 40,   "max": 180,  "unit": "bpm"},
    "systolic_bp":       {"min": 60,   "max": 200,  "unit": "mmHg"},
    "diastolic_bp":      {"min": 40,   "max": 130,  "unit": "mmHg"},
    "blood_sugar":       {"min": 50,   "max": 400,  "unit": "mg/dL"},
    "body_temperature":  {"min": 34.0, "max": 42.0, "unit": "°C"},
    "oxygen_saturation": {"min": 70,   "max": 100,  "unit": "%"},
    "sleep_duration":    {"min": 0,    "max": 24,   "unit": "hours"},
}

# NASA-informed typical healthy ranges (narrower than the absolute extremes above)
HEALTHY_RANGES: Dict[str, Dict] = {
    "heart_rate":        {"min": 50,   "max": 100,  "unit": "bpm"},
    "systolic_bp":       {"min": 90,   "max": 140,  "unit": "mmHg"},
    "diastolic_bp":      {"min": 60,   "max": 90,   "unit": "mmHg"},
    "blood_sugar":       {"min": 70,   "max": 140,  "unit": "mg/dL"},
    "body_temperature":  {"min": 36.1, "max": 37.5, "unit": "°C"},
    "oxygen_saturation": {"min": 95,   "max": 100,  "unit": "%"},
    "sleep_duration":    {"min": 6,    "max": 9,    "unit": "hours"},
}


def validate_health_readings(data: Dict) -> Dict:
    """
    Validate readings against plausible physiological ranges.
    Returns a dict with keys 'valid' (bool) and 'warnings' (list of str).
    """
    warnings: List[str] = []
    for field, ranges in REFERENCE_RANGES.items():
        value = data.get(field)
        if value is None:
            continue
        try:
            val = float(value)
        except (TypeError, ValueError):
            warnings.append(f"{field}: non-numeric value '{value}'")
            continue
        if val < ranges["min"] or val > ranges["max"]:
            warnings.append(
                f"{field}: {val} {ranges['unit']} is outside expected range "
                f"[{ranges['min']}–{ranges['max']}]"
            )
    return {"valid": len(warnings) == 0, "warnings": warnings}


def check_healthy_range_flags(data: Dict) -> List[str]:
    """Return flags for readings outside the narrower 'healthy' range."""
    flags: List[str] = []
    for field, ranges in HEALTHY_RANGES.items():
        value = data.get(field)
        if value is None:
            continue
        val = float(value)
        if val < ranges["min"]:
            flags.append(f"{field} ({val} {ranges['unit']}) is below healthy minimum ({ranges['min']})")
        elif val > ranges["max"]:
            flags.append(f"{field} ({val} {ranges['unit']}) exceeds healthy maximum ({ranges['max']})")
    return flags


def records_to_dataframe(records: List[Dict]) -> pd.DataFrame:
    """Convert a list of health record dicts to a sorted DataFrame."""
    df = pd.DataFrame(records)
    if df.empty:
        return df
    if "recorded_at" in df.columns:
        df["recorded_at"] = pd.to_datetime(df["recorded_at"])
        df = df.sort_values("recorded_at").reset_index(drop=True)
    return df


def handle_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """Fill missing numeric values with per-column medians."""
    for col in HEALTH_FEATURE_COLUMNS:
        if col in df.columns:
            median = df[col].median()
            if not np.isnan(median):
                df[col] = df[col].fillna(median)
    return df


def remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    """Remove rows with duplicate timestamps."""
    if "recorded_at" in df.columns:
        df = df.drop_duplicates(subset=["recorded_at"]).reset_index(drop=True)
    return df


def normalize_features(
    df: pd.DataFrame, features: List[str]
) -> Tuple[pd.DataFrame, object]:
    """MinMax-normalize selected feature columns. Returns (df, scaler)."""
    from sklearn.preprocessing import MinMaxScaler

    available = [f for f in features if f in df.columns]
    scaler = MinMaxScaler()
    if available:
        df = df.copy()
        df[available] = scaler.fit_transform(df[available])
    return df, scaler


def prepare_features_for_anomaly_detection(
    records: List[Dict],
) -> Optional[pd.DataFrame]:
    """
    Convert raw record dicts to a clean feature DataFrame ready for
    anomaly detection.  Returns None if there are fewer than 3 records.
    """
    if len(records) < 3:
        return None

    df = records_to_dataframe(records)
    df = remove_duplicates(df)
    df = handle_missing_values(df)

    available_features = [f for f in HEALTH_FEATURE_COLUMNS if f in df.columns]
    feature_df = df[available_features].dropna()
    return feature_df if not feature_df.empty else None
