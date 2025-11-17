from __future__ import annotations

import asyncio
from collections import defaultdict
from functools import lru_cache
from typing import Any

from fastapi import WebSocket

from schemas import ChatMessageRead, ChatSessionRead


class ChatConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, session_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[session_id].add(websocket)

    async def disconnect(self, session_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            connections = self._connections.get(session_id)
            if not connections:
                return
            connections.discard(websocket)
            if not connections:
                self._connections.pop(session_id, None)

    async def broadcast_new_message(self, session_id: str, message: ChatMessageRead) -> None:
        payload = {
            "type": "message.created",
            "session_id": session_id,
            "message": message.model_dump(mode="json"),
        }
        await self._broadcast(session_id, payload)

    async def broadcast_session_cleared(self, session_id: str) -> None:
        payload = {"type": "session.cleared", "session_id": session_id}
        await self._broadcast(session_id, payload)

    async def send_session_snapshot(self, websocket: WebSocket, session: ChatSessionRead) -> None:
        await websocket.send_json(
            {"type": "session.sync", "session": session.model_dump(mode="json")}
        )

    async def _broadcast(self, session_id: str, payload: dict[str, Any]) -> None:
        connections = await self._connections_for(session_id)
        for connection in connections:
            try:
                await connection.send_json(payload)
            except Exception:
                await self.disconnect(session_id, connection)

    async def _connections_for(self, session_id: str) -> list[WebSocket]:
        async with self._lock:
            return list(self._connections.get(session_id, set()))


@lru_cache(maxsize=1)
def get_chat_connection_manager() -> ChatConnectionManager:
    return ChatConnectionManager()


__all__ = ["ChatConnectionManager", "get_chat_connection_manager"]
