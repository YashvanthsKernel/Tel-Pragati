"""Application configuration loaded from environment variables."""
from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

from pydantic import AnyUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Database
    database_url: str = "postgresql+asyncpg://btwin:secret@localhost:5432/btwin"
    database_url_sync: str = "postgresql://btwin:secret@localhost:5432/btwin"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # MQTT
    mqtt_broker_host: str = "localhost"
    mqtt_broker_port: int = 1883
    mqtt_client_id: str = "btwin-backend"
    mqtt_username: str = ""
    mqtt_password: str = ""

    # Auth
    jwt_secret_key: str = "insecure-dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 1440

    # MLflow
    mlflow_tracking_uri: str = "http://localhost:5000"
    mlflow_experiment_name: str = "baghewala-digital-twin"

    # App
    app_env: str = "development"
    debug: bool = True
    log_level: str = "INFO"
    cors_origins: list[str] = ["*"]

    # Synthetic Data
    use_synthetic_data: bool = True
    synthetic_tick_interval_s: int = 5

    # Economic Config
    oil_price_per_bbl_inr: float = 7000.0
    energy_tariff_inr_per_kwh: float = 8.5
    steam_cost_inr_per_ton: float = 1200.0

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            v_str = v.strip()
            if v_str == "*":
                return ["*"]
            if v_str.startswith("["):
                try:
                    return json.loads(v_str)
                except Exception:
                    pass
            return [x.strip() for x in v_str.split(",") if x.strip()]
        return v


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings singleton."""
    return Settings()
