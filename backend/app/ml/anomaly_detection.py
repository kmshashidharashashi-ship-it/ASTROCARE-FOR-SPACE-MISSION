"""
ASTRACARE – Anomaly detection using Isolation Forest.
"""

from __future__ import annotations

from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

MIN_SAMPLES_FOR_MODEL: int = 10


class AnomalyDetector:
    """
    Isolation-Forest-based anomaly detector personalised per astronaut.
    Trained on the astronaut's own historical health data to detect deviations
    from their personal patterns (not population-wide norms).
    """

    def __init__(self, contamination: float = 0.1, random_state: int = 42) -> None:
        self.contamination  = contamination
        self.random_state   = random_state
        self.model: Optional[IsolationForest] = None
        self.feature_names: List[str] = []
        self.is_trained: bool = False

    # ── Training ──────────────────────────────────────────────────────────────

    def train(self, features: pd.DataFrame) -> bool:
        """
        Fit the model on a feature DataFrame.
        Returns True on success, False if there are too few samples.
        """
        if len(features) < MIN_SAMPLES_FOR_MODEL:
            self.is_trained = False
            return False

        self.feature_names = list(features.columns)
        self.model = IsolationForest(
            contamination=self.contamination,
            random_state=self.random_state,
            n_estimators=100,
            max_samples="auto",
        )
        self.model.fit(features.values)
        self.is_trained = True
        return True

    # ── Prediction ────────────────────────────────────────────────────────────

    def predict(
        self, features: pd.DataFrame
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Run predictions on a feature DataFrame.
        Returns (predictions, raw_scores):
            predictions: array of  1 (normal) or -1 (anomaly)
            raw_scores: anomaly score from score_samples (more negative = more anomalous)
        """
        if not self.is_trained or self.model is None:
            raise ValueError("Model has not been trained. Call train() first.")
        predictions = self.model.predict(features.values)
        scores      = self.model.score_samples(features.values)
        return predictions, scores

    # ── High-level single-reading analysis ────────────────────────────────────

    def analyze_single_reading(
        self,
        reading: Dict,
        historical_features: pd.DataFrame,
    ) -> Dict:
        """
        Given a new reading dict and a historical feature DataFrame,
        return a comprehensive anomaly analysis dict.
        """
        base_result = {
            "is_anomaly":           False,
            "anomaly_score":        None,
            "status":               "insufficient_data",
            "explanation":          (
                f"Anomaly detection requires at least {MIN_SAMPLES_FOR_MODEL} records. "
                f"Currently have {len(historical_features)}."
            ),
            "contributing_factors": [],
            "recommendation": (
                "Continue recording health measurements to enable anomaly detection."
            ),
        }

        if historical_features is None or len(historical_features) < MIN_SAMPLES_FOR_MODEL:
            return base_result

        trained = self.train(historical_features)
        if not trained:
            return base_result

        # Build a single-row DataFrame from the reading
        reading_values = {k: reading.get(k) for k in self.feature_names}
        if any(v is None for v in reading_values.values()):
            return {
                **base_result,
                "status":      "incomplete_data",
                "explanation": "Some measurements are missing for a complete analysis.",
            }

        reading_df    = pd.DataFrame([reading_values])
        predictions, scores = self.predict(reading_df)

        is_anomaly        = bool(predictions[0] == -1)
        raw_score         = float(scores[0])
        # Normalise score to [0, 1] where higher = more anomalous
        normalized_score  = max(0.0, min(1.0, (-raw_score + 0.5)))

        # Identify contributing features (personal z-score > 1.5)
        contributing: List[Dict] = []
        for feature in self.feature_names:
            val = reading.get(feature)
            if val is None:
                continue
            col_data = historical_features[feature].dropna()
            if col_data.empty:
                continue
            mean = float(col_data.mean())
            std  = float(col_data.std())
            if std > 0:
                z_score = abs((float(val) - mean) / std)
                if z_score > 1.5:
                    contributing.append({
                        "metric":        feature,
                        "value":         round(float(val), 3),
                        "personal_mean": round(mean, 3),
                        "deviation_std": round(z_score, 3),
                    })

        contributing.sort(key=lambda x: x["deviation_std"], reverse=True)

        if is_anomaly:
            status      = "anomaly_detected"
            explanation = (
                "One or more of your health measurements deviates noticeably from "
                "your personal baseline. This does not indicate a diagnosis but "
                "suggests these readings warrant attention."
            )
            recommendation = (
                "Consider reviewing the highlighted measurements. If you feel "
                "unwell or readings persist outside your normal range, consult your "
                "mission medical officer."
            )
        else:
            status         = "normal"
            explanation    = "Your measurements appear consistent with your personal baseline patterns."
            recommendation = "Continue regular monitoring."

        return {
            "is_anomaly":           is_anomaly,
            "anomaly_score":        round(normalized_score, 4),
            "status":               status,
            "explanation":          explanation,
            "contributing_factors": contributing,
            "recommendation":       recommendation,
        }


# ── Module-level convenience function ─────────────────────────────────────────

def detect_anomaly(reading: Dict, historical_features: pd.DataFrame) -> Dict:
    """Thin wrapper that creates an AnomalyDetector and runs a single-reading analysis."""
    detector = AnomalyDetector()
    return detector.analyze_single_reading(reading, historical_features)
