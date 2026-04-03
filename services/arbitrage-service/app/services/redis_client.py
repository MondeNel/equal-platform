import json
import redis.asyncio as redis
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
redis_client = None


async def get_redis():
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    return redis_client


async def cache_get(key: str):
    r = await get_redis()
    val = await r.get(key)
    if val:
        try:
            return json.loads(val)
        except:
            return val
    return None


async def cache_set(key: str, value, ttl: int = 10):
    r = await get_redis()
    await r.set(key, json.dumps(value), ex=ttl)
