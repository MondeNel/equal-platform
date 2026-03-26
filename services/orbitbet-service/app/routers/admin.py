"""
Admin endpoints for OrbitBet service.
These should be protected by admin authentication in production.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Bet, PlayerStats, DailyBonus, MilestoneReward

router = APIRouter(prefix="/api/admin/bet", tags=["admin"])
logger = logging.getLogger(__name__)


@router.get("/stats")
async def get_admin_stats(
    db: AsyncSession = Depends(get_db)
):
    """
    Get admin statistics for OrbitBet.
    """
    try:
        # Total bets
        total_bets = await db.execute(select(func.count()).select_from(Bet))
        total_bets_count = total_bets.scalar()
        
        # Active bets
        active_bets = await db.execute(
            select(func.count()).where(Bet.status == "ACTIVE")
        )
        active_bets_count = active_bets.scalar()
        
        # Today's bets
        today = datetime.utcnow().date()
        today_bets = await db.execute(
            select(func.count()).where(func.date(Bet.created_at) == today)
        )
        today_bets_count = today_bets.scalar()
        
        # Total volume
        total_volume = await db.execute(
            select(func.sum(Bet.stake)).where(Bet.status.in_(["WON", "LOST"]))
        )
        total_volume_value = float(total_volume.scalar() or 0)
        
        # Total payouts
        total_payouts = await db.execute(
            select(func.sum(Bet.payout)).where(Bet.status == "WON")
        )
        total_payouts_value = float(total_payouts.scalar() or 0)
        
        # Unique players
        unique_players = await db.execute(
            select(func.count()).select_from(PlayerStats)
        )
        unique_players_count = unique_players.scalar()
        
        return {
            "total_bets": total_bets_count,
            "active_bets": active_bets_count,
            "today_bets": today_bets_count,
            "total_volume": total_volume_value,
            "total_payouts": total_payouts_value,
            "unique_players": unique_players_count,
            "house_edge_percent": ((total_volume_value - total_payouts_value) / total_volume_value * 100) if total_volume_value > 0 else 0
        }
        
    except Exception as e:
        logger.error(f"Admin stats error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/bets")
async def get_admin_bets(
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """
    Get recent bets for admin view.
    """
    try:
        bets = await db.execute(
            select(Bet)
            .order_by(Bet.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = []
        for bet in bets.scalars().all():
            result.append({
                "id": str(bet.id),
                "user_id": str(bet.user_id),
                "symbol": bet.symbol,
                "stake": float(bet.stake),
                "payout": float(bet.payout) if bet.payout else None,
                "status": bet.status,
                "round_1": bet.round_1,
                "round_2": bet.round_2,
                "round_3": bet.round_3,
                "created_at": bet.created_at.isoformat(),
                "resolved_at": bet.resolved_at.isoformat() if bet.resolved_at else None
            })
        return {"bets": result, "count": len(result)}
        
    except Exception as e:
        logger.error(f"Admin bets error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")