from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import uvicorn
from decimal import Decimal
import uuid

# Local imports
from database import get_db, get_db_pool, db_pool
from matching_engine import MatchingEngine
from models import (
    CreateOrderRequest, OrderResponse,
    BalanceResponse, AccountResponse,
    CreateAccountRequest, DepositRequest,
    TransactionResponse
)

# Initialize matching engine
matching_engine = MatchingEngine()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    print("🚀 Starting CantonDEX Trading Service...")
    pool = await get_db_pool()
    
    # Create seed orders for BTC/USDT to populate order book
    async with pool.acquire() as conn:
        try:
            # Check if seed orders already exist
            existing_orders = await conn.fetchval("""
                SELECT COUNT(*) FROM orders 
                WHERE pair = 'BTC/USDT' AND status = 'OPEN'
            """)
            
            if existing_orders == 0:
                print("📋 Creating seed orders for BTC/USDT...")
                
                # Create a system account for seed orders
                system_account = await conn.fetchrow("""
                    SELECT account_id FROM trading_accounts 
                    WHERE party_id = 'canton::system::operator'
                    LIMIT 1
                """)
                
                if system_account:
                    account_id = system_account['account_id']
                    
                    # Ensure sufficient BTC balance for sell orders
                    await conn.execute("""
                        UPDATE balances 
                        SET available = 100.0 
                        WHERE account_id = $1 AND asset_symbol = 'BTC'
                    """, account_id)
                    
                    # Ensure sufficient USDT balance for buy orders
                    await conn.execute("""
                        UPDATE balances 
                        SET available = 10000000.0 
                        WHERE account_id = $1 AND asset_symbol = 'USDT'
                    """, account_id)
                    
                    # Create 3 BID (buy) orders - market buyers at different prices
                    bid_prices = [92450.00, 92400.00, 92350.00]
                    for i, price in enumerate(bid_prices):
                        await conn.execute("""
                            INSERT INTO orders (
                                account_id, party_id, pair, side, order_type,
                                quantity, price, status
                            ) VALUES (
                                $1, 'canton::system::operator', 'BTC/USDT', 'BUY', 'LIMIT',
                                $2, $3, 'OPEN'
                            )
                        """, account_id, 0.5 + (i * 0.1), price)
                        print(f"  ✅ Seed BID order #{i+1}: {0.5 + (i * 0.1)} BTC @ ${price}")
                    
                    # Create 3 ASK (sell) orders - market sellers at different prices
                    ask_prices = [92550.00, 92600.00, 92650.00]
                    for i, price in enumerate(ask_prices):
                        await conn.execute("""
                            INSERT INTO orders (
                                account_id, party_id, pair, side, order_type,
                                quantity, price, status
                            ) VALUES (
                                $1, 'canton::system::operator', 'BTC/USDT', 'SELL', 'LIMIT',
                                $2, $3, 'OPEN'
                            )
                        """, account_id, 0.5 + (i * 0.1), price)
                        print(f"  ✅ Seed ASK order #{i+1}: {0.5 + (i * 0.1)} BTC @ ${price}")
                    
                    print("📊 Order Book seeded successfully - ready for demo!")
        except Exception as e:
            print(f"⚠️ Warning: Could not create seed orders: {e}")
    
    # Start matching engine in background
    asyncio.create_task(matching_engine.run_continuous_matching())
    
    yield
    
    # Shutdown
    print("🛑 Shutting down CantonDEX Trading Service...")
    matching_engine.stop()
    if db_pool:
        await db_pool.close()
