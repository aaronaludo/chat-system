from fastapi import APIRouter, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from database import get_db
from routers import chat_router


ALLOWED_ORIGINS = ["http://localhost:5173"]


API_VERSION_PREFIX = "/v1"

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_v1_router = APIRouter(prefix=API_VERSION_PREFIX)
api_v1_router.include_router(chat_router)

app.include_router(api_v1_router)


@api_v1_router.get("/")
def read_root():
    return {"message": "FastAPI is running", "version": API_VERSION_PREFIX}


@api_v1_router.get("/healthz")
def health_check(db=Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"status": "ok"}
