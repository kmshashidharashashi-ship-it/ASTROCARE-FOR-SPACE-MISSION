"""
ASTRACARE – SQLAlchemy database connection setup.
"""

from __future__ import annotations

from typing import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings


# ── Engine ────────────────────────────────────────────────────────────────────

def _build_engine():
    if settings.is_sqlite:
        engine = create_engine(
            settings.DATABASE_URL,
            connect_args={"check_same_thread": False},
            echo=settings.APP_ENV == "development",
        )
        # Enable WAL mode and foreign keys for SQLite
        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_conn, _connection_record):
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
        return engine
    else:
        return create_engine(
            settings.DATABASE_URL,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            echo=settings.APP_ENV == "development",
        )


engine = _build_engine()

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


# ── Base declarative ─────────────────────────────────────────────────────────

class Base(DeclarativeBase):
    __allow_unmapped__ = True


# ── FastAPI dependency ────────────────────────────────────────────────────────

def get_db() -> Generator[Session, None, None]:
    """Yield a database session and ensure it is closed afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
