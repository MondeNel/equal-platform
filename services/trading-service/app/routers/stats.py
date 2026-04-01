from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.database import get_db
from app.models import PlayerStats
from app.schemas import PlayerStatsResponse

router = APIRouter(prefix="/api/stats", tags=["stats"])

@router.get("/", response_model=PlayerStatsResponse)
async def get_player_stats(
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PlayerStats).where(PlayerStats.user_id == uuid.UUID(x_user_id))
    )
    stats = result.scalar_one_or_none()
    if not stats:
        return PlayerStatsResponse(
            win_streak=0,
            max_streak=0,
            total_wins=0,
            total_losses=0,
            total_bets=0
        )
    return PlayerStatsResponse(
        win_streak=stats.win_streak,
        max_streak=stats.max_streak,
        total_wins=stats.total_wins,
        total_losses=stats.total_losses,
        total_bets=stats.total_bets
    )
