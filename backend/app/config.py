"""
ASTRACARE – Application Configuration
Reads settings from environment variables / .env file.
"""

from __future__ import annotations

import os
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), "..", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./astracare_dev.db"

    # ── Supabase (optional) ───────────────────────────────────────────────────
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # ── LLM APIs (optional) ───────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    # ── App ───────────────────────────────────────────────────────────────────
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-this-to-a-random-secret-key"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # ── Simulation ────────────────────────────────────────────────────────────
    SIMULATION_INTERVAL_SECONDS: int = 30

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def _ensure_db_url(cls, v: str) -> str:
        if not v or v == "sqlite:///./astracare_dev.db":
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
            db_path = os.path.join(base_dir, "astracare_dev.db").replace("\\", "/")
            return f"sqlite:///{db_path}"
        return v

    @property
    def cors_origins_list(self) -> List[str]:
        """Return CORS_ORIGINS as a Python list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"


# Singleton instance – import this everywhere
settings = Settings()
