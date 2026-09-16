# TEL PRAGATI — Baghewala Digital Twin Services Startup Guide

This document provides complete instructions for starting and operating the **TEL PRAGATI** (Baghewala Well-to-Surface Digital Twin) services across all supported modes: **Standalone Local Mode**, **Hybrid Development Mode**, and **Full Docker Mode**.

---

## 📋 System Architecture & Port Mapping

| Service | Technology | Port(s) | Default URL / Endpoint | Health Check / Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Web App** | Next.js 15 / React 19 | `3000` | [http://localhost:3000](http://localhost:3000) | Main UI & Digital Twin Dashboard |
| **Backend REST & WS API**| FastAPI / Uvicorn | `8000` | [http://localhost:8000](http://localhost:8000) | REST API & WebSocket server |
| **API Documentation** | Swagger / OpenAPI | `8000` | [http://localhost:8000/api/docs](http://localhost:8000/api/docs) | Interactive API Explorer |
| **TimescaleDB (PostgreSQL)** | TimescaleDB / PG16 | `5432` | `localhost:5432` (db: `btwin`) | Timeseries & relational persistence |
| **Redis Cache / Broker** | Redis 7 Alpine | `6379` | `localhost:6379` | State cache & Pub/Sub broker |
| **MQTT Broker** | Eclipse Mosquitto 2 | `1883`, `9001` | `localhost:1883` / `ws://localhost:9001` | IoT & Edge Wellhead Telemetry |
| **MLflow Tracking** | MLflow v2.17.2 | `5000` | [http://localhost:5000](http://localhost:5000) | Model registry & experiment tracking |

---

## 🛠️ Prerequisites

Ensure the following tools are installed on your machine:
- **Node.js**: `v18.18+` or `v20+` ([Download](https://nodejs.org/))
- **Python**: `3.11+` ([Download](https://www.python.org/))
- **Docker Desktop** (Optional, recommended for database & broker services): ([Download](https://www.docker.com/))
- **Git**

---

## 🚀 Startup Options

Choose the startup option that matches your workflow:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ OPTION 1: Standalone Mode (Fastest — No Docker required)                   │
│   • Backend runs on synthetic/physics fallback                              │
│   • Frontend runs in dev mode                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ OPTION 2: Hybrid Mode (Recommended for Active Development)                  │
│   • Docker runs DB, Redis, MQTT, MLflow                                     │
│   • Host runs Backend (Python with auto-reload) + Frontend (Next.js)        │
├─────────────────────────────────────────────────────────────────────────────┤
│ OPTION 3: Full Docker Mode (Production-like / Single Command)               │
│   • All backend services + containers run under docker-compose              │
│   • Frontend runs via host or container                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🟢 Option 1: Standalone Local Mode (Zero Docker Dependencies)

> **Note:** The backend has built-in graceful degradation. If TimescaleDB or MQTT are offline, it automatically starts in **physics-driven synthetic data mode** without crashing.

### Step 1: Backend Setup & Startup

#### Windows (PowerShell):
```powershell
# Navigate to backend directory
cd D:\Tempo_Twin\backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Upgrade pip & install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create .env if not present
if (-not (Test-Path .env)) { Copy-Item .env.example .env }

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Linux / macOS (Bash):
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp -n .env.example .env || true
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

### Step 2: Frontend Setup & Startup

Open a **new terminal window**:

#### Windows (PowerShell) / Linux / macOS:
```bash
# Navigate to frontend directory
cd D:\Tempo_Twin\frontend   # (or 'cd frontend' on Linux/macOS)

# Install npm dependencies
npm install

# Verify environment file (.env.local)
# Ensure NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
# Ensure NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000/ws

# Start Next.js development server
npm run dev
```

The frontend will be live at: **[http://localhost:3000](http://localhost:3000)**

---

## 🟡 Option 2: Hybrid Mode (Docker Infrastructure + Local Live Code)

*Best for full-stack development with live database & telemetry persistence while retaining fast hot-reload for code.*

### 1. Launch Infrastructure via Docker
From `D:\Tempo_Twin\backend`:
```bash
cd backend
docker-compose up -d timescaledb redis mqtt-broker mlflow
```

Check status:
```bash
docker-compose ps
```

### 2. Run Database Migrations (Optional / When Schema Updates)
```bash
# With venv activated in backend/
alembic upgrade head
```

### 3. Launch Backend with Live Reload
```bash
# With venv activated in backend/
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Launch Frontend
```bash
cd ../frontend
npm run dev
```

---

## 🔵 Option 3: Full Docker Compose Mode

*Runs all backend services including the FastAPI application inside Docker containers.*

```bash
# Navigate to backend directory
cd D:\Tempo_Twin\backend

# Build and start all services in detached mode
docker-compose up --build -d

# View live backend logs
docker-compose logs -f backend
```

Then start the frontend locally:
```bash
cd ../frontend
npm install
npm run dev
```

To stop all Docker services:
```bash
cd backend
docker-compose down
```

---

## 🔍 Verification & Health Checks

Once services are running, verify using the following endpoints:

| Check | Command / URL | Expected Output |
| :--- | :--- | :--- |
| **Backend Health** | `curl http://localhost:8000/health` | `{"status":"healthy","service":"baghewala-digital-twin","version":"1.0.0",...}` |
| **Fleet Summary API** | `curl http://localhost:8000/api/v1/fleet/summary` | JSON array of active well telemetry |
| **Swagger UI** | [http://localhost:8000/api/docs](http://localhost:8000/api/docs) | Interactive OpenAPI 3.0 document |
| **MLflow UI** | [http://localhost:5000](http://localhost:5000) | MLflow tracking dashboard |
| **Frontend UI** | [http://localhost:3000](http://localhost:3000) | Digital Twin 3D / Well Surface Interface |

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`):
```ini
APP_ENV=development
DEBUG=true
LOG_LEVEL=INFO

# Database
DATABASE_URL=postgresql+asyncpg://btwin:secret@localhost:5432/btwin
DATABASE_URL_SYNC=postgresql://btwin:secret@localhost:5432/btwin

# Redis
REDIS_URL=redis://redis:6379/0

# MQTT Broker
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
MQTT_CLIENT_ID=btwin-backend

# MLflow
MLFLOW_TRACKING_URI=http://localhost:5000
MLFLOW_EXPERIMENT_NAME=baghewala-digital-twin

# Synthetic Data Generator
USE_SYNTHETIC_DATA=true
SYNTHETIC_TICK_INTERVAL_S=5

# Economic Configuration
OIL_PRICE_PER_BBL_INR=7000.0
ENERGY_TARIFF_INR_PER_KWH=8.5
STEAM_COST_INR_PER_TON=1200.0
```

### Frontend (`frontend/.env.local`):
```ini
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000/ws
NEXT_PUBLIC_DEFAULT_DATA_MODE=live
```

---

## ⚠️ Troubleshooting & Common Issues

1. **Port 8000 / 3000 / 5432 already in use:**
   - On Windows: `Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process`
   - Or change the port parameter: `uvicorn app.main:app --port 8001` (and adjust `NEXT_PUBLIC_API_BASE_URL`).

2. **Database Connection Refused:**
   - In local development without Docker, the backend gracefully falls back to synthetic mode.
   - If running with Docker, ensure the container is healthy: `docker-compose ps`.

3. **CORS Errors in Browser Console:**
   - Ensure `cors_origins` in `backend/app/config.py` includes your frontend origin (default `http://localhost:3000`).
