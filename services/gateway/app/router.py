from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import Response
import httpx
import os
from jose import jwt, JWTError

router = APIRouter()

SECRET_KEY = os.getenv("GATEWAY_SECRET_KEY", "change-me")
ALGORITHM  = "HS256"

SERVICES = {
    "auth":     os.getenv("AUTH_SERVICE_URL",     "http://auth-service:8000"),
    "wallet":   os.getenv("WALLET_SERVICE_URL",   "http://wallet-service:8000"),
    "trading":  os.getenv("TRADING_SERVICE_URL",  "http://trading-service:8000"),
    "arb":      os.getenv("ARB_SERVICE_URL",      "http://arb-service:8000"),
    "follow":   os.getenv("FOLLOW_SERVICE_URL",   "http://follow-service:8000"),
    "orbitbet": os.getenv("ORBITBET_SERVICE_URL", "http://orbitbet-service:8000"),
}

PUBLIC_ROUTES = [
    "/api/auth/register",
    "/api/auth/login",
    "/health",
]

def get_service_for_path(path: str) -> str:
    if path.startswith("/api/auth"):
        return SERVICES["auth"]
    if path.startswith("/api/wallet"):
        return SERVICES["wallet"]
    if path.startswith("/api/prices") or \
       path.startswith("/api/orders") or \
       path.startswith("/api/trades") or \
       path.startswith("/api/peter"):
        return SERVICES["trading"]
    if path.startswith("/api/arb"):
        return SERVICES["arb"]
    if path.startswith("/api/leaderboard") or \
       path.startswith("/api/follow") or \
       path.startswith("/api/copy"):
        return SERVICES["follow"]
    if path.startswith("/api/bet"):
        return SERVICES["orbitbet"]
    raise HTTPException(status_code=404, detail="Route not found")


def extract_user_id(token: str) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.api_route(
    "/{full_path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH"]
)
async def proxy(request: Request, full_path: str):
    # Reconstruct full path
    path = "/" + full_path

    # Check if public
    is_public = any(path.startswith(pub) for pub in PUBLIC_ROUTES)

    headers = dict(request.headers)
    headers.pop("host", None)

    # Validate JWT for protected routes
    if not is_public:
        auth_header = request.headers.get("authorization", "")
        if not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Not authenticated")
        token = auth_header.split(" ")[1]
        user_id = extract_user_id(token)
        headers["x-user-id"] = user_id

    # Get target service
    service_url = get_service_for_path(path)
    target_url  = f"{service_url}{path}"

    # Add query params
    if request.query_params:
        target_url += f"?{request.query_params}"

    body = await request.body()

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.request(
            method  = request.method,
            url     = target_url,
            headers = headers,
            content = body,
        )

    return Response(
        content    = response.content,
        status_code= response.status_code,
        headers    = dict(response.headers),
        media_type = response.headers.get("content-type"),
    )