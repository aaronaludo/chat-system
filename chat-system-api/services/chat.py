from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from uuid import uuid4

from redis import Redis

from database import settings
from schemas import ChatMessageCreate, ChatMessageRead, ChatSessionSummary

from .redis import redis_client


LOG_DIR = Path(__file__).resolve().parent.parent / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / "chat.log"

chat_logger = logging.getLogger("chatsystem.chat")
if not chat_logger.handlers:
    handler = logging.FileHandler(LOG_FILE)
    formatter = logging.Formatter(
        "%(asctime)s - %(levelname)s - %(message)s - session=%(session)s - role=%(role)s - content=%(content)s"
    )
    handler.setFormatter(formatter)
    chat_logger.addHandler(handler)
    chat_logger.setLevel(logging.INFO)
    chat_logger.propagate = False


class ChatService:
    def __init__(self, client: Redis, session_ttl_seconds: int) -> None:
        self._client = client
        self._session_ttl_seconds = session_ttl_seconds
        self._logger = chat_logger

    def _session_key(self, session_id: str) -> str:
        return f"chat_session:{session_id}"

    def list_messages(self, session_id: str) -> list[ChatMessageRead]:
        raw_messages = self._client.lrange(self._session_key(session_id), 0, -1)
        return [ChatMessageRead(**json.loads(entry)) for entry in raw_messages]

    def add_message(self, session_id: str, payload: ChatMessageCreate) -> ChatMessageRead:
        message = ChatMessageRead(
            id=str(uuid4()),
            role=payload.role,
            content=payload.content,
            author_name=payload.author_name,
            created_at=datetime.now(timezone.utc),
        )
        serialized = json.dumps(message.model_dump(mode="json"))
        key = self._session_key(session_id)
        with self._client.pipeline() as pipe:
            pipe.rpush(key, serialized)
            pipe.expire(key, self._session_ttl_seconds)
            pipe.execute()
        self._logger.info(
            "message stored",
            extra={
                "session": session_id,
                "role": message.role,
                "content": message.content,
                "author": message.author_name or "",
            },
        )
        return message

    def clear_session(self, session_id: str) -> None:
        self._client.delete(self._session_key(session_id))

    def list_active_sessions(self) -> list[ChatSessionSummary]:
        sessions: list[ChatSessionSummary] = []
        prefix = self._session_key("")
        pattern = f"{prefix}*"
        for key in self._client.scan_iter(match=pattern):
            message_count = self._client.llen(key)
            if not message_count:
                continue
            session_id = key[len(prefix):]
            sessions.append(ChatSessionSummary(session_id=session_id, message_count=message_count))
        sessions.sort(key=lambda session: session.session_id)
        return sessions


@lru_cache(maxsize=1)
def get_chat_service() -> ChatService:
    return ChatService(client=redis_client, session_ttl_seconds=settings.chat_session_ttl_seconds)


__all__ = ["ChatService", "get_chat_service"]
