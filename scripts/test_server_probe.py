import asyncio
import os, sys
backend_path = r"C:\Users\dell\.gemini\antigravity\scratch\ASTRACARE\backend"
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

import httpx
from app.main import app

async def run_probe():
    from app.database.init_db import init_db
    init_db()

    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://testserver") as client:
        # 1. Root / Frontend SPA
        r_root = await client.get("/")
        print("PROBE [/]:", r_root.status_code, "HTML" if "html" in r_root.headers.get("content-type", "") else "OK")

        # 2. Health check
        r_health = await client.get("/health")
        print("PROBE [/health]:", r_health.status_code, r_health.json())

        # 3. Demo status
        r_demo = await client.get("/api/demo/status")
        print("PROBE [/api/demo/status]:", r_demo.status_code, "step:", r_demo.json().get("current_step"))

        # 4. Login
        r_login = await client.post("/api/auth/login", json={
            "email": "commander@astrocare.space",
            "password": "MissionCmd2026!",
        })
        print("PROBE [/api/auth/login]:", r_login.status_code, "User:", r_login.json().get("user", {}).get("email"))
        token = r_login.json().get("access_token")

        # 5. Auth Me
        r_me = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        print("PROBE [/api/auth/me]:", r_me.status_code, "Role:", r_me.json().get("role"))

        # 6. Radiation
        r_rad = await client.get("/api/radiation/AST-001")
        print("PROBE [/api/radiation/AST-001]:", r_rad.status_code, "Rate:", r_rad.json().get("latest_rate_usv_h"), "uSv/h")

        # 7. Environment
        r_env = await client.get("/api/environment/latest")
        print("PROBE [/api/environment/latest]:", r_env.status_code, "O2:", r_env.json().get("cabin_oxygen_pct"), "%")

        # 8. NASA Datasets
        r_nasa = await client.get("/api/nasa/datasets")
        print("PROBE [/api/nasa/datasets]:", r_nasa.status_code, "Count:", r_nasa.json().get("total"))

        # 9. Trigger Demo Abnormal
        r_abnormal = await client.post("/api/demo/trigger-abnormal?astronaut_id=AST-001&scenario=cardiovascular_tachycardia")
        print("PROBE [/api/demo/trigger-abnormal]:", r_abnormal.status_code, "Alert:", r_abnormal.json().get("event", {}).get("risk_category"))

if __name__ == "__main__":
    import os, sys
    backend_path = r"C:\Users\dell\.gemini\antigravity\scratch\ASTRACARE\backend"
    if backend_path not in sys.path:
        sys.path.insert(0, backend_path)
    asyncio.run(run_probe())
