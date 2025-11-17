from __future__ import annotations

from functools import lru_cache

from redis import Redis

from database import settings


def _create_client() -> Redis:
    return Redis.from_url(
        settings.redis_url,
        decode_responses=True,
        socket_timeout=5,
        socket_connect_timeout=5,
    )


@lru_cache(maxsize=1)
def get_redis_client() -> Redis:
    return _create_client()


redis_client = get_redis_client()

__all__ = ["get_redis_client", "redis_client"]
