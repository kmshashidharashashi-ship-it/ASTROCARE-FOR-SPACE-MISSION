"""
ASTRACARE – WebSocket Connection Manager.
Broadcasts live telemetry packets, AI anomaly detections, and emergency mission alerts.
"""

from __future__ import annotations

import json
import logging
from typing import List
from fastapi import WebSocket

logger = logging.getLogger("astracare.websocket")


class ConnectionManager:
    def __init__(self) -> None:
        self.telemetry_sockets: List[WebSocket] = []
        self.alert_sockets: List[WebSocket] = []

    async def connect_telemetry(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.telemetry_sockets.append(websocket)
        logger.info(f"Telemetry WS client connected. Total: {len(self.telemetry_sockets)}")

    def disconnect_telemetry(self, websocket: WebSocket) -> None:
        if websocket in self.telemetry_sockets:
            self.telemetry_sockets.remove(websocket)
            logger.info(f"Telemetry WS client disconnected. Total: {len(self.telemetry_sockets)}")

    async def broadcast_telemetry(self, data: dict) -> None:
        payload = json.dumps(data)
        stale = []
        for socket in self.telemetry_sockets:
            try:
                await socket.send_text(payload)
            except Exception:
                stale.append(socket)
        for s in stale:
            self.disconnect_telemetry(s)

    async def connect_alerts(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.alert_sockets.append(websocket)
        logger.info(f"Alert WS client connected. Total: {len(self.alert_sockets)}")

    def disconnect_alerts(self, websocket: WebSocket) -> None:
        if websocket in self.alert_sockets:
            self.alert_sockets.remove(websocket)
            logger.info(f"Alert WS client disconnected. Total: {len(self.alert_sockets)}")

    async def broadcast_alert(self, data: dict) -> None:
        payload = json.dumps(data)
        stale = []
        for socket in self.alert_sockets:
            try:
                await socket.send_text(payload)
            except Exception:
                stale.append(socket)
        for s in stale:
            self.disconnect_alerts(s)


manager = ConnectionManager()
