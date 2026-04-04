from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal
import uuid
import logging

from app.database import get_db
from app.models import ArbOpportunity, ArbTrade
from app.schemas import ExecuteArbRequest
from app.services.exchange_service import (
    get_exchange_prices,
    calculate_spread,
    calculate_profit_with_fee,
    find_best_opportunities,
    get_usd_to_zar,
    EXCHANGE_FEES,
)
from app.services.wallet_client import reserve_stake, release_stake

router = APIRouter(prefix="/api/arb", tags=["arbitrage"])
logger = logging.getLogger(__name__)


@router.get("/opportunities")
async def get_opportunities():
    usd_to_zar = await get_usd_to_zar()
    opportunities = await find_best_opportunities(usd_to_zar)
    return {
        "opportunities": opportunities,
        "usd_to_zar":    usd_to_zar,
        "count":         len(opportunities),
    }


@router.get("/exchanges")
async def get_exchanges():
    prices = await get_exchange_prices()
    usd_to_zar = await get_usd_to_zar()
    result = {}
    for exchange, symbols in prices.items():
        result[exchange] = {
            symbol: {
                "usd": price,
                "zar": round(price * usd_to_zar, 2),
            }
            for symbol, price in symbols.items()
        }
    return result


@router.post("/execute")
async def execute_arb(
    data: ExecuteArbRequest,
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    usd_to_zar = await get_usd_to_zar()
    prices = await get_exchange_prices()

    spread_data = calculate_spread(
        data.symbol,
        data.buy_exchange,
        data.sell_exchange,
        prices,
    )
    if not spread_data:
        raise HTTPException(status_code=400, detail="Could not calculate spread")
    if spread_data["spread"] <= 0:
        raise HTTPException(status_code=400, detail="No profitable spread available")

    amount_usd = float(data.amount) / usd_to_zar
    profit_data = calculate_profit_with_fee(spread_data, amount_usd, usd_to_zar)

    if profit_data["net_profit_after_fee_usd"] <= 0:
        raise HTTPException(status_code=400, detail="Profit after fees is zero or negative")

    reservation_ref = str(uuid.uuid4())
    await reserve_stake(x_user_id, data.amount, reservation_ref)

    try:
        pnl_after_fee = profit_data["net_profit_after_fee_zar"]
        success = await release_stake(x_user_id, data.amount, reservation_ref, Decimal(str(pnl_after_fee)))
        if not success:
            raise HTTPException(status_code=502, detail="Wallet release failed")

        trade = ArbTrade(
            user_id        = uuid.UUID(x_user_id),
            opportunity_id = uuid.UUID(data.opportunity_id) if data.opportunity_id else None,
            symbol         = data.symbol,
            buy_exchange   = data.buy_exchange,
            sell_exchange  = data.sell_exchange,
            amount         = data.amount,
            coin_quantity  = Decimal(str(profit_data["coin_quantity"])),
            buy_price      = Decimal(str(spread_data["buy_price"])),
            sell_price     = Decimal(str(spread_data["sell_price"])),
            spread         = Decimal(str(spread_data["spread"])),
            fees           = Decimal(str(profit_data["fees_zar"])),
            actual_profit  = Decimal(str(pnl_after_fee)),
            platform_fee   = Decimal(str(profit_data["platform_fee_zar"])),
            status         = "EXECUTED",
        )
        db.add(trade)
        await db.commit()
        await db.refresh(trade)

        return {
            "id":             str(trade.id),
            "symbol":         trade.symbol,
            "buy_exchange":   trade.buy_exchange,
            "sell_exchange":  trade.sell_exchange,
            "amount":         float(trade.amount),
            "coin_quantity":  float(trade.coin_quantity),
            "buy_price":      float(trade.buy_price),
            "sell_price":     float(trade.sell_price),
            "spread":         float(trade.spread),
            "exchange_fees":  float(trade.fees),
            "platform_fee":   float(trade.platform_fee),
            "actual_profit":  float(trade.actual_profit),
            "status":         trade.status,
            "created_at":     trade.created_at.isoformat(),
        }

    except Exception as e:
        logger.error(f"Arbitrage execution failed: {e}")
        await release_stake(x_user_id, data.amount, reservation_ref, Decimal("0"))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_arb_history(
    x_user_id: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ArbTrade)
        .where(ArbTrade.user_id == uuid.UUID(x_user_id))
        .order_by(ArbTrade.created_at.desc())
        .limit(50)
    )
    trades = result.scalars().all()
    return [
        {
            "id":            str(t.id),
            "symbol":        t.symbol,
            "buy_exchange":  t.buy_exchange,
            "sell_exchange": t.sell_exchange,
            "amount":        float(t.amount),
            "coin_quantity": float(t.coin_quantity),
            "buy_price":     float(t.buy_price),
            "sell_price":    float(t.sell_price),
            "spread":        float(t.spread),
            "exchange_fees": float(t.fees),
            "platform_fee":  float(t.platform_fee) if t.platform_fee else 0,
            "actual_profit": float(t.actual_profit),
            "status":        t.status,
            "created_at":    t.created_at.isoformat(),
        }
        for t in trades
    ]


@router.get("/order-types")
async def get_order_types():
    return {
        "market": {
            "description": "Execute immediately at current market prices",
            "execution_time": "Instant",
            "risk": "Low - price may move during execution"
        },
        "limit": {
            "description": "Execute only when buy exchange price reaches target",
            "execution_time": "Variable - up to expiry time",
            "risk": "Medium - may not execute if target not reached"
        }
    }


@router.post("/estimate-profit")
async def estimate_profit(
    data: dict,
    db: AsyncSession = Depends(get_db),
):
    """
    Estimate profit for a potential arbitrage trade without executing.
    """
    symbol = data.get("symbol")
    buy_exchange = data.get("buy_exchange")
    sell_exchange = data.get("sell_exchange")
    amount_zar = Decimal(str(data.get("amount", 100)))
    
    usd_to_zar = await get_usd_to_zar()
    prices = await get_exchange_prices()
    
    spread_data = calculate_spread(symbol, buy_exchange, sell_exchange, prices)
    
    if not spread_data:
        raise HTTPException(status_code=400, detail="Could not calculate spread")
    
    amount_usd = float(amount_zar) / usd_to_zar
    profit_data = calculate_profit_with_fee(spread_data, amount_usd, usd_to_zar)
    
    gross_profit_zar = profit_data["net_profit_after_fee_zar"] + profit_data["fees_zar"] + profit_data["platform_fee_zar"]
    
    return {
        "symbol": symbol,
        "buy_exchange": buy_exchange,
        "sell_exchange": sell_exchange,
        "buy_price": spread_data["buy_price"],
        "sell_price": spread_data["sell_price"],
        "spread": spread_data["spread"],
        "spread_pct": spread_data["spread_pct"],
        "amount_zar": float(amount_zar),
        "amount_usd": round(amount_usd, 2),
        "coin_quantity": profit_data["coin_quantity"],
        "gross_profit_zar": round(gross_profit_zar, 2),
        "exchange_fees_zar": profit_data["fees_zar"],
        "platform_fee_zar": profit_data["platform_fee_zar"],
        "total_fees_zar": profit_data["fees_zar"] + profit_data["platform_fee_zar"],
        "net_profit_zar": profit_data["net_profit_after_fee_zar"],
        "estimated_payout_zar": float(amount_zar) + profit_data["net_profit_after_fee_zar"],
        "fee_breakdown": {
            "exchange_fee_rate": float(EXCHANGE_FEES.get(buy_exchange, 0.001)) * 100,
            "platform_fee_rate": 10.0,
            "exchange_fees_zar": profit_data["fees_zar"],
            "platform_fee_zar": profit_data["platform_fee_zar"]
        }
    }
