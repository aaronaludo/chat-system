# fastapi-getting-started

## Getting Started

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

You can also boot the full stack (API, PostgreSQL, Redis) with Docker Compose:

```bash
docker compose up --build
```

## Configuration

The application relies on the following environment variables (see `.env` if you want to keep them locally):

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | SQLAlchemy/PostgreSQL connection string. |
| `REDIS_URL` | ❌ (defaults to `redis://localhost:6379/0`) | Chat session cache. |
| `CHAT_SESSION_TTL_SECONDS` | ❌ (defaults to 86400 seconds) | Expiration for chat sessions stored in Redis. |

## Chat endpoints

Chat conversations are cached in Redis so that multiple requests in the same session can share history.

- `GET /v1/chat/sessions` – list the chat sessions that currently contain messages. Response example:

  ```json
  [
    {
      "session_id": "my-session",
      "message_count": 3
    }
  ]
  ```

- `POST /v1/chat/sessions/{session_id}/messages` – append a message to the session and return the full conversation. Payload example:

  ```json
  {
    "role": "user",
    "content": "Hello there!"
  }
  ```

- `GET /v1/chat/sessions/{session_id}/messages` – retrieve the messages collected for a session.
- `DELETE /v1/chat/sessions/{session_id}` – clear a session and start over.

All endpoints share the same response model:

```json
{
  "session_id": "my-session",
  "messages": [
    {
      "id": "e18a5b7e-8357-4c0a-b5f0-0bc6631efaf5",
      "role": "user",
      "content": "Hello there!",
      "created_at": "2024-05-19T17:12:15.110263+00:00"
    }
  ]
}
```

### Real-time chat stream

For real-time updates, connect to `ws://<host>:<port>/v1/chat/sessions/{session_id}/ws`. When the websocket opens, the server pushes a `session.sync` event with the full session payload. Subsequent `message.created` events are emitted whenever a message is stored (via HTTP or another websocket client), and `session.cleared` fires if the session is reset.

Websocket clients can post new messages by sending the same payload used by the HTTP `POST` endpoint, e.g.:

```json
{
  "role": "user",
  "content": "Hello there!"
}
```
