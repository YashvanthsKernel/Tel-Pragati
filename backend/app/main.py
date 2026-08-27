"""Baghewala Digital Twin — FastAPI application entry point.

Graceful startup: if DB or MQTT are unavailable (demo/local mode without Docker),
the app still starts and serves physics-driven synthetic data.
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application lifespan — startup and shutdown."""
    logger.info("Starting Baghewala Digital Twin backend", env=settings.app_env)

    # DB init — graceful: skip if DB unavailable (demo/synthetic mode)
    try:
        from app.database import engine, init_db
        await init_db()
        logger.info("Database connected and schema initialised")
    except Exception as exc:
        logger.warning("Database unavailable — running in physics-only demo mode", error=str(exc))

    # MQTT — graceful: skip if broker unavailable
    try:
        from app.mqtt_client import start_mqtt_listener
        await start_mqtt_listener()
        logger.info("MQTT listener started")
    except Exception as exc:
        logger.warning("MQTT broker unavailable — telemetry via REST only", error=str(exc))

    logger.info("Backend ready — serving on port 8000")
    yield

    # Shutdown
    logger.info("Shutting down backend services")
    try:
        from app.mqtt_client import stop_mqtt_listener
        await stop_mqtt_listener()
    except Exception:
        pass
    try:
        from app.database import engine
        await engine.dispose()
    except Exception:
        pass
    logger.info("Backend shutdown complete")


def create_app() -> FastAPI:
    """Application factory — creates and configures the FastAPI instance."""
    app = FastAPI(
        title="Baghewala Digital Twin API",
        description=(
            "Well-to-Surface Digital Twin for Baghewala heavy-oil field (SIH 2026 PS-26120). "
            "Physics + ML fusion of CSS thermal state and SRP mechanical state."
        ),
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # ─── Middleware ───────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins if settings.cors_origins else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=1024)

    # ─── Prometheus metrics ───────────────────────────────────────────────────
    try:
        from prometheus_client import make_asgi_app
        metrics_app = make_asgi_app()
        app.mount("/metrics", metrics_app)
    except ImportError:
        pass

    # ─── Routers ──────────────────────────────────────────────────────────────
    # Wells + Fleet (includes /fleet/summary for LiveDataProvider.getFleetSummary)
    from app.routers import wells
    app.include_router(wells.router, prefix="/api/v1", tags=["wells"])

    # Optional routers — import-error-safe so missing deps don't crash startup
    _safe_routers = [
        ("app.routers.auth", "router", "/api/v1/auth", ["auth"]),
        ("app.routers.telemetry", "router", "/api/v1", ["telemetry"]),
        ("app.routers.physics", "router", "/api/v1", ["physics"]),
        ("app.routers.diagnostics", "router", "/api/v1", ["diagnostics"]),
        ("app.routers.simulator", "router", "/api/v1", ["simulator"]),
        ("app.routers.optimizer", "router", "/api/v1", ["optimizer"]),
        ("app.routers.control", "router", "/api/v1", ["control"]),
        ("app.routers.recommendations", "router", "/api/v1/recommendations", ["recommendations"]),
        ("app.routers.scenarios", "router", "/api/v1/scenarios", ["scenarios"]),
        ("app.routers.ws", "router", "/ws", ["websocket"]),
    ]
    for module_path, attr, prefix, tags in _safe_routers:
        try:
            import importlib
            mod = importlib.import_module(module_path)
            rtr = getattr(mod, attr)
            app.include_router(rtr, prefix=prefix, tags=tags)
        except Exception as exc:
            logger.warning(f"Could not load router {module_path}", error=str(exc))

    # ─── Core endpoints ───────────────────────────────────────────────────────
    @app.get("/health", tags=["health"])
    async def health_check() -> dict:
        return {
            "status": "healthy",
            "service": "baghewala-digital-twin",
            "version": "1.0.0",
            "mode": "synthetic" if settings.use_synthetic_data else "live",
        }

    @app.get("/api/v1/audit", tags=["audit"])
    async def get_audit_events(well_id: str | None = None) -> list:
        """Audit events endpoint — returns empty list in demo mode."""
        return []

    @app.get("/api/v1/alerts", tags=["alerts"])
    async def get_alerts(well_id: str | None = None) -> list:
        """Alerts endpoint — returns synthetic alerts for demo."""
        if well_id == "BGW-12":
            return [{
                "id": "ALT-001",
                "wellId": "BGW-12",
                "severity": "critical",
                "title": "Rod Floating Risk Critical",
                "timestamp": "2026-08-26T10:30:00Z",
                "condition": "Rod floating risk index > 75%",
                "cause": "Viscosity 25,000 cP — reservoir cooled to 52°C (Day 35)",
                "impact": "Rod string compression on downstroke, impact loading risk",
                "recommendation": "Reduce SPM by 20%, increase VFD damping to 35%",
                "confidencePercent": 87,
                "isAcknowledged": False,
                "routeLink": f"/well/{well_id}/diagnostics",
            }]
        return []

    @app.post("/api/v1/alerts/{alert_id}/ack", tags=["alerts"])
    async def ack_alert(alert_id: str) -> dict:
        return {"status": "acknowledged", "alertId": alert_id}

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
