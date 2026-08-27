from typing import Dict, Set, Any
from fastapi import WebSocket
import json
import structlog
from datetime import datetime

logger = structlog.get_logger(__name__)

class ConnectionManager:
    def __init__(self):
        # channel_name -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = set()
        self.active_connections[channel].add(websocket)
        logger.info(f"Client connected to {channel}")

    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self.active_connections:
            self.active_connections[channel].discard(websocket)
            if not self.active_connections[channel]:
                del self.active_connections[channel]
        logger.info(f"Client disconnected from {channel}")

    async def broadcast_to_channel(self, channel: str, message: Any):
        if channel in self.active_connections:
            # Custom JSON encoder for datetime
            def datetime_handler(x):
                if isinstance(x, datetime):
                    return x.isoformat()
                raise TypeError("Unknown type")
            
            message_text = json.dumps(message, default=datetime_handler)
            dead_connections = set()
            for connection in self.active_connections[channel]:
                try:
                    await connection.send_text(message_text)
                except Exception as e:
                    logger.error(f"Error sending message to client: {e}")
                    dead_connections.add(connection)
            
            for connection in dead_connections:
                self.disconnect(connection, channel)

manager = ConnectionManager()
