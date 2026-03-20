from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from decimal import Decimal
import uuid
import httpx
import os

from app.database import get_db
from app.models import TraderStats, Follow, CopyTrade
from app.schemas import UpdateTraderStatsRequest, CopyTradeRequest

router = APIRouter(tags=["follow"])

WALLET_SERVICE = os.getenv("WALLET_SERVICE_URL", "http://wallet-service:8000")

# ── Seed demo traders if leaderboard is empty ─────────────────────────────────

DEMO_TRADERS = [
    {
        "user_id":        "00000000-0000-0000-0000-000000000001",
        "display_name":   "TheboKing",
        "country":        "South Africa",
        "currency_symbol":"R",
        "total_trades":   142,
        "winning_trades": 134,
        "win_rate":       94.37,
        "total_pnl":      142000,
        "star_rating":    4.9,
        "follower_count": 8200,
    },
    {
        "user_id":        "00000000-0000-0000-0000-000000000002",
        "display_name":   "ForexFundi",
        "country":        "South Africa",
        "currency_symbol":"R",
        "total_trades":   98,
        "winning_trades": 86,
        "win_rate":       87.76,
        "total_pnl":      98000,
        "star_rating":    4.7,
        "follower_count": 5100,
    },
    {
        "user_id":        "00000000-0000-0000-0000-000000000003",
        "display_name":   "CryptoZA",
        "country":        "South Africa",
        "currency_symbol":"R",
        "total_trades":   76,
        "winning_trades": 62,
        "win_rate":       81.58,
        "total_pnl":      71000,
        "star_rating":    4.5,
        "follower_count": 3400,
    },
    {
        "user_id":        "00000000-0000-0000-0000-000000000004",
        "display_name":   "NaijaTrader",
        "country":        "Nigeria",
        "currency_symbol":"₦",
        "total_trades":   54,
        "winning_trades": 41,
        "win_rate":       75.93,
        "total_pnl":      54000,
        "star_rating":    4.2,
        "follower_count": 2100,
    },
    {
        "user_id":        "00000000-0000-0000-0000-000000000005",
        "display_name":   "BullRun254",
        "country":        "Kenya",
        "currency_symbol":"KSh",
        "total_trades":   43,
        "winning_trades": 31,
        "win_rate":       72.09,
        "total_pnl":      38000,
        "star_rating":    4.0,
        "follower_count": 1800,
    },
]


async def seed_demo_traders(db: AsyncSession):
    result = await db.execute(select(func.count()).select_from(TraderStats))
    count = result.scalar()
    if count == 0:
        for t in DEMO_TRADERS:
            data = {k: v for k, v in t.items()}
            data["user_id"] = uuid.UUID(data["user_id"])
            trader = TraderStats(**data)
            db.add(trader)
        await db.flush()
        await db.commit()


# ── Leaderboard ───────────────────────────────────────────────────────────────

@router.get("/api/leaderboard")
async def get_leaderboard(
    x_user_id: str = Header(...),
    period: str = Query("all_time", enum=["all_time", "this_week", "this_month"]),
    market: str = Query("all", enum=["all", "Forex", "Crypto", "Stocks"]),
    db: AsyncSession = Depends(get_db),
):
    await seed_demo_traders(db)

    result = await db.execute(
        select(TraderStats)
        .order_by(desc(TraderStats.total_pnl))
        .limit(50)
    )
    traders = result.scalars().all()

    # Check which traders the user follows
    follows_result = await db.execute(
        select(Follow.trader_id)
        .where(Follow.follower_id == uuid.UUID(x_user_id))
    )
    following_ids = {str(r) for r in follows_result.scalars().all()}

    leaderboard = []
    for i, t in enumerate(traders):
        leaderboard.append({
            "rank":           i + 1,
            "user_id":        str(t.user_id),
            "display_name":   t.display_name,
            "country":        t.country,
            "currency_symbol":t.currency_symbol,
            "total_trades":   t.total_trades,
            "winning_trades": t.winning_trades,
            "win_rate":       float(t.win_rate),
            "total_pnl":      float(t.total_pnl),
            "star_rating":    float(t.star_rating),
            "follower_count": t.follower_count,
            "is_following":   str(t.user_id) in following_ids,
            "is_live":        t.is_live,
            "live_symbol":    t.live_symbol,
            "live_direction": t.live_direction,
        })

    return leaderboard


# ── Follow / Unfollow ─────────────────────────────────────────────────────────

@router.post("/api/follow/{trader_id}")
async def follow_trader(
    trader_id: str,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    if trader_id == x_user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    # Check already following
    result = await db.execute(
        select(Follow)
        .where(Follow.follower_id == uuid.UUID(x_user_id))
        .where(Follow.trader_id == uuid.UUID(trader_id))
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already following")

    follow = Follow(
        follower_id = uuid.UUID(x_user_id),
        trader_id   = uuid.UUID(trader_id),
    )
    db.add(follow)

    # Increment follower count
    trader = await db.execute(
        select(TraderStats).where(TraderStats.user_id == uuid.UUID(trader_id))
    )
    trader = trader.scalar_one_or_none()
    if trader:
        trader.follower_count += 1

    await db.commit()
    return {"message": "Now following", "trader_id": trader_id}


@router.delete("/api/follow/{trader_id}")
async def unfollow_trader(
    trader_id: str,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Follow)
        .where(Follow.follower_id == uuid.UUID(x_user_id))
        .where(Follow.trader_id == uuid.UUID(trader_id))
    )
    follow = result.scalar_one_or_none()
    if not follow:
        raise HTTPException(status_code=404, detail="Not following this trader")

    await db.delete(follow)

    # Decrement follower count
    trader = await db.execute(
        select(TraderStats).where(TraderStats.user_id == uuid.UUID(trader_id))
    )
    trader = trader.scalar_one_or_none()
    if trader and trader.follower_count > 0:
        trader.follower_count -= 1

    await db.commit()
    return {"message": "Unfollowed", "trader_id": trader_id}


@router.get("/api/following")
async def get_following(
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Follow)
        .where(Follow.follower_id == uuid.UUID(x_user_id))
        .order_by(Follow.created_at.desc())
    )
    follows = result.scalars().all()

    traders = []
    for f in follows:
        trader_result = await db.execute(
            select(TraderStats).where(TraderStats.user_id == f.trader_id)
        )
        trader = trader_result.scalar_one_or_none()
        if trader:
            traders.append({
                "user_id":        str(trader.user_id),
                "display_name":   trader.display_name,
                "country":        trader.country,
                "win_rate":       float(trader.win_rate),
                "total_pnl":      float(trader.total_pnl),
                "star_rating":    float(trader.star_rating),
                "follower_count": trader.follower_count,
                "is_live":        trader.is_live,
                "followed_at":    f.created_at.isoformat(),
            })

    return traders


# ── Copy Trading ──────────────────────────────────────────────────────────────

@router.post("/api/copy")
async def copy_trade(
    data: CopyTradeRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    # Check following the trader
    result = await db.execute(
        select(Follow)
        .where(Follow.follower_id == uuid.UUID(x_user_id))
        .where(Follow.trader_id == uuid.UUID(data.trader_id))
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="You must follow this trader to copy their trades")

    copy = CopyTrade(
        follower_id        = uuid.UUID(x_user_id),
        trader_id          = uuid.UUID(data.trader_id),
        original_trade_id  = uuid.UUID(data.original_trade_id),
        symbol             = data.symbol,
        direction          = data.direction,
        lot_size           = data.lot_size,
        volume             = data.volume,
        commission_rate    = Decimal("0.05"),
        status             = "ACTIVE",
    )
    db.add(copy)
    await db.commit()
    await db.refresh(copy)

    return {
        "id":               str(copy.id),
        "trader_id":        str(copy.trader_id),
        "symbol":           copy.symbol,
        "direction":        copy.direction,
        "lot_size":         copy.lot_size,
        "volume":           copy.volume,
        "commission_rate":  float(copy.commission_rate),
        "status":           copy.status,
        "created_at":       copy.created_at.isoformat(),
    }


@router.get("/api/copy/active")
async def get_active_copies(
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CopyTrade)
        .where(CopyTrade.follower_id == uuid.UUID(x_user_id))
        .where(CopyTrade.status == "ACTIVE")
        .order_by(CopyTrade.created_at.desc())
    )
    copies = result.scalars().all()
    return [
        {
            "id":              str(c.id),
            "trader_id":       str(c.trader_id),
            "symbol":          c.symbol,
            "direction":       c.direction,
            "lot_size":        c.lot_size,
            "volume":          c.volume,
            "commission_rate": float(c.commission_rate),
            "status":          c.status,
            "created_at":      c.created_at.isoformat(),
        }
        for c in copies
    ]


# ── Trader stats update (called by trading service) ───────────────────────────

@router.put("/api/leaderboard/{user_id}/stats")
async def update_trader_stats(
    user_id: str,
    data: UpdateTraderStatsRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TraderStats).where(TraderStats.user_id == uuid.UUID(user_id))
    )
    stats = result.scalar_one_or_none()

    if not stats:
        stats = TraderStats(user_id=uuid.UUID(user_id))
        db.add(stats)

    if data.display_name   is not None: stats.display_name   = data.display_name
    if data.country        is not None: stats.country        = data.country
    if data.total_trades   is not None: stats.total_trades   = data.total_trades
    if data.winning_trades is not None:
        stats.winning_trades = data.winning_trades
        if stats.total_trades > 0:
            stats.win_rate = round(
                (data.winning_trades / stats.total_trades) * 100, 2
            )
    if data.total_pnl      is not None: stats.total_pnl      = data.total_pnl
    if data.is_live        is not None: stats.is_live        = data.is_live
    if data.live_symbol    is not None: stats.live_symbol    = data.live_symbol
    if data.live_direction is not None: stats.live_direction = data.live_direction
    if data.live_pnl       is not None: stats.live_pnl       = data.live_pnl

    await db.commit()
    return {"message": "Stats updated"}