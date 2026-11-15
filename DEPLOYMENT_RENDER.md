# ASTROCARE 3D — RENDER.COM DEPLOYMENT KEYS & VALUES

This guide provides the exact configuration, build settings, and **Environment Variables (Keys and Values)** required to deploy **ASTROCARE 3D** to [Render](https://render.com).

---

## 🚀 OPTION 1: ALL-IN-ONE FULL-STACK WEB SERVICE (RECOMMENDED)

> **Why this is recommended:**  
> The multi-stage `Dockerfile` in the repository builds both the React + Three.js frontend and the FastAPI backend into a single container. You get a single live URL (e.g., `https://astrocare-3d.onrender.com`), WebSockets connect automatically without cross-domain issues, and zero CORS errors occur.

### Render Service Setup
- **Service Type:** Web Service
- **Environment / Runtime:** `Docker`
- **Region:** Oregon (US West) or Frankfurt (EU)
- **Branch:** `main`
- **Root Directory:** *(leave blank / repository root)*
- **Dockerfile Path:** `./Dockerfile`
- **Instance Type:** `Free` (or Starter)
- **Health Check Path:** `/health`

### Environment Variables (Keys & Values)

| Key | Value | Description |
| :--- | :--- | :--- |
| `APP_ENV` | `production` | Enables production security & optimizations |
| `SECRET_KEY` | `astrocare-secret-key-3d-quantum-med-2026` *(or click "Generate")* | 32+ character JWT secret string |
| `DATABASE_URL` | `sqlite:///./astracare_dev.db` | Development SQLite DB path (or Render Postgres URL) |
| `CORS_ORIGINS` | `*` | Allows all origins when served from the same domain |
| `SIMULATION_INTERVAL_SECONDS` | `30` | Real-time background simulation interval |
| `PORT` | `10000` | Render standard internal container port |
| `OPENAI_API_KEY` | *(optional - leave blank)* | Optional LLM API key (heuristic engine active) |
| `GEMINI_API_KEY` | *(optional - leave blank)* | Optional Gemini API key |

---

## ⚡ OPTION 2: SPLIT DEPLOYMENT (SEPARATE BACKEND + FRONTEND)

If you prefer two separate services on Render (one Web Service for FastAPI, one Static Site for React):

### 1. Backend Web Service (FastAPI)
- **Service Type:** Web Service
- **Runtime:** `Python`
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path:** `/health`

#### Backend Environment Variables:
| Key | Value | Notes |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.11.9` | Ensures compatible Python runtime |
| `APP_ENV` | `production` | Production mode |
| `SECRET_KEY` | `astrocare-secret-key-3d-quantum-med-2026` | Random JWT encryption key |
| `DATABASE_URL` | `sqlite:///./astracare_dev.db` | SQLite or PostgreSQL connection string |
| `CORS_ORIGINS` | `https://your-frontend.onrender.com,http://localhost:5173` | Replace with your frontend Render URL |
| `SIMULATION_INTERVAL_SECONDS` | `30` | Simulation cadence |

---

### 2. Frontend Static Site (React + Vite)
- **Service Type:** Static Site
- **Runtime:** `Static`
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`

#### Frontend Environment Variables:
| Key | Value | Notes |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://your-backend.onrender.com` | URL of your deployed Backend Web Service |
| `VITE_WS_URL` | `wss://your-backend.onrender.com` | Secure WebSocket URL of backend |
| `VITE_APP_NAME` | `ASTROCARE 3D` | Application title |
| `VITE_APP_VERSION` | `1.0.0` | Application release version |

#### Frontend Redirect / Rewrite Rule (Important for React Router):
In your Render Static Site settings under **Redirects/Rewrites**:
- **Type:** `Rewrite`
- **Source:** `/*`
- **Destination:** `/index.html`

---

## 📋 1-CLICK RENDER BLUEPRINT (`render.yaml`)

We have placed a pre-configured `render.yaml` file in the root directory. To deploy with one click:
1. Push your repository to GitHub / GitLab.
2. In the Render Dashboard, click **New +** $\to$ **Blueprint**.
3. Select your repository.
4. Render will automatically read `render.yaml`, prefill all service settings, and launch your application!
