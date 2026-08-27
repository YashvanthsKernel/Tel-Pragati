"""Database engine, session factory, and base model for the application.

Uses SQLAlchemy 2.0 async API with asyncpg driver. TimescaleDB hypertable
creation is handled via raw SQL in init_db() after table creation.
"""
from __future__ import annotations

import structlog
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()

# Async SQLAlchemy engine
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""
    pass


async def get_db() -> AsyncSession:  # type: ignore[return]
    """FastAPI dependency that provides a database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize the database schema and TimescaleDB hypertables."""
    from app import models  # noqa: F401 — import to register ORM models with Base

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Convert telemetry and srp_sample to TimescaleDB hypertables
        # These calls are idempotent — safe to run on every startup
        for table, time_col in [
            ("telemetry", "ts"),
            ("srp_sample", "ts"),
            ("dynamometer_card", "ts"),
        ]:
            await conn.execute(
                # language=sql
                f"""  -- noqa
                SELECT create_hypertable('{table}', '{time_col}',
                    if_not_exists => TRUE,
                    migrate_data => TRUE
                );
                """
            )
    logger.info("Database schema initialized")
