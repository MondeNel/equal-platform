from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional
import os

from app.database import get_db
from app.models import User
from app.schemas import RegisterRequest, UpdateProfileRequest, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET_KEY   = os.getenv("AUTH_SECRET_KEY", "change-me")
ALGORITHM    = "HS256"
TOKEN_EXPIRE = timedelta(days=30)



# ── Helpers ───────────────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def create_token(user_id: str) -> str:
    return jwt.encode(
        {"sub": user_id, "exp": datetime.utcnow() + TOKEN_EXPIRE},
        SECRET_KEY, algorithm=ALGORITHM
    )

def decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_user_by_id(user_id: str, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/register", status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check email not taken
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    user = User(
        email           = data.email.lower().strip(),
        hashed_password = hash_password(data.password),
        display_name    = data.display_name.strip(),
        country         = data.country,
        currency_code   = data.currency_code,
        currency_symbol = data.currency_symbol,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return {
        "id":              str(user.id),
        "email":           user.email,
        "display_name":    user.display_name,
        "country":         user.country,
        "currency_code":   user.currency_code,
        "currency_symbol": user.currency_symbol,
    }


@router.post("/login")
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == form.username.lower()))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    return {
        "access_token": create_token(str(user.id)),
        "token_type":   "bearer"
    }


@router.get("/me")
async def me(
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    user = await get_user_by_id(x_user_id, db)
    return {
        "id":              str(user.id),
        "email":           user.email,
        "display_name":    user.display_name,
        "country":         user.country,
        "currency_code":   user.currency_code,
        "currency_symbol": user.currency_symbol,
    }


@router.put("/me")
async def update_me(
    data: UpdateProfileRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    user = await get_user_by_id(x_user_id, db)

    if data.display_name is not None:
        user.display_name = data.display_name.strip()
    if data.country is not None:
        user.country = data.country
    if data.currency_code is not None:
        user.currency_code = data.currency_code
    if data.currency_symbol is not None:
        user.currency_symbol = data.currency_symbol

    await db.commit()
    await db.refresh(user)

    return {
        "id":              str(user.id),
        "email":           user.email,
        "display_name":    user.display_name,
        "country":         user.country,
        "currency_code":   user.currency_code,
        "currency_symbol": user.currency_symbol,
    }


@router.post("/verify")
async def verify_token(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Used internally by gateway to validate tokens"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.split(" ")[1]
    user_id = decode_token(token)
    user = await get_user_by_id(user_id, db)

    return {"user_id": str(user.id), "valid": True}