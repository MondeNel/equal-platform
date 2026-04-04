import asyncio
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, update
from app.database import AsyncSessionLocal
from app.models import LimitOrder, LimitOrderHistory, ArbTrade
from app.services.exchange_service import get_exchange_prices, calculate_spread, calculate_profit_with_fee, get_usd_to_zar
from app.services.wallet_client import reserve_stake, release_stake
from app.services.websocket_manager import manager
import logging

logger = logging.getLogger(__name__)

async def check_and_execute_limit_orders():
    """Background worker that checks pending limit orders and executes them when target spread is reached"""
    while True:
        try:
            async with AsyncSessionLocal() as db:
                now = datetime.now(timezone.utc)
                
                # Get all pending limit orders that haven't expired
                result = await db.execute(
                    select(LimitOrder)
                    .where(
                        and_(
                            LimitOrder.status == "PENDING",
                            LimitOrder.expires_at > now
                        )
                    )
                )
                orders = result.scalars().all()
                
                if orders:
                    # Get current market prices
                    prices = await get_exchange_prices()
                    usd_to_zar = await get_usd_to_zar()
                    
                    for order in orders:
                        # Calculate current spread
                        spread_data = calculate_spread(
                            order.symbol,
                            order.buy_exchange,
                            order.sell_exchange,
                            prices
                        )
                        
                        if spread_data and spread_data["spread_pct"] >= float(order.target_spread_pct):
                            # Execute the trade
                            amount_usd = float(order.amount) / usd_to_zar
                            profit_data = calculate_profit_with_fee(spread_data, amount_usd, usd_to_zar)
                            
                            if profit_data["net_profit_after_fee_usd"] > 0:
                                # Reserve stake
                                reservation_ref = str(uuid.uuid4())
                                try:
                                    await reserve_stake(str(order.user_id), order.amount, reservation_ref)
                                    
                                    # Calculate profit
                                    pnl = profit_data["net_profit_after_fee_zar"]
                                    
                                    # Release with profit
                                    success = await release_stake(str(order.user_id), order.amount, reservation_ref, Decimal(str(pnl)))
                                    
                                    if success:
                                        # Update order as executed
                                        order.status = "EXECUTED"
                                        order.executed_price = Decimal(str(spread_data["buy_price"]))
                                        order.executed_profit = Decimal(str(pnl))
                                        order.executed_at = now
                                        
                                        # Record in trade history
                                        trade = ArbTrade(
                                            user_id=order.user_id,
                                            symbol=order.symbol,
                                            buy_exchange=order.buy_exchange,
                                            sell_exchange=order.sell_exchange,
                                            amount=order.amount,
                                            coin_quantity=Decimal(str(profit_data["coin_quantity"])),
                                            buy_price=Decimal(str(spread_data["buy_price"])),
                                            sell_price=Decimal(str(spread_data["sell_price"])),
                                            spread=Decimal(str(spread_data["spread"])),
                                            fees=Decimal(str(profit_data["fees_zar"])),
                                            actual_profit=Decimal(str(pnl)),
                                            platform_fee=Decimal(str(profit_data["platform_fee_zar"])),
                                            status="EXECUTED"
                                        )
                                        db.add(trade)
                                        
                                        # Record in history
                                        history = LimitOrderHistory(
                                            order_id=order.id,
                                            user_id=order.user_id,
                                            symbol=order.symbol,
                                            buy_exchange=order.buy_exchange,
                                            sell_exchange=order.sell_exchange,
                                            amount=order.amount,
                                            target_spread_pct=order.target_spread_pct,
                                            executed_spread_pct=Decimal(str(spread_data["spread_pct"])),
                                            executed_price=order.executed_price,
                                            executed_profit=order.executed_profit,
                                            status="EXECUTED",
                                            created_at=order.created_at,
                                            executed_at=order.executed_at
                                        )
                                        db.add(history)
                                        
                                        await db.commit()
                                        
                                        # Send WebSocket notification
                                        await manager.send_personal_message({
                                            "type": "limit_order_executed",
                                            "order_id": str(order.id),
                                            "symbol": order.symbol,
                                            "amount": float(order.amount),
                                            "profit": float(pnl),
                                            "spread": spread_data["spread_pct"],
                                            "message": f"Limit order executed! Profit: ZAR {pnl:.2f}"
                                        }, str(order.user_id))
                                        
                                        logger.info(f"Limit order {order.id} executed for user {order.user_id} with profit {pnl}")
                                except Exception as e:
                                    logger.error(f"Failed to execute limit order {order.id}: {e}")
                                    await release_stake(str(order.user_id), order.amount, reservation_ref, Decimal("0"))
                
                # Also expire old orders
                result = await db.execute(
                    select(LimitOrder)
                    .where(
                        and_(
                            LimitOrder.status == "PENDING",
                            LimitOrder.expires_at <= now
                        )
                    )
                )
                expired_orders = result.scalars().all()
                
                for order in expired_orders:
                    order.status = "EXPIRED"
                    
                    # Record expired orders in history
                    history = LimitOrderHistory(
                        order_id=order.id,
                        user_id=order.user_id,
                        symbol=order.symbol,
                        buy_exchange=order.buy_exchange,
                        sell_exchange=order.sell_exchange,
                        amount=order.amount,
                        target_spread_pct=order.target_spread_pct,
                        status="EXPIRED",
                        created_at=order.created_at,
                        executed_at=None
                    )
                    db.add(history)
                    
                    # Send WebSocket notification
                    await manager.send_personal_message({
                        "type": "limit_order_expired",
                        "order_id": str(order.id),
                        "symbol": order.symbol,
                        "amount": float(order.amount),
                        "message": f"Limit order expired. Target spread of {order.target_spread_pct}% was not reached."
                    }, str(order.user_id))
                
                await db.commit()
                
        except Exception as e:
            logger.error(f"Error in limit order worker: {e}")
        
        # Wait 10 seconds before next check
        await asyncio.sleep(10)

async def start_worker():
    """Start the background worker"""
    logger.info("Starting limit order execution worker")
    await check_and_execute_limit_orders()
