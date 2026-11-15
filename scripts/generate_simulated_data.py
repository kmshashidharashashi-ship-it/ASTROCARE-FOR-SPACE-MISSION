"""
Generate simulated astronaut health data for ASTRACARE demonstration purposes.

ALL DATA PRODUCED BY THIS SCRIPT IS CLEARLY LABELLED AS SIMULATED.
It is not based on real astronaut medical records.
"""

import csv
import os
import random
import math
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BASE_DIR, "datasets", "simulated")

# ──────────────────────────────────────────────────────────────────────────────
# Realistic baseline ranges for a healthy astronaut (not medical advice)
# ──────────────────────────────────────────────────────────────────────────────
BASELINE = {
    "heart_rate":        {"mean": 68,    "std": 8,   "min": 40,  "max": 180},
    "systolic_bp":       {"mean": 118,   "std": 8,   "min": 90,  "max": 160},
    "diastolic_bp":      {"mean": 76,    "std": 6,   "min": 60,  "max": 100},
    "blood_sugar":       {"mean": 95,    "std": 10,  "min": 70,  "max": 140},
    "body_temperature":  {"mean": 36.7,  "std": 0.3, "min": 36,  "max": 38},
    "oxygen_saturation": {"mean": 98.0,  "std": 0.8, "min": 94,  "max": 100},
    "sleep_duration":    {"mean": 7.0,   "std": 0.8, "min": 4,   "max": 10},
}

MOOD_BASELINE       = {"mean": 7.0, "std": 1.5, "min": 1, "max": 10}
STRESS_BASELINE     = {"mean": 4.0, "std": 1.5, "min": 1, "max": 10}
FATIGUE_BASELINE    = {"mean": 4.0, "std": 1.5, "min": 1, "max": 10}
ENERGY_BASELINE     = {"mean": 7.0, "std": 1.5, "min": 1, "max": 10}
SLEEP_Q_BASELINE    = {"mean": 7.0, "std": 1.5, "min": 1, "max": 10}


def clamp(value, lo, hi):
    return max(lo, min(hi, value))


def sample(config, rng):
    v = rng.gauss(config["mean"], config["std"])
    return clamp(v, config["min"], config["max"])


def apply_microgravity_drift(value, metric, mission_day, rng):
    """
    Apply a mild, scientifically-plausible drift to simulate microgravity effects.
    References: NASA HRP known cardiovascular / bone / fluid-shift trends.
    """
    drift_factor = mission_day / 365.0
    if metric == "heart_rate":
        # Mild cardiovascular deconditioning — slight resting HR increase
        value += drift_factor * rng.gauss(2.5, 0.5)
    elif metric == "systolic_bp":
        # Fluid shift initially raises BP, then adapts
        if mission_day < 30:
            value += drift_factor * rng.gauss(3, 1)
        else:
            value -= drift_factor * rng.gauss(1, 0.5)
    elif metric == "sleep_duration":
        # Sleep disruption is common in microgravity
        value -= drift_factor * rng.gauss(0.5, 0.2)
    elif metric == "oxygen_saturation":
        # Slight decrease due to altered atmosphere management
        value -= drift_factor * rng.gauss(0.3, 0.1)
    return value


def generate_health_record(astronaut_id, mission_day, timestamp, rng, inject_anomaly=False):
    record = {
        "astronaut_id": astronaut_id,
        "recorded_at":  timestamp.isoformat(),
        "mission_day":  mission_day,
        "data_source":  "simulated",
        "is_simulated": True,
    }
    for metric, cfg in BASELINE.items():
        v = sample(cfg, rng)
        v = apply_microgravity_drift(v, metric, mission_day, rng)
        v = clamp(v, cfg["min"], cfg["max"])
        if metric in ("heart_rate", "systolic_bp", "diastolic_bp", "blood_sugar"):
            v = round(v, 1)
        else:
            v = round(v, 2)
        record[metric] = v

    if inject_anomaly:
        anomaly_metric = rng.choice(list(BASELINE.keys()))
        cfg = BASELINE[anomaly_metric]
        direction = rng.choice([-1, 1])
        anomaly_value = cfg["mean"] + direction * cfg["std"] * rng.uniform(3.0, 5.0)
        anomaly_value = clamp(anomaly_value, cfg["min"], cfg["max"])
        record[anomaly_metric] = round(anomaly_value, 2)
        record["injected_anomaly_metric"] = anomaly_metric

    return record


def generate_wellness_record(astronaut_id, mission_day, timestamp, rng):
    # Stress and fatigue tend to rise mid-mission
    mission_phase_stress = 1.0 + 0.5 * math.sin(math.pi * mission_day / 180)
    return {
        "astronaut_id":  astronaut_id,
        "recorded_at":   timestamp.isoformat(),
        "mission_day":   mission_day,
        "mood":          int(clamp(round(sample(MOOD_BASELINE, rng)), 1, 10)),
        "stress_level":  int(clamp(round(sample(STRESS_BASELINE, rng) * mission_phase_stress), 1, 10)),
        "fatigue_level": int(clamp(round(sample(FATIGUE_BASELINE, rng) * mission_phase_stress), 1, 10)),
        "energy_level":  int(clamp(round(sample(ENERGY_BASELINE, rng)), 1, 10)),
        "sleep_quality": int(clamp(round(sample(SLEEP_Q_BASELINE, rng)), 1, 10)),
        "data_source":   "simulated",
        "is_simulated":  True,
    }


def generate_dataset(
    astronaut_id="AST-SIM-001",
    mission_duration_days=180,
    readings_per_day=2,
    anomaly_rate=0.05,
    seed=42,
):
    rng = random.Random(seed)
    mission_start = datetime(2024, 3, 1, 8, 0, 0)

    health_records   = []
    wellness_records = []

    for day in range(mission_duration_days):
        for reading in range(readings_per_day):
            hour_offset  = reading * (24 // readings_per_day)
            minute_jitter = rng.randint(-15, 15)
            ts = mission_start + timedelta(days=day, hours=hour_offset, minutes=minute_jitter)
            inject_anomaly = rng.random() < anomaly_rate
            hr = generate_health_record(astronaut_id, day + 1, ts, rng, inject_anomaly)
            health_records.append(hr)

        # One wellness check-in per day (morning)
        ts_w = mission_start + timedelta(days=day, hours=7, minutes=rng.randint(-10, 10))
        wr = generate_wellness_record(astronaut_id, day + 1, ts_w, rng)
        wellness_records.append(wr)

    return health_records, wellness_records


def save_to_csv(records, filepath):
    if not records:
        return
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    all_keys = []
    for r in records:
        for k in r.keys():
            if k not in all_keys:
                all_keys.append(k)
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=all_keys, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(records)
    print(f"  Saved {len(records)} records -> {filepath}")


def main():
    print("=" * 60)
    print("ASTRACARE – Simulated Dataset Generator")
    print("ALL OUTPUT IS SIMULATED DATA – NOT REAL ASTRONAUT DATA")
    print("=" * 60)

    astronauts = [
        {"id": "AST-SIM-001", "seed": 42,  "days": 180},
        {"id": "AST-SIM-002", "seed": 123, "days": 90},
        {"id": "AST-SIM-003", "seed": 999, "days": 365},
    ]

    for ast in astronauts:
        print(f"\nGenerating data for {ast['id']} ({ast['days']} mission days)...")
        health_records, wellness_records = generate_dataset(
            astronaut_id=ast["id"],
            mission_duration_days=ast["days"],
            seed=ast["seed"],
        )
        slug = ast["id"].lower().replace("-", "_")
        save_to_csv(health_records,   os.path.join(OUTPUT_DIR, f"{slug}_health.csv"))
        save_to_csv(wellness_records, os.path.join(OUTPUT_DIR, f"{slug}_wellness.csv"))

    print("\nDone. Files written to datasets/simulated/")
    print("=" * 60)


if __name__ == "__main__":
    main()
