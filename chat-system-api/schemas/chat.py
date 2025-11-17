from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

ChatRole = Literal["user", "assistant"]


class ChatMessageBase(BaseModel):
    role: ChatRole
    content: str = Field(..., min_length=1, max_length=4000)
    author_name: str | None = Field(default=None, max_length=64)

    @field_validator("author_name")
    @classmethod
    def normalize_author(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class ChatMessageCreate(ChatMessageBase):
    pass


class ChatMessageRead(ChatMessageBase):
    id: str
    created_at: datetime


class ChatSessionRead(BaseModel):
    session_id: str
    messages: list[ChatMessageRead]


class ChatSessionSummary(BaseModel):
    session_id: str
    message_count: int = Field(..., ge=1)
