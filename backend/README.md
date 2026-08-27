# Baghewala Digital Twin — Backend

> **SIH 2026 · Problem Statement 26120 · Oil India Limited**
> Well-to-Surface Digital Twin for Cyclic Steam Stimulation + Sucker Rod Pump optimization.

See the full documentation in backend/docs/ or in the architecture markdown files at the project root.

## Quick Start

```bash
cd backend
cp .env.example .env
docker-compose up -d
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API Docs: http://localhost:8000/api/docs
MLflow:   http://localhost:5000

## Autonomy Tier: Advisory (default)
Nothing is dispatched without explicit human approval. This is a design decision.
