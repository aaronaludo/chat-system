from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = Field(..., env="DATABASE_URL")
    gemini_api_key: str | None = Field(default=None, env="GEMINI_API_KEY")
    redis_url: str = Field("redis://localhost:6379/0", env="REDIS_URL")
    chat_session_ttl_seconds: int = Field(default=60 * 60 * 24, env="CHAT_SESSION_TTL_SECONDS")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
