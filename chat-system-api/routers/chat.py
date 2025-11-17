from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from redis.exceptions import RedisError
from pydantic import ValidationError

from schemas import ChatMessageCreate, ChatSessionRead, ChatSessionSummary
from services.chat import ChatService, get_chat_service
from services.chat_connections import ChatConnectionManager, get_chat_connection_manager

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/sessions", response_model=list[ChatSessionSummary])
async def list_sessions_with_messages(
    chat_service: ChatService = Depends(get_chat_service),
) -> list[ChatSessionSummary]:
    try:
        sessions = await asyncio.to_thread(chat_service.list_active_sessions)
    except RedisError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chat storage backend is unavailable. Please try again later.",
        ) from exc
    return sessions


@router.get("/sessions/{session_id}/messages", response_model=ChatSessionRead)
async def get_session_messages(
    session_id: str,
    chat_service: ChatService = Depends(get_chat_service),
) -> ChatSessionRead:
    try:
        messages = await asyncio.to_thread(chat_service.list_messages, session_id)
    except RedisError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chat storage backend is unavailable. Please try again later.",
        ) from exc
    return ChatSessionRead(session_id=session_id, messages=messages)


@router.post(
    "/sessions/{session_id}/messages",
    response_model=ChatSessionRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_session_message(
    session_id: str,
    payload: ChatMessageCreate,
    chat_service: ChatService = Depends(get_chat_service),
    connection_manager: ChatConnectionManager = Depends(get_chat_connection_manager),
) -> ChatSessionRead:
    try:
        message = await asyncio.to_thread(chat_service.add_message, session_id, payload)
        messages = await asyncio.to_thread(chat_service.list_messages, session_id)
    except RedisError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chat storage backend is unavailable. Please try again later.",
        ) from exc
    await connection_manager.broadcast_new_message(session_id, message)
    return ChatSessionRead(session_id=session_id, messages=messages)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    chat_service: ChatService = Depends(get_chat_service),
    connection_manager: ChatConnectionManager = Depends(get_chat_connection_manager),
) -> None:
    try:
        await asyncio.to_thread(chat_service.clear_session, session_id)
    except RedisError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chat storage backend is unavailable. Please try again later.",
        ) from exc
    await connection_manager.broadcast_session_cleared(session_id)


@router.websocket("/sessions/{session_id}/ws")
async def chat_session_ws(
    websocket: WebSocket,
    session_id: str,
    chat_service: ChatService = Depends(get_chat_service),
    connection_manager: ChatConnectionManager = Depends(get_chat_connection_manager),
) -> None:
    await connection_manager.connect(session_id, websocket)
    try:
        try:
            messages = await asyncio.to_thread(chat_service.list_messages, session_id)
        except RedisError:
            await websocket.close(
                code=status.WS_1011_INTERNAL_ERROR,
                reason="Chat storage backend is unavailable. Please try again later.",
            )
            return
        await connection_manager.send_session_snapshot(
            websocket, ChatSessionRead(session_id=session_id, messages=messages)
        )

        while True:
            data = await websocket.receive_json()
            try:
                payload = ChatMessageCreate(**data)
            except ValidationError as exc:
                await websocket.send_json(
                    {
                        "type": "error",
                        "detail": "Invalid message payload.",
                        "errors": exc.errors(),
                    }
                )
                continue
            try:
                message = await asyncio.to_thread(
                    chat_service.add_message, session_id, payload
                )
            except RedisError:
                await websocket.close(
                    code=status.WS_1011_INTERNAL_ERROR,
                    reason="Chat storage backend is unavailable. Please try again later.",
                )
                return
            await connection_manager.broadcast_new_message(session_id, message)
    except WebSocketDisconnect:
        pass
    finally:
        await connection_manager.disconnect(session_id, websocket)
