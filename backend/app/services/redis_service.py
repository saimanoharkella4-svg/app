import json
import logging
from typing import Set, Dict, Any, Optional
from fastapi import WebSocket

logger = logging.getLogger("fst.redis_service")


class LivePubSubManager:
    """
    Manages active WebSocket connections and broadcasts live tracking
    updates. Works with Redis if available, with transparent in-memory
    fallback for standalone local environments.
    """

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.staff_live_cache: Dict[int, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast JSON message to all connected WebSocket clients."""
        if not self.active_connections:
            return

        payload = json.dumps(message)
        dead_connections = set()
        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning(f"Error sending message to websocket client: {e}")
                dead_connections.add(connection)

        for dead in dead_connections:
            self.active_connections.discard(dead)

    def update_staff_cache(self, staff_id: int, data: Dict[str, Any]):
        """Update live memory cache for staff."""
        if staff_id not in self.staff_live_cache:
            self.staff_live_cache[staff_id] = {}
        self.staff_live_cache[staff_id].update(data)

    def get_staff_cache(self, staff_id: int) -> Optional[Dict[str, Any]]:
        return self.staff_live_cache.get(staff_id)

    def get_all_active_cache(self) -> Dict[int, Dict[str, Any]]:
        return self.staff_live_cache


# Global singleton instance
pubsub_manager = LivePubSubManager()
