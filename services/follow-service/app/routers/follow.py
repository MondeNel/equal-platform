from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from decimal import Decimal
import uuid
from datetime import datetime, timedelta, date
import random
import os

from app.database import get_db
from app.models import TraderStats, Follow, CopyTrade, TradeNotification, UserCopyStats
from app.schemas import (
    UpdateTraderStatsRequest, CopyTradeRequest, SubscribeRequest,
    CopyLimitResponse, CloseCopyTradeRequest, TradeNotificationRequest,
    TradeNotificationResponse
)
from app.services.wallet_client import debit_wallet, credit_wallet, check_balance

router = APIRouter(tags=["follow"])

MIN_FREE_COPIES = int(os.getenv("MIN_FREE_COPIES", 1))
MAX_FREE_COPIES = int(os.getenv("MAX_FREE_COPIES", 3))
SUBSCRIPTION_MONTHLY_PRICE = Decimal(os.getenv("SUBSCRIPTION_MONTHLY_PRICE", "99"))
SUBSCRIPTION_YEARLY_PRICE = Decimal(os.getenv("SUBSCRIPTION_YEARLY_PRICE", "999"))

DEMO_TRADERS = [
    {"user_id": "00000000-0000-0000-0000-000000000001", "display_name": "TheboKing", "country": "South Africa", "currency_symbol": "R", "total_trades": 142, "winning_trades": 134, "win_rate": 94.37, "total_pnl": 142000, "star_rating": 4.9, "follower_count": 8200},
    {"user_id": "00000000-0000-0000-0000-000000000002", "display_name": "ForexFundi", "country": "South Africa", "currency_symbol": "R", "total_trades": 98, "winning_trades": 86, "win_rate": 87.76, "total_pnl": 98000, "star_rating": 4.7, "follower_count": 5100},
    {"user_id": "00000000-0000-0000-0000-000000000003", "display_name": "CryptoZA", "country": "South Africa", "currency_symbol": "R", "total_trades": 76, "winning_trades": 62, "win_rate": 81.58, "total_pnl": 71000, "star_rating": 4.5, "follower_count": 3400},
    {"user_id": "00000000-0000-0000-0000-000000000004", "display_name": "NaijaTrader", "country": "Nigeria", "currency_symbol": "₦", "total_trades": 54, "winning_trades": 41, "win_rate": 75.93, "total_pnl": 54000, "star_rating": 4.2, "follower_count": 2100},
    {"user_id": "00000000-0000-0000-0000-000000000005", "display_name": "BullRun254", "country": "Kenya", "currency_symbol": "KSh", "total_trades": 43, "winning_trades": 31, "win_rate": 72.09, "total_pnl": 38000, "star_rating": 4.0, "follower_count": 1800},
]

async def seed_demo_traders(db: AsyncSession):
    result = await db.execute(select(func.count()).select_from(TraderStats))
    if result.scalar() == 0:
        for t in DEMO_TRADERS:
            data = {k: v for k, v in t.items()}
            data["user_id"] = uuid.UUID(data["user_id"])
            db.add(TraderStats(**data))
        await db.commit()


async def get_or_create_copy_stats(db: AsyncSession, user_id: uuid.UUID) -> UserCopyStats:
    result = await db.execute(select(UserCopyStats).where(UserCopyStats.user_id == user_id))
    stats = result.scalar_one_or_none()
    today = date.today()
    if not stats:
        daily_limit = random.randint(MIN_FREE_COPIES, MAX_FREE_COPIES)
        stats = UserCopyStats(user_id=user_id, daily_free_limit=daily_limit, last_reset_date=today)
        db.add(stats)
        await db.flush()
    else:
        if stats.last_reset_date != today:
            stats.free_copies_used = 0
            stats.daily_free_limit = random.randint(MIN_FREE_COPIES, MAX_FREE_COPIES)
            stats.last_reset_date = today
            await db.flush()
    return stats


# ── Leaderboard (unchanged) ──────────────────────────────────────────────────
@router.get("/api/leaderboard")
async def get_leaderboard(
    x_user_id: str = Header(...),
    period: str = Query("all_time", enum=["all_time", "this_week", "this_month"]),
    market: str = Query("all", enum=["all", "Forex", "Crypto", "Stocks"]),
    db: AsyncSession = Depends(get_db),
):
    await seed_demo_traders(db)
    result = await db.execute(select(TraderStats).order_by(desc(TraderStats.total_pnl)).limit(50))
    traders = result.scalars().all()
    follows_result = await db.execute(select(Follow.trader_id).where(Follow.follower_id == uuid.UUID(x_user_id)))
    following_ids = {str(r) for r in follows_result.scalars().all()}
    leaderboard = []
    for i, t in enumerate(traders):
        leaderboard.append({
            "rank": i+1, "user_id": str(t.user_id), "display_name": t.display_name,
            "country": t.country, "currency_symbol": t.currency_symbol,
            "total_trades": t.total_trades, "winning_trades": t.winning_trades,
            "win_rate": float(t.win_rate), "total_pnl": float(t.total_pnl),
            "star_rating": float(t.star_rating), "follower_count": t.follower_count,
            "is_following": str(t.user_id) in following_ids,
            "is_live": t.is_live, "live_symbol": t.live_symbol, "live_direction": t.live_direction,
        })
    return leaderboard


# ── Follow / Unfollow (unchanged) ────────────────────────────────────────────
@router.post("/api/follow/{trader_id}")
async def follow_trader(trader_id: str, x_user_id: str = Header(...), db: AsyncSession = Depends(get_db)):
    if trader_id == x_user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    result = await db.execute(select(Follow).where(Follow.follower_id == uuid.UUID(x_user_id), Follow.trader_id == uuid.UUID(trader_id)))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already following")
    follow = Follow(follower_id=uuid.UUID(x_user_id), trader_id=uuid.UUID(trader_id))
    db.add(follow)
    trader = await db.execute(select(TraderStats).where(TraderStats.user_id == uuid.UUID(trader_id)))
    trader = trader.scalar_one_or_none()
    if trader:
        trader.follower_count += 1
    await db.commit()
    return {"message": "Now following", "trader_id": trader_id}

@router.delete("/api/follow/{trader_id}")
async def unfollow_trader(trader_id: str, x_user_id: str = Header(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Follow).where(Follow.follower_id == uuid.UUID(x_user_id), Follow.trader_id == uuid.UUID(trader_id)))
    follow = result.scalar_one_or_none()
    if not follow:
        raise HTTPException(status_code=404, detail="Not following this trader")
    await db.delete(follow)
    trader = await db.execute(select(TraderStats).where(TraderStats.user_id == uuid.UUID(trader_id)))
    trader = trader.scalar_one_or_none()
    if trader and trader.follower_count > 0:
        trader.follower_count -= 1
    await db.commit()
    return {"message": "Unfollowed", "trader_id": trader_id}

@router.get("/api/following")
async def get_following(x_user_id: str = Header(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Follow).where(Follow.follower_id == uuid.UUID(x_user_id)).order_by(Follow.created_at.desc()))
    follows = result.scalars().all()
    traders = []
    for f in follows:
        trader_result = await db.execute(select(TraderStats).where(TraderStats.user_id == f.trader_id))
        trader = trader_result.scalar_one_or_none()
        if trader:
            traders.append({
                "user_id": str(trader.user_id), "display_name": trader.display_name,
                "country": trader.country, "win_rate": float(trader.win_rate),
                "total_pnl": float(trader.total_pnl), "star_rating": float(trader.star_rating),
                "follower_count": trader.follower_count, "is_live": trader.is_live,
                "followed_at": f.created_at.isoformat(),
            })
    return traders


# ── Trade notification (no direction, only symbol) ──────────────────────────
@router.post("/api/trade/notify", response_model=TradeNotificationResponse)
async def notify_trade(
    data: TradeNotificationRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    trader_id = uuid.UUID(data.trader_id)
    if str(trader_id) != x_user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    notification = TradeNotification(
        trader_id=trader_id,
        symbol=data.symbol,
        original_trade_id=uuid.UUID(data.original_trade_id),
        expires_at=datetime.utcnow() + timedelta(hours=2)
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return TradeNotificationResponse(
        id=str(notification.id),
        trader_id=str(notification.trader_id),
        symbol=notification.symbol,
        original_trade_id=str(notification.original_trade_id),
        created_at=notification.created_at
    )


# ── Get notifications (blurred: only symbol) ─────────────────────────────────
@router.get("/api/notifications")
async def get_notifications(
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    user_id = uuid.UUID(x_user_id)
    follows_result = await db.execute(select(Follow.trader_id).where(Follow.follower_id == user_id))
    followed_trader_ids = [r for r in follows_result.scalars().all()]
    if not followed_trader_ids:
        return []
    result = await db.execute(
        select(TradeNotification)
        .where(TradeNotification.trader_id.in_(followed_trader_ids))
        .where(TradeNotification.expires_at > datetime.utcnow())
        .order_by(TradeNotification.created_at.desc())
        .limit(50)
    )
    notifications = result.scalars().all()
    return [
        {
            "id": str(n.id),
            "trader_id": str(n.trader_id),
            "symbol": n.symbol,
            "original_trade_id": str(n.original_trade_id),
            "created_at": n.created_at.isoformat(),
        }
        for n in notifications
    ]


# ── Copy limit check ────────────────────────────────────────────────────────
@router.get("/api/copy/limit", response_model=CopyLimitResponse)
async def check_copy_limit(x_user_id: str = Header(...), db: AsyncSession = Depends(get_db)):
    user_id = uuid.UUID(x_user_id)
    stats = await get_or_create_copy_stats(db, user_id)
    can_copy = stats.subscription_active or stats.free_copies_used < stats.daily_free_limit
    message = None
    if not can_copy:
        message = f"You have reached your daily limit of {stats.daily_free_limit} free copy trades. Subscribe to get unlimited copies."
    return CopyLimitResponse(
        can_copy=can_copy,
        free_copies_used=stats.free_copies_used,
        daily_free_limit=stats.daily_free_limit,
        subscription_active=stats.subscription_active,
        next_reset_date=stats.last_reset_date.isoformat() if not stats.subscription_active else None,
        message=message,
    )


# ── Subscribe ────────────────────────────────────────────────────────────────
@router.post("/api/subscribe")
async def subscribe(
    data: SubscribeRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    user_id = uuid.UUID(x_user_id)
    price = SUBSCRIPTION_MONTHLY_PRICE if data.plan == "monthly" else SUBSCRIPTION_YEARLY_PRICE
    if not await check_balance(x_user_id, price):
        raise HTTPException(status_code=400, detail="Insufficient balance")
    ref = f"SUB-{user_id}-{int(datetime.utcnow().timestamp())}"
    if not await debit_wallet(x_user_id, price, ref):
        raise HTTPException(status_code=502, detail="Payment failed")
    stats = await get_or_create_copy_stats(db, user_id)
    stats.subscription_active = True
    if data.plan == "monthly":
        stats.subscription_expires_at = datetime.utcnow() + timedelta(days=30)
    else:
        stats.subscription_expires_at = datetime.utcnow() + timedelta(days=365)
    await db.commit()
    return {"message": f"Subscription activated ({data.plan})", "expires_at": stats.subscription_expires_at.isoformat()}


# ── Copy trade execution (follower chooses lot size & volume; direction NOT provided) ──
@router.post("/api/copy")
async def copy_trade(
    data: CopyTradeRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    user_id = uuid.UUID(x_user_id)
    # Verify follower follows this trader
    result = await db.execute(select(Follow).where(Follow.follower_id == user_id, Follow.trader_id == uuid.UUID(data.trader_id)))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="You must follow this trader to copy their trades")
    # Check copy limits
    limit_response = await check_copy_limit(x_user_id, db)
    if not limit_response.can_copy:
        raise HTTPException(status_code=403, detail=limit_response.message)
    # Create copy trade record (direction will be set by trading app after fetching original trade)
    copy = CopyTrade(
        follower_id=user_id,
        trader_id=uuid.UUID(data.trader_id),
        original_trade_id=uuid.UUID(data.original_trade_id),
        symbol=data.symbol,
        direction="",   # placeholder, to be filled by trading app
        lot_size=data.lot_size,
        volume=data.volume,
        commission_rate=Decimal("0.10"),
        status="ACTIVE",
    )
    db.add(copy)
    stats = await get_or_create_copy_stats(db, user_id)
    if not stats.subscription_active:
        stats.free_copies_used += 1
    await db.commit()
    await db.refresh(copy)
    return {
        "id": str(copy.id),
        "trader_id": str(copy.trader_id),
        "symbol": copy.symbol,
        "lot_size": copy.lot_size,
        "volume": copy.volume,
        "commission_rate": float(copy.commission_rate),
        "status": copy.status,
        "created_at": copy.created_at.isoformat(),
    }


# ── Close copy trade (trading service calls this with follower's profit) ─────
@router.post("/api/copy/close")
async def close_copy_trade(
    data: CloseCopyTradeRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    copy_id = uuid.UUID(data.copy_trade_id)
    result = await db.execute(select(CopyTrade).where(CopyTrade.id == copy_id, CopyTrade.follower_id == uuid.UUID(x_user_id)))
    copy = result.scalar_one_or_none()
    if not copy:
        raise HTTPException(status_code=404, detail="Copy trade not found")
    if copy.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Trade already closed")
    profit = data.profit
    if profit > 0:
        copy.status = "CLOSED_WIN"
        commission = profit * copy.commission_rate
        copy.trader_commission = commission
        await credit_wallet(str(copy.trader_id), commission, f"COMM-{copy.id}")
    else:
        copy.status = "CLOSED_LOSS"
        copy.trader_commission = Decimal("0")
    copy.follower_profit = profit
    copy.closed_at = datetime.utcnow()
    await db.commit()
    return {
        "id": str(copy.id),
        "status": copy.status,
        "follower_profit": float(profit),
        "trader_commission": float(copy.trader_commission),
    }


# ── Get active copies for follower ───────────────────────────────────────────
@router.get("/api/copy/active")
async def get_active_copies(x_user_id: str = Header(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CopyTrade).where(CopyTrade.follower_id == uuid.UUID(x_user_id), CopyTrade.status == "ACTIVE")
        .order_by(CopyTrade.created_at.desc())
    )
    copies = result.scalars().all()
    return [
        {
            "id": str(c.id),
            "trader_id": str(c.trader_id),
            "symbol": c.symbol,
            "lot_size": c.lot_size,
            "volume": c.volume,
            "commission_rate": float(c.commission_rate),
            "status": c.status,
            "created_at": c.created_at.isoformat(),
        }
        for c in copies
    ]


# ── Update trader stats (called by trading service after trade close) ────────
@router.put("/api/leaderboard/{user_id}/stats")
async def update_trader_stats(
    user_id: str,
    data: UpdateTraderStatsRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(TraderStats).where(TraderStats.user_id == uuid.UUID(user_id)))
    stats = result.scalar_one_or_none()
    if not stats:
        stats = TraderStats(user_id=uuid.UUID(user_id))
        db.add(stats)
    if data.display_name is not None: stats.display_name = data.display_name
    if data.country is not None: stats.country = data.country
    if data.total_trades is not None: stats.total_trades = data.total_trades
    if data.winning_trades is not None:
        stats.winning_trades = data.winning_trades
        if stats.total_trades > 0:
            stats.win_rate = round((data.winning_trades / stats.total_trades) * 100, 2)
    if data.total_pnl is not None: stats.total_pnl = data.total_pnl
    if data.is_live is not None: stats.is_live = data.is_live
    if data.live_symbol is not None: stats.live_symbol = data.live_symbol
    if data.live_direction is not None: stats.live_direction = data.live_direction
    if data.live_pnl is not None: stats.live_pnl = data.live_pnl
    await db.commit()
    return {"message": "Stats updated"}
