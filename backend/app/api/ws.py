import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.services.redis_service import pubsub_manager
from app.core.security import decode_token

logger = logging.getLogger("fst.websocket")
router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/admin")
async def websocket_admin_endpoint(websocket: WebSocket, token: str = Query(None)):
    """
    WebSocket channel for live dashboard updates (staff markers, status, duty transitions).
    """
    # Accept connection and register with live manager
    await pubsub_manager.connect(websocket)
    try:
        # Send current live state snapshot immediately upon connection
        current_cache = pubsub_manager.get_all_active_cache()
        await websocket.send_json({
            "type": "SNAPSHOT",
            "data": list(current_cache.values())
        })

        while True:
            # Keep listening for client pings or filters
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pubsub_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket connection error: {e}")
        pubsub_manager.disconnect(websocket)
