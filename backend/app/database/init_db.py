"""
ASTRACARE – Database initialisation.
Creates all tables and seeds default astronauts, users, and baseline readings.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app.database.connection import Base, SessionLocal, engine

logger = logging.getLogger("astracare.init_db")


def init_db() -> None:
    """Create all tables and seed default data."""
    # Import all models so SQLAlchemy registers them before create_all
    import app.models.astronaut             # noqa: F401
    import app.models.health_record         # noqa: F401
    import app.models.wellness_record       # noqa: F401
    import app.models.alert                 # noqa: F401
    import app.models.analysis_result       # noqa: F401
    import app.models.report                # noqa: F401
    import app.models.user                  # noqa: F401
    import app.models.radiation_reading     # noqa: F401
    import app.models.environmental_reading # noqa: F401

    logger.info("Creating database tables…")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified.")

    # Safely check and add emergency decision support columns to existing alerts table
    try:
        with engine.connect() as conn:
            cursor = conn.connection.cursor()
            cursor.execute("PRAGMA table_info(alerts)")
            existing_cols = [row[1] for row in cursor.fetchall()]
            new_cols = [
                ("status", "VARCHAR(32) DEFAULT 'ACTIVE'"),
                ("assigned_to", "VARCHAR(128)"),
                ("assigned_role", "VARCHAR(64)"),
                ("checklist_state", "TEXT"),
                ("action_log", "TEXT"),
                ("is_escalated", "BOOLEAN DEFAULT 0"),
                ("escalated_at", "DATETIME"),
                ("escalated_by", "VARCHAR(128)"),
                ("resolution_notes", "TEXT"),
                ("resolved_at", "DATETIME"),
                ("resolved_by", "VARCHAR(128)"),
            ]
            for col_name, col_def in new_cols:
                if col_name not in existing_cols:
                    cursor.execute(f"ALTER TABLE alerts ADD COLUMN {col_name} {col_def}")
            conn.connection.commit()
    except Exception as e:
        logger.debug(f"Alerts column migration check: {e}")

    db: Session = SessionLocal()
    try:
        _seed_astronauts(db)
        _seed_users(db)
        _seed_initial_telemetry(db)
    finally:
        db.close()


def _seed_astronauts(db: Session) -> None:
    from app.models.astronaut import Astronaut

    astronauts_data = [
        {
            "astronaut_id": "AST-001",
            "name": "Commander Alex Chen",
            "age": 38,
            "gender": "Male",
            "blood_type": "O+",
            "mission_name": "Artemis IV – Lunar Gateway",
            "mission_start_date": date(2024, 3, 1),
            "role": "Mission Commander",
            "avatar_initials": "AC",
        },
        {
            "astronaut_id": "AST-002",
            "name": "Dr. Sarah Lindqvist",
            "age": 36,
            "gender": "Female",
            "blood_type": "A+",
            "mission_name": "Artemis IV – Lunar Gateway",
            "mission_start_date": date(2024, 3, 1),
            "role": "Flight Surgeon",
            "avatar_initials": "SL",
        },
        {
            "astronaut_id": "AST-003",
            "name": "Marcus Vance",
            "age": 42,
            "gender": "Male",
            "blood_type": "B+",
            "mission_name": "Artemis IV – Lunar Gateway",
            "mission_start_date": date(2024, 3, 1),
            "role": "Systems Engineer",
            "avatar_initials": "MV",
        },
        {
            "astronaut_id": "AST-004",
            "name": "Elena Rostova",
            "age": 34,
            "gender": "Female",
            "blood_type": "AB-",
            "mission_name": "Artemis IV – Lunar Gateway",
            "mission_start_date": date(2024, 3, 1),
            "role": "Payload Specialist",
            "avatar_initials": "ER",
        },
    ]

    for data in astronauts_data:
        existing = db.query(Astronaut).filter(Astronaut.astronaut_id == data["astronaut_id"]).first()
        if not existing:
            ast = Astronaut(**data)
            db.add(ast)
    db.commit()


def _seed_users(db: Session) -> None:
    from app.models.user import User
    from app.services.auth_service import hash_password

    users_data = [
        {
            "email": "commander@astrocare.space",
            "password": "MissionCmd2026!",
            "full_name": "Commander Alex Chen",
            "role": "Mission Commander",
            "callsign": "GATEWAY-ACTUAL",
        },
        {
            "email": "surgeon@astrocare.space",
            "password": "FlightSurgeon2026!",
            "full_name": "Dr. Sarah Lindqvist",
            "role": "Flight Surgeon",
            "callsign": "SURGEON-ONE",
        },
        {
            "email": "medical@astrocare.space",
            "password": "MedOfficer2026!",
            "full_name": "Dr. Julian Patel",
            "role": "Medical Officer",
            "callsign": "MED-PATEL",
        },
        {
            "email": "analyst@astrocare.space",
            "password": "MissionAnalyst2026!",
            "full_name": "Taro Tanaka",
            "role": "Mission Analyst",
            "callsign": "DATA-ORBIT",
        },
        {
            "email": "admin@astrocare.space",
            "password": "AstroAdmin2026!",
            "full_name": "AstroCare Admin",
            "role": "Administrator",
            "callsign": "MCC-ADMIN",
        },
    ]

    for u in users_data:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            hashed = hash_password(u["password"])
            user = User(
                email=u["email"],
                hashed_password=hashed,
                full_name=u["full_name"],
                role=u["role"],
                callsign=u["callsign"],
                is_active=True,
            )
            db.add(user)
    db.commit()


def _seed_initial_telemetry(db: Session) -> None:
    from app.models.astronaut import Astronaut
    from app.models.health_record import HealthRecord
    from app.models.radiation_reading import RadiationReading
    from app.models.environmental_reading import EnvironmentalReading
    from app.models.wellness_record import WellnessRecord

    ast = db.query(Astronaut).filter(Astronaut.astronaut_id == "AST-001").first()
    if not ast:
        return

    # Check if records already exist
    count = db.query(HealthRecord).filter(HealthRecord.astronaut_id == ast.id).count()
    if count >= 10:
        return

    logger.info("Seeding initial baseline telemetry for AST-001...")
    base_time = datetime.utcnow() - timedelta(days=5)
    import random
    rng = random.Random(42)

    # 15 historical health records
    for i in range(15):
        t = base_time + timedelta(hours=i * 8)
        hr = HealthRecord(
            astronaut_id=ast.id,
            recorded_at=t,
            heart_rate=round(rng.gauss(68, 4), 1),
            systolic_bp=round(rng.gauss(118, 5), 1),
            diastolic_bp=round(rng.gauss(76, 4), 1),
            blood_sugar=round(rng.gauss(95, 6), 1),
            body_temperature=round(rng.gauss(36.7, 0.2), 2),
            oxygen_saturation=round(clamp(rng.gauss(98.2, 0.4), 96.0, 100.0), 1),
            sleep_duration=round(rng.gauss(7.2, 0.6), 1),
            data_source="simulated",
            is_simulated=True,
            is_anomaly=False,
            anomaly_score=0.08,
        )
        db.add(hr)

    # Radiation readings
    for i in range(10):
        t = base_time + timedelta(hours=i * 12)
        rad = RadiationReading(
            astronaut_id=ast.id,
            recorded_at=t,
            current_rate_usv_h=round(rng.uniform(22.5, 29.8), 2),
            cumulative_dose_msv=round(12.4 + i * 0.32, 2),
            ionizing_index=round(rng.uniform(2.1, 2.8), 1),
            radiation_status="normal",
            solar_particle_event=False,
            data_source="dosimeter_sim",
            is_simulated=True,
        )
        db.add(rad)

    # Environmental readings
    for i in range(10):
        t = base_time + timedelta(hours=i * 12)
        env = EnvironmentalReading(
            recorded_at=t,
            cabin_oxygen_pct=round(rng.uniform(20.8, 21.2), 2),
            carbon_dioxide_mmhg=round(rng.uniform(1.8, 2.6), 2),
            cabin_pressure_kpa=round(rng.uniform(101.1, 101.5), 2),
            cabin_temp_c=round(rng.uniform(21.8, 22.8), 1),
            humidity_pct=round(rng.uniform(44.0, 52.0), 1),
            radiation_ambient_usv_h=round(rng.uniform(18.0, 24.0), 2),
            air_quality_index=96.5,
            status="nominal",
            is_simulated=True,
        )
        db.add(env)

    # Wellness records
    for i in range(5):
        t = base_time + timedelta(days=i)
        w = WellnessRecord(
            astronaut_id=ast.id,
            recorded_at=t,
            mood=8,
            stress_level=3,
            fatigue_level=4,
            energy_level=7,
            sleep_quality=8,
            journal_entry="Nominal EVA preparation. Sleep rhythm stabilized.",
            data_source="simulated",
            is_simulated=True,
        )
        db.add(w)

    db.commit()
    logger.info("Database initial seeding complete.")


def clamp(val, min_v, max_v):
    return max(min_v, min(max_v, val))
