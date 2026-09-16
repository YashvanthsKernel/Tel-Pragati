# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TEL PRAGATI** — Baghewala Well-to-Surface Digital Twin for Oil India Limited (SIH 2026). A full-stack platform for monitoring, simulating, and optimizing ESP (Electrical Submersible Pump) and CSS (Cyclic Steam Stimulation) wells at the Baghewala heavy oil field.

## Development Commands

### Backend (`backend/`)
```bash
# One-time setup
pip install -r requirements.txt
cp .env.example .env               # then edit as needed

# Run
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    
# Tests
pytest                             # all tests
pytest tests/test_wells.py         # single file
pytest -k "test_name"              # single test

# Lint / type-check
ruff check app/
mypy app/

# DB migrations
alembic upgrade head               # apply migrations
alembic revision --autogenerate -m "message"  # new migration
```

### Docker (infrastructure only — preferred for dev)
```bash
cd backend
docker-compose up -d timescaledb redis mqtt-broker mlflow
docker-compose down
```

## Architecture

### Backend (`backend/app/`)
FastAPI app with graceful degradation: if TimescaleDB or MQTT are unavailable at startup, the app falls back to **physics-driven synthetic data mode** without crashing.

### Frontend (`frontend/src/`)

**Data mode toggle** is the key architectural concept: the app switches between `demo` (deterministic offline simulation) and `live` (real backend) via `useDataModeStore`. The `DataProviderContext` selects the correct provider; all page/component data access goes through `useDataProvider()`.

**State management pattern:**
- `zustand` stores for global UI/app state (`state/` and `store/`)
- `@tanstack/react-query` for all async data fetching through the data provider
- `DataProviderContext` abstracts demo vs live data — components never import `demoDataProvider` or `liveDataProvider` directly

**SSR hydration:** `useDataModeStore` starts as `"demo"` on both server and client, then `DataModeHydrator` (in `AppProviders`) calls `initFromStorage()` after mount to restore the user's saved preference. This prevents Next.js hydration mismatches.

## Key Environment Variables

`frontend/.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000/ws
NEXT_PUBLIC_DEFAULT_DATA_MODE=demo
```

`backend/.env` (copy from `.env.example`):
```
DATABASE_URL=postgresql+asyncpg://btwin:secret@localhost:5432/btwin
REDIS_URL=redis://localhost:6379/0
MQTT_BROKER_HOST=localhost
USE_SYNTHETIC_DATA=true
```
