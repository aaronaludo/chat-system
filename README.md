# Chat System

Full-stack chat playground that ships a FastAPI backend (`chat-system-api`) and a Vite/React frontend (`chat-system-web`). This README focuses on getting both services running locally so you can iterate quickly.

## Repository layout
- `chat-system-api/` – FastAPI service with PostgreSQL + Redis, served through Uvicorn and Docker Compose.
- `chat-system-web/` – React 19 + TypeScript + Vite SPA that talks to the API via REST/WebSocket.

## Prerequisites
- **Docker Desktop + Docker Compose v2** – required for the API stack (FastAPI, PostgreSQL, Redis).
- **Node.js 20+ and npm 10+** – aligns with the versions tested with Vite 7.
- **Python 3.12** – only needed if you want to run the API without Docker (Docker image already uses 3.12).

---

## Backend – `chat-system-api`
The easiest way to develop is to let Docker Compose orchestrate the API, PostgreSQL (with pgvector) and Redis.

### 1. Start the Docker stack
```bash
cd chat-system-api
docker compose up --build
```
- `web` (FastAPI) listens on **http://localhost:8000** with interactive docs at `/docs`.
- `db` (PostgreSQL) is exposed on port **5434** in case you want to inspect data locally.
- `redis` listens on **localhost:6379**.

Compose keeps running in the terminal; press `Ctrl+C` to stop. Add `-d` if you prefer detached mode.

### 2. Configure environment variables (optional overrides)
Create a `.env` next to `docker-compose.yml` if you need to override defaults:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql+psycopg2://chatsystem_user:chatsystem_password@db:5432/chatsystem_db` | SQLAlchemy connection string used by the API. |
| `REDIS_URL` | `redis://redis:6379/0` | Chat session cache. |
| `CHAT_SESSION_TTL_SECONDS` | `86400` | Time-to-live for cached sessions. |
| `GEMINI_API_KEY` | _unset_ | Reserved for future AI integrations. |

### 3. (Alternative) Run the API without Docker
```bash
cd chat-system-api
python -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
export DATABASE_URL=...     # configure environment variables as needed
uvicorn main:app --reload
```

### 4. Verify the API
- REST docs: `http://localhost:8000/docs`
- Example session endpoints:
  - `GET /v1/chat/sessions` – list cached sessions
  - `POST /v1/chat/sessions/{session_id}/messages` – append a message
  - WebSocket stream: `ws://localhost:8000/v1/chat/sessions/{session_id}/ws`

---

## Frontend – `chat-system-web`
Runs on Vite with React 19 and consumes the backend REST + WebSocket endpoints.

### 1. Install dependencies
```bash
cd chat-system-web
npm install
```

### 2. Point the UI at the API
The app defaults to `http://localhost:8000/v1`, but you can override it by creating `.env`:

```bash
# chat-system-web/.env
VITE_API_URL=http://localhost:8000/v1
```

### 3. Start the development server
```bash
npm run dev
```
Vite will report a local URL (typically **http://localhost:5173**). Leave this process running while you develop.

### 4. Other useful scripts
- `npm run lint` – ESLint (TypeScript-aware).
- `npm run build` – Type check and produce a production bundle in `dist/`.
- `npm run preview` – Test the production build locally.

With `npm run dev` and `docker compose up` running simultaneously, the web client will hot-reload while hitting the local API.

---

## Troubleshooting
- **Ports already in use** – edit `docker-compose.yml` (API) or `vite.config.ts` (web) to change host ports.
- **Database inspection** – connect to `localhost:5434` with your preferred SQL client using the credentials from `docker-compose.yml`.
- **Resetting data** – stop Compose and remove the `postgres_data` volume (`docker compose down -v`) if you need a clean DB snapshot.
