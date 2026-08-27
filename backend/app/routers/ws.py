"""WebSocket router — real-time push channels for the frontend.

Three channels, matching the frontend's data contract:
  /ws/wells/{well_id}/telemetry   — streaming telemetry + inferred state, ~1-5s tick
  /ws/wells/{well_id}/interlocks  — push on any interlock status change
  /ws/wells/{well_id}/recommendations — push when new recommendation is created

All channels use the shared WebSocketManager for connection lifecycle.
Messages are JSON-encoded WellState, InterlockStatus[], or Recommendation objects.
"""
from __future__ import annotations

import asyncio
from typing import Dict, List
from uuid import UUID
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import structlog

logger = structlog.get_logger(__name__)
router = APIRouter(tags=["WebSocket"])

class WebSocketManager:
    def __init__(self):
        # channel_name -> list of websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = []
        self.active_connections[channel].append(websocket)
        logger.info("ws_connected", channel=channel)

    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self.active_connections:
            if websocket in self.active_connections[channel]:
                self.active_connections[channel].remove(websocket)
        logger.info("ws_disconnected", channel=channel)

    async def broadcast(self, message: dict, channel: str):
        if channel in self.active_connections:
            for connection in self.active_connections[channel]:
                try:
                    await connection.send_json(message)
                except RuntimeError:
                    self.disconnect(connection, channel)

manager = WebSocketManager()

@router.websocket("/ws/wells/{well_id}/telemetry")
async def ws_telemetry(websocket: WebSocket, well_id: UUID):
    channel = f"telemetry_{well_id}"
    await manager.connect(websocket, channel)
    try:
        # Send current state immediately
        await websocket.send_json({"type": "init", "state": "current_telemetry"})
        while True:
            # 30-second keepalive ping receive / handle client messages
            data = await asyncio.wait_for(websocket.receive_text(), timeout=35.0)
            if data == "ping":
                await websocket.send_text("pong")
    except asyncio.TimeoutError:
        logger.warning("ws_keepalive_timeout", channel=channel)
        manager.disconnect(websocket, channel)
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)
    except Exception as e:
        logger.error("ws_error", error=str(e), channel=channel)
        manager.disconnect(websocket, channel)

@router.websocket("/ws/wells/{well_id}/interlocks")
async def ws_interlocks(websocket: WebSocket, well_id: UUID):
    channel = f"interlocks_{well_id}"
    await manager.connect(websocket, channel)
    try:
        await websocket.send_json({"type": "init", "state": "current_interlocks"})
        while True:
            data = await asyncio.wait_for(websocket.receive_text(), timeout=35.0)
            if data == "ping":
                await websocket.send_text("pong")
    except (asyncio.TimeoutError, WebSocketDisconnect):
        manager.disconnect(websocket, channel)

@router.websocket("/ws/wells/{well_id}/recommendations")
async def ws_recommendations(websocket: WebSocket, well_id: UUID):
    channel = f"recommendations_{well_id}"
    await manager.connect(websocket, channel)
    try:
        await websocket.send_json({"type": "init", "state": "current_recommendations"})
        while True:
            data = await asyncio.wait_for(websocket.receive_text(), timeout=35.0)
            if data == "ping":
                await websocket.send_text("pong")
    except (asyncio.TimeoutError, WebSocketDisconnect):
        manager.disconnect(websocket, channel)
