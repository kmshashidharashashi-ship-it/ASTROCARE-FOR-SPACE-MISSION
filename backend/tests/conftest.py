"""
ASTRACARE – pytest fixtures shared across all test modules.
"""

from __future__ import annotations

import os
os.environ["TESTING"] = "1"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.connection import Base, get_db
from app.main import app

from sqlalchemy.pool import StaticPool

# ── In-memory SQLite test database ───────────────────────────────────────────

TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Create all tables, yield a session, then drop all tables."""
    # Import all models to register them
    import app.models.astronaut             # noqa
    import app.models.health_record         # noqa
    import app.models.wellness_record       # noqa
    import app.models.alert                 # noqa
    import app.models.analysis_result       # noqa
    import app.models.report                # noqa
    import app.models.user                  # noqa
    import app.models.radiation_reading     # noqa
    import app.models.environmental_reading # noqa

    Base.metadata.create_all(bind=test_engine)
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with the test DB injected."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    c = TestClient(app)
    yield c
    app.dependency_overrides.clear()


@pytest.fixture
def default_astronaut(db_session):
    """Create and return a default astronaut for use in tests."""
    from datetime import date
    from app.models.astronaut import Astronaut

    ast = Astronaut(
        astronaut_id       = "AST-TEST",
        name               = "Test Astronaut",
        age                = 35,
        gender             = "Female",
        blood_type         = "A+",
        mission_name       = "Test Mission Alpha",
        mission_start_date = date(2024, 1, 1),
        role               = "Pilot",
        avatar_initials    = "TA",
    )
    db_session.add(ast)
    db_session.commit()
    db_session.refresh(ast)
    return ast
