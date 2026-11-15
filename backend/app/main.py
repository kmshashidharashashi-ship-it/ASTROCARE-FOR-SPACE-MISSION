"""
ASTRACARE – FastAPI application entry point.
AI-Powered Astronaut Health Monitoring, 3D Digital Twin, and Space Mission Medical Intelligence Platform.
"""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.init_db import init_db
from app.websocket.connection_manager import manager

logging.basicConfig(
    level=logging.DEBUG if not settings.is_production else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("astracare")


# ── Background telemetry simulator task ──────────────────────────────────────

async def telemetry_background_broadcaster():
    """Periodically broadcast simulated live mission telemetry to connected WebSockets."""
    import random
    import math
    rng = random.Random()
    tick = 0
    while True:
        try:
            await asyncio.sleep(4.0)
            if manager.telemetry_sockets:
                tick += 1
                hr = round(68 + 4 * math.sin(tick * 0.2) + rng.uniform(-1.5, 1.5), 1)
                spo2 = round(98.0 + rng.uniform(-0.5, 0.5), 1)
                resp_rate = round(14 + 1.5 * math.sin(tick * 0.15) + rng.uniform(-0.5, 0.5), 1)
                temp = round(36.7 + rng.uniform(-0.05, 0.05), 2)
                packet = {
                    "event": "TELEMETRY_TICK",
                    "timestamp": asyncio.get_event_loop().time(),
                    "astronaut_id": "AST-001",
                    "metrics": {
                        "heart_rate": hr,
                        "oxygen_saturation": spo2,
                        "respiratory_rate": resp_rate,
                        "body_temperature": temp,
                        "systolic_bp": round(118 + rng.uniform(-2, 2), 1),
                        "diastolic_bp": round(76 + rng.uniform(-2, 2), 1),
                    },
                    "environment": {
                        "cabin_o2": round(21.0 + rng.uniform(-0.1, 0.1), 2),
                        "cabin_co2": round(2.2 + rng.uniform(-0.05, 0.05), 2),
                        "pressure_kpa": 101.3,
                        "temp_c": 22.2,
                    },
                    "radiation": {
                        "rate_usv_h": round(25.4 + rng.uniform(-0.4, 0.4), 2),
                    },
                    "is_simulated": True,
                }
                await manager.broadcast_telemetry(packet)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.debug(f"Telemetry broadcaster tick error: {e}")


# ── Lifespan event handler ───────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    import os
    is_testing = bool(os.environ.get("TESTING"))
    logger.info("ASTRACARE API starting up…")
    if not is_testing:
        init_db()
        logger.info("Database initialised.")
    task = None
    if not is_testing:
        task = asyncio.create_task(telemetry_background_broadcaster())
    yield
    if task:
        task.cancel()
    logger.info("ASTRACARE API shutting down.")


# ── App instance ─────────────────────────────────────────────────────────────

app = FastAPI(
    title="ASTROCARE 3D API",
    description=(
        "AI-Powered Astronaut Health Monitoring, 3D Digital Twin, and Space Mission Medical Intelligence Platform. "
        "NASA-Related Space Medicine Research and Innovation."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if not settings.is_production else settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

from app.api.auth        import router as auth_router         # noqa: E402
from app.api.astronauts import router as astronauts_router  # noqa: E402
from app.api.health     import router as health_router       # noqa: E402
from app.api.wellness   import router as wellness_router     # noqa: E402
from app.api.insights   import router as insights_router     # noqa: E402
from app.api.radiation  import router as radiation_router    # noqa: E402
from app.api.environment import router as environment_router # noqa: E402
from app.api.reports    import router as reports_router      # noqa: E402
from app.api.nasa       import router as nasa_router         # noqa: E402
from app.api.demo       import router as demo_router         # noqa: E402
from app.api.emergency  import router as emergency_router    # noqa: E402
from app.api.astro_ai   import router as astro_ai_router     # noqa: E402

app.include_router(auth_router,        prefix="/api/auth",        tags=["Authentication"])
app.include_router(astronauts_router,   prefix="/api/astronauts",   tags=["Astronauts"])
app.include_router(health_router,       prefix="/api/health",       tags=["Health"])
app.include_router(wellness_router,     prefix="/api/wellness",     tags=["Wellness"])
app.include_router(insights_router,     prefix="/api/insights",     tags=["Insights & ML"])
app.include_router(radiation_router,    prefix="/api/radiation",    tags=["Radiation"])
app.include_router(environment_router,  prefix="/api/environment",  tags=["Environment"])
app.include_router(reports_router,      prefix="/api/reports",      tags=["Reports"])
app.include_router(nasa_router,         prefix="/api/nasa",         tags=["NASA Open-Data"])
app.include_router(demo_router,         prefix="/api/demo",         tags=["Demonstration"])
app.include_router(emergency_router,    prefix="/api/emergency",    tags=["AI Medical Emergency Assistant"])
app.include_router(astro_ai_router,     prefix="/api/astro-ai",     tags=["Astro Medical Intelligence"])


# ── WebSockets ────────────────────────────────────────────────────────────────

@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await manager.connect_telemetry(websocket)
    try:
        while True:
            # Keep socket alive and accept ping/commands
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect_telemetry(websocket)
    except Exception:
        manager.disconnect_telemetry(websocket)


@app.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    await manager.connect_alerts(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect_alerts(websocket)
    except Exception:
        manager.disconnect_alerts(websocket)


# ── Root endpoints & Frontend Static Hosting ───────────────────────────────────

import os
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))

@app.get("/health", tags=["Root"])
async def health_check():
    return {"status": "ok", "environment": settings.APP_ENV}


if os.path.isdir(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", tags=["Frontend"])
    async def serve_spa(full_path: str):
        target = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(target):
            return FileResponse(target)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/", tags=["Root"])
    async def root():
        return {
            "app":     "ASTROCARE 3D",
            "version": "1.0.0",
            "status":  "operational",
            "docs":    "/docs",
            "message": "AI-Powered Astronaut Health Monitoring & 3D Digital Twin Platform",
        }
