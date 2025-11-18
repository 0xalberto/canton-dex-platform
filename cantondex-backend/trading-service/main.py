"""
CantonDEX Trading Service
DAML-Compatible Backend with Real Matching Engine
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Literal
from datetime import datetime, timedelta
from decimal import Decimal
import asyncpg
import asyncio
import uuid
import json
from contextlib import asynccontextmanager

# ============================================
# CONFIGURATION
# ============================================

DATABASE_URL = "postgresql://cantondex:devpassword@localhost:5432/cantondex"
MATCHING_ENGINE_INTERVAL = 0.5  # Run matching every 500ms

# ============================================
# DATABASE CONNECTION POOL
# ============================================

db_pool: Optional[asyncpg.Pool] = None

async def get_db_pool():
    global db_pool
    if db_pool is None:
        db_pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=5,
            max_size=20,
            command_timeout=60
        )
    return db_pool

async def get_db():
    """Dependency for database connection"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        yield conn

# ============================================
# MATCHING ENGINE (Price-Time Priority)
# ============================================

class MatchingEngine:
    """
    Real-time order matching engine using Price-Time Priority algorithm
    This mimics Canton Network's atomic settlement but runs on PostgreSQL
    """
    
    def __init__(self):
        self.is_running = False
        self.matched_count = 0
        
    async def match_orders(self, pair: str, conn: asyncpg.Connection) -> int:
        """
        Match orders for a specific trading pair using Price-Time Priority
        Returns number of trades executed
        """
        trades_executed = 0
        
        while True:
            # Get best bid (highest buy price)
            best_bid = await conn.fetchrow("""
                SELECT order_id, party_id, account_id, quantity, filled_quantity, price
                FROM orders
                WHERE pair = $1 AND side = 'BUY' AND status = 'OPEN' 
                  AND order_type = 'LIMIT' AND price IS NOT NULL
                ORDER BY price DESC, created_at ASC
                LIMIT 1
            """, pair)
            
            # Get best ask (lowest sell price)
            best_ask = await conn.fetchrow("""
                SELECT order_id, party_id, account_id, quantity, filled_quantity, price
                FROM orders
                WHERE pair = $1 AND side = 'SELL' AND status = 'OPEN' 
                  AND order_type = 'LIMIT' AND price IS NOT NULL
                ORDER BY price ASC, created_at ASC
                LIMIT 1
            """, pair)
            
            # No match possible
            if not best_bid or not best_ask:
                break
                
            # Check if prices cross
            if best_bid['price'] < best_ask['price']:
                break
            
            # Calculate trade quantity and price
            bid_remaining = Decimal(str(best_bid['quantity'])) - Decimal(str(best_bid['filled_quantity']))
            ask_remaining = Decimal(str(best_ask['quantity'])) - Decimal(str(best_ask['filled_quantity']))
            trade_qty = min(bid_remaining, ask_remaining)
            trade_price = best_ask['price']  # Maker price (ask was first)
            
            # Execute atomic trade
            try:
                trade_id = await self._execute_trade(
                    conn=conn,
                    maker_order=best_ask,
                    taker_order=best_bid,
                    pair=pair,
                    quantity=trade_qty,
                    price=trade_price
                )
                
                trades_executed += 1
                self.matched_count += 1
                
                print(f"✅ Trade executed: {trade_id} | {pair} | {trade_qty} @ {trade_price}")
                
            except Exception as e:
                print(f"❌ Trade execution failed: {e}")
                break
        
        return trades_executed
    
    async def _execute_trade(
        self,
        conn: asyncpg.Connection,
        maker_order: dict,
        taker_order: dict,
        pair: str,
        quantity: Decimal,
        price: Decimal
    ) -> uuid.UUID:
        """
        Execute atomic trade with DvP settlement
        This is the core Canton Network concept - atomic settlement
        """
        trade_id = uuid.uuid4()
        
        # Begin transaction (simulates Canton's atomic DvP)
        async with conn.transaction():
            # Update maker order
            new_maker_filled = Decimal(str(maker_order['filled_quantity'])) + quantity
            maker_status = 'FILLED' if new_maker_filled >= Decimal(str(maker_order['quantity'])) else 'PARTIALLY_FILLED'
            
            await conn.execute("""
                UPDATE orders 
                SET filled_quantity = $1, status = $2, updated_at = NOW()
                WHERE order_id = $3
            """, float(new_maker_filled), maker_status, maker_order['order_id'])
            
            # Update taker order
            new_taker_filled = Decimal(str(taker_order['filled_quantity'])) + quantity
            taker_status = 'FILLED' if new_taker_filled >= Decimal(str(taker_order['quantity'])) else 'PARTIALLY_FILLED'
            
            await conn.execute("""
                UPDATE orders 
                SET filled_quantity = $1, status = $2, updated_at = NOW()
                WHERE order_id = $3
            """, float(new_taker_filled), taker_status, taker_order['order_id'])
            
            # Parse trading pair
            base_asset, quote_asset = pair.split('/')
            
            # Calculate amounts
            base_amount = quantity  # e.g., 1.5 BTC
            quote_amount = quantity * price  # e.g., 1.5 * 45000 = 67500 USDT
            
            # Transfer assets (maker side - selling base, receiving quote)
            await self._transfer_assets(
                conn, 
                maker_order['account_id'],
                base_asset,
                -float(base_amount),  # Debit base asset
                maker_order['order_id']
            )
            await self._transfer_assets(
                conn,
                maker_order['account_id'],
                quote_asset,
                float(quote_amount),  # Credit quote asset
                maker_order['order_id']
            )
            
            # Transfer assets (taker side - buying base, paying quote)
            await self._transfer_assets(
                conn,
                taker_order['account_id'],
                base_asset,
                float(base_amount),  # Credit base asset
                taker_order['order_id']
            )
            await self._transfer_assets(
                conn,
                taker_order['account_id'],
                quote_asset,
                -float(quote_amount),  # Debit quote asset
                taker_order['order_id']
            )
            
            # Create trade record
            await conn.execute("""
                INSERT INTO trades (
                    trade_id, maker_order_id, taker_order_id, 
                    maker_party_id, taker_party_id,
                    pair, quantity, price, maker_side,
                    settlement_status, asset_transferred, payment_transferred,
                    matched_at, executed_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, 
                    'SETTLED', TRUE, TRUE, NOW(), NOW()
                )
            """, trade_id, maker_order['order_id'], taker_order['order_id'],
                maker_order['party_id'], taker_order['party_id'],
                pair, float(quantity), float(price), 'SELL')
            
            # Create transaction records for audit trail
            await conn.execute("""
                INSERT INTO transactions (
                    account_id, party_id, tx_type, asset_symbol, 
                    amount, balance_after, trade_id, description
                ) VALUES (
                    $1, $2, 'TRADE', $3, $4, 
                    (SELECT available FROM balances WHERE account_id = $1 AND asset_symbol = $3),
                    $5, $6
                )
            """, maker_order['account_id'], maker_order['party_id'], base_asset,
                -float(base_amount), trade_id, f"Sell {quantity} {base_asset}")
            
            await conn.execute("""
                INSERT INTO transactions (
                    account_id, party_id, tx_type, asset_symbol, 
                    amount, balance_after, trade_id, description
                ) VALUES (
                    $1, $2, 'TRADE', $3, $4, 
                    (SELECT available FROM balances WHERE account_id = $1 AND asset_symbol = $3),
                    $5, $6
                )
            """, taker_order['account_id'], taker_order['party_id'], base_asset,
                float(base_amount), trade_id, f"Buy {quantity} {base_asset}")
        
        return trade_id
    
    async def _transfer_assets(
        self, 
        conn: asyncpg.Connection, 
        account_id: uuid.UUID, 
        asset: str, 
        amount: float,
        order_id: uuid.UUID
    ):
        """Transfer assets between accounts (atomic)"""
        # Check if balance exists
        balance = await conn.fetchrow("""
            SELECT balance_id, available FROM balances
            WHERE account_id = $1 AND asset_symbol = $2
        """, account_id, asset)
        
        if balance:
            new_balance = float(balance['available']) + amount
            if new_balance < 0:
                raise ValueError(f"Insufficient {asset} balance")
            
            await conn.execute("""
                UPDATE balances 
                SET available = $1, updated_at = NOW()
                WHERE balance_id = $2
            """, new_balance, balance['balance_id'])
        else:
            # Create balance if doesn't exist
            if amount < 0:
                raise ValueError(f"Cannot create negative {asset} balance")
            
            await conn.execute("""
                INSERT INTO balances (account_id, asset_symbol, available)
                VALUES ($1, $2, $3)
            """, account_id, asset, amount)
    
    async def run_continuous_matching(self):
        """Background task that continuously matches orders"""
        self.is_running = True
        print("🚀 Matching Engine started!")
        
        pool = await get_db_pool()
        
        while self.is_running:
            try:
                async with pool.acquire() as conn:
                    # Get active trading pairs
                    pairs = await conn.fetch("SELECT pair FROM market_data")
                    
                    for pair_row in pairs:
                        pair = pair_row['pair']
                        trades = await self.match_orders(pair, conn)
                        
                        if trades > 0:
                            # Update market data
                            await self._update_market_data(pair, conn)
                
                await asyncio.sleep(MATCHING_ENGINE_INTERVAL)
                
            except Exception as e:
                print(f"⚠️ Matching engine error: {e}")
                await asyncio.sleep(1)
    
    async def _update_market_data(self, pair: str, conn: asyncpg.Connection):
        """Update real-time market statistics"""
        # Get last trade price
        last_trade = await conn.fetchrow("""
            SELECT price, matched_at 
            FROM trades 
            WHERE pair = $1 
            ORDER BY matched_at DESC 
            LIMIT 1
        """, pair)
        
        if last_trade:
            # Get 24h stats
            day_ago = datetime.now() - timedelta(hours=24)
            stats = await conn.fetchrow("""
                SELECT 
                    MAX(price) as high_24h,
                    MIN(price) as low_24h,
                    SUM(quantity) as volume_24h
                FROM trades
                WHERE pair = $1 AND matched_at > $2
            """, pair, day_ago)
            
            # Get best bid/ask
            best_bid = await conn.fetchval("""
                SELECT price FROM orders
                WHERE pair = $1 AND side = 'BUY' AND status = 'OPEN'
                ORDER BY price DESC LIMIT 1
            """, pair)
            
            best_ask = await conn.fetchval("""
                SELECT price FROM orders
                WHERE pair = $1 AND side = 'SELL' AND status = 'OPEN'
                ORDER BY price ASC LIMIT 1
            """, pair)
            
            # Update market_data table
            await conn.execute("""
                UPDATE market_data
                SET last_price = $1, best_bid = $2, best_ask = $3,
                    high_24h = $4, low_24h = $5, volume_24h = $6,
                    updated_at = NOW()
                WHERE pair = $7
            """, last_trade['price'], best_bid, best_ask,
                stats['high_24h'], stats['low_24h'], stats['volume_24h'],
                pair)
    
    def stop(self):
        """Stop the matching engine"""
        self.is_running = False
        print("🛑 Matching Engine stopped!")

# Global matching engine instance
matching_engine = MatchingEngine()

# ============================================
# FASTAPI LIFECYCLE
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    print("🚀 Starting CantonDEX Trading Service...")
    await get_db_pool()
    
    # Start matching engine in background
    asyncio.create_task(matching_engine.run_continuous_matching())
    
    yield
    
    # Shutdown
    print("🛑 Shutting down CantonDEX Trading Service...")
    matching_engine.stop()
    if db_pool:
        await db_pool.close()

# ============================================
# FASTAPI APP
# ============================================

app = FastAPI(
    title="CantonDEX Trading Service",
    description="DAML-Compatible Trading Backend with Real Matching Engine",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# PYDANTIC MODELS
# ============================================

class CreateAccountRequest(BaseModel):
    party_id: str
    display_name: str
    email: Optional[str] = None

class AccountResponse(BaseModel):
    account_id: str
    party_id: str
    custodian_party_id: Optional[str]
    account_status: str
    created_at: datetime
    
class BalanceResponse(BaseModel):
    asset_symbol: str
    available: str
    locked: str
    total: str

class DepositRequest(BaseModel):
    account_id: str
    asset_symbol: str
    amount: Decimal = Field(gt=0)

class WithdrawRequest(BaseModel):
    account_id: str
    asset_symbol: str
    amount: Decimal = Field(gt=0)
    destination_address: str

class CreateOrderRequest(BaseModel):
    account_id: str
    pair: str
    side: Literal['BUY', 'SELL']
    order_type: Literal['MARKET', 'LIMIT', 'STOP']
    quantity: Decimal = Field(gt=0)
    price: Optional[Decimal] = Field(default=None, gt=0)
    stop_price: Optional[Decimal] = Field(default=None, gt=0)
    
    @validator('price')
    def validate_limit_order(cls, v, values):
        if values.get('order_type') == 'LIMIT' and v is None:
            raise ValueError('Price required for LIMIT orders')
        return v

class OrderResponse(BaseModel):
    order_id: str
    pair: str
    side: str
    order_type: str
    quantity: str
    price: Optional[str]
    filled_quantity: str
    remaining_quantity: str
    status: str
    created_at: datetime

class TradeResponse(BaseModel):
    trade_id: str
    pair: str
    quantity: str
    price: str
    maker_side: str
    matched_at: datetime
    settlement_status: str

class OrderBookLevel(BaseModel):
    price: str
    quantity: str
    order_count: int

class OrderBookResponse(BaseModel):
    pair: str
    bids: List[OrderBookLevel]
    asks: List[OrderBookLevel]
    updated_at: datetime

class MarketDataResponse(BaseModel):
    pair: str
    last_price: Optional[str]
    best_bid: Optional[str]
    best_ask: Optional[str]
    spread: Optional[str]
    price_change_24h: Optional[str]
    high_24h: Optional[str]
    low_24h: Optional[str]
    volume_24h: Optional[str]

# ============================================
# ACCOUNT MANAGEMENT ENDPOINTS
# ============================================

@app.post("/accounts", response_model=AccountResponse)
async def create_account(request: CreateAccountRequest, conn = Depends(get_db)):
    """Create a new trading account (Maps to TradingAccount.daml)"""
    try:
        # Create party if doesn't exist
        await conn.execute("""
            INSERT INTO parties (party_id, display_name, email)
            VALUES ($1, $2, $3)
            ON CONFLICT (party_id) DO NOTHING
        """, request.party_id, request.display_name, request.email)
        
        # Create trading account
        account = await conn.fetchrow("""
            INSERT INTO trading_accounts (party_id, custodian_party_id)
            VALUES ($1, 'canton::system::operator')
            RETURNING account_id, party_id, custodian_party_id, account_status, created_at
        """, request.party_id)
        
        # Initialize balances for all supported assets
        assets = ['BTC', 'ETH', 'SOL', 'USDT', 'tTBILL']
        for asset in assets:
            await conn.execute("""
                INSERT INTO balances (account_id, asset_symbol, available, locked)
                VALUES ($1, $2, 0, 0)
            """, account['account_id'], asset)
        
        return AccountResponse(
            account_id=str(account['account_id']),
            party_id=account['party_id'],
            custodian_party_id=account['custodian_party_id'],
            account_status=account['account_status'],
            created_at=account['created_at']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/accounts/{party_id}", response_model=AccountResponse)
async def get_account(party_id: str, conn = Depends(get_db)):
    """Get account by party ID"""
    account = await conn.fetchrow("""
        SELECT account_id, party_id, custodian_party_id, account_status, created_at
        FROM trading_accounts
        WHERE party_id = $1
        LIMIT 1
    """, party_id)
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    return AccountResponse(
        account_id=str(account['account_id']),
        party_id=account['party_id'],
        custodian_party_id=account['custodian_party_id'],
        account_status=account['account_status'],
        created_at=account['created_at']
    )

@app.get("/accounts/{party_id}/balances", response_model=List[BalanceResponse])
async def get_balances(party_id: str, conn = Depends(get_db)):
    """Get all balances for a party"""
    balances = await conn.fetch("""
        SELECT b.asset_symbol, b.available, b.locked, b.total
        FROM balances b
        JOIN trading_accounts a ON b.account_id = a.account_id
        WHERE a.party_id = $1
        ORDER BY b.asset_symbol
    """, party_id)
    
    return [
        BalanceResponse(
            asset_symbol=b['asset_symbol'],
            available=str(b['available']),
            locked=str(b['locked']),
            total=str(b['total'])
        ) for b in balances
    ]

# ============================================
# DEPOSIT / WITHDRAW ENDPOINTS
# ============================================

@app.post("/deposit")
async def deposit(request: DepositRequest, conn = Depends(get_db)):
    """Deposit assets into account"""
    try:
        async with conn.transaction():
            # Update balance
            await conn.execute("""
                UPDATE balances
                SET available = available + $1, updated_at = NOW()
                WHERE account_id = $2 AND asset_symbol = $3
            """, float(request.amount), uuid.UUID(request.account_id), request.asset_symbol)
            
            # Get party_id
            party_id = await conn.fetchval("""
                SELECT party_id FROM trading_accounts WHERE account_id = $1
            """, uuid.UUID(request.account_id))
            
            # Create transaction record
            tx_id = await conn.fetchval("""
                INSERT INTO transactions (
                    account_id, party_id, tx_type, asset_symbol, amount,
                    balance_after, description
                ) VALUES (
                    $1, $2, 'DEPOSIT', $3, $4,
                    (SELECT available FROM balances WHERE account_id = $1 AND asset_symbol = $3),
                    $5
                ) RETURNING transaction_id
            """, uuid.UUID(request.account_id), party_id, request.asset_symbol, 
                float(request.amount), f"Deposit {request.amount} {request.asset_symbol}")
            
            return {"success": True, "transaction_id": str(tx_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/withdraw")
async def withdraw(request: WithdrawRequest, conn = Depends(get_db)):
    """Withdraw assets from account"""
    try:
        async with conn.transaction():
            # Check balance
            balance = await conn.fetchval("""
                SELECT available FROM balances
                WHERE account_id = $1 AND asset_symbol = $2
            """, uuid.UUID(request.account_id), request.asset_symbol)
            
            if balance is None or float(balance) < float(request.amount):
                raise HTTPException(status_code=400, detail="Insufficient balance")
            
            # Update balance
            await conn.execute("""
                UPDATE balances
                SET available = available - $1, updated_at = NOW()
                WHERE account_id = $2 AND asset_symbol = $3
            """, float(request.amount), uuid.UUID(request.account_id), request.asset_symbol)
            
            # Get party_id
            party_id = await conn.fetchval("""
                SELECT party_id FROM trading_accounts WHERE account_id = $1
            """, uuid.UUID(request.account_id))
            
            # Create transaction record
            tx_id = await conn.fetchval("""
                INSERT INTO transactions (
                    account_id, party_id, tx_type, asset_symbol, amount,
                    balance_after, description
                ) VALUES (
                    $1, $2, 'WITHDRAW', $3, $4,
                    (SELECT available FROM balances WHERE account_id = $1 AND asset_symbol = $3),
                    $5
                ) RETURNING transaction_id
            """, uuid.UUID(request.account_id), party_id, request.asset_symbol,
                -float(request.amount), 
                f"Withdraw {request.amount} {request.asset_symbol} to {request.destination_address}")
            
            return {"success": True, "transaction_id": str(tx_id)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# ORDER MANAGEMENT ENDPOINTS
# ============================================

@app.post("/orders", response_model=OrderResponse)
async def create_order(request: CreateOrderRequest, conn = Depends(get_db)):
    """Create new order (Maps to ConfidentialOrder.daml)"""
    try:
        # Get party_id from account
        account = await conn.fetchrow("""
            SELECT party_id FROM trading_accounts WHERE account_id = $1
        """, uuid.UUID(request.account_id))
        
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        # For SELL orders, lock the base asset
        # For BUY orders, lock the quote asset
        if request.side == 'SELL':
            base_asset = request.pair.split('/')[0]
            lock_amount = float(request.quantity)
            lock_asset = base_asset
        else:  # BUY
            quote_asset = request.pair.split('/')[1]
            lock_amount = float(request.quantity * (request.price or 0))
            lock_asset = quote_asset
        
        async with conn.transaction():
            # Lock assets
            balance = await conn.fetchval("""
                SELECT available FROM balances
                WHERE account_id = $1 AND asset_symbol = $2
            """, uuid.UUID(request.account_id), lock_asset)
            
            if balance is None or float(balance) < lock_amount:
                raise HTTPException(status_code=400, detail=f"Insufficient {lock_asset} balance")
            
            await conn.execute("""
                UPDATE balances
                SET available = available - $1, locked = locked + $1
                WHERE account_id = $2 AND asset_symbol = $3
            """, lock_amount, uuid.UUID(request.account_id), lock_asset)
            
            # Create order
            order = await conn.fetchrow("""
                INSERT INTO orders (
                    account_id, party_id, pair, side, order_type,
                    quantity, price, stop_price, status
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, 'OPEN'
                ) RETURNING order_id, pair, side, order_type, quantity, price,
                           filled_quantity, remaining_quantity, status, created_at
            """, uuid.UUID(request.account_id), account['party_id'], request.pair,
                request.side, request.order_type, float(request.quantity),
                float(request.price) if request.price else None,
                float(request.stop_price) if request.stop_price else None)
            
            return OrderResponse(
                order_id=str(order['order_id']),
                pair=order['pair'],
                side=order['side'],
                order_type=order['order_type'],
                quantity=str(order['quantity']),
                price=str(order['price']) if order['price'] else None,
                filled_quantity=str(order['filled_quantity']),
                remaining_quantity=str(order['remaining_quantity']),
                status=order['status'],
                created_at=order['created_at']
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/orders/{party_id}", response_model=List[OrderResponse])
async def get_orders(party_id: str, status: Optional[str] = None, conn = Depends(get_db)):
    """Get orders for a party"""
    query = """
        SELECT order_id, pair, side, order_type, quantity, price,
               filled_quantity, remaining_quantity, status, created_at
        FROM orders
        WHERE party_id = $1
    """
    params = [party_id]
    
    if status:
        query += " AND status = $2"
        params.append(status)
    
    query += " ORDER BY created_at DESC LIMIT 100"
    
    orders = await conn.fetch(query, *params)
    
    return [
        OrderResponse(
            order_id=str(o['order_id']),
            pair=o['pair'],
            side=o['side'],
            order_type=o['order_type'],
            quantity=str(o['quantity']),
            price=str(o['price']) if o['price'] else None,
            filled_quantity=str(o['filled_quantity']),
            remaining_quantity=str(o['remaining_quantity']),
            status=o['status'],
            created_at=o['created_at']
        ) for o in orders
    ]

@app.delete("/orders/{order_id}")
async def cancel_order(order_id: str, conn = Depends(get_db)):
    """Cancel an open order"""
    try:
        async with conn.transaction():
            order = await conn.fetchrow("""
                SELECT o.order_id, o.account_id, o.pair, o.side, o.quantity, 
                       o.filled_quantity, o.price, o.status
                FROM orders o
                WHERE o.order_id = $1
            """, uuid.UUID(order_id))
            
            if not order:
                raise HTTPException(status_code=404, detail="Order not found")
            
            if order['status'] not in ['OPEN', 'PARTIALLY_FILLED']:
                raise HTTPException(status_code=400, detail="Cannot cancel this order")
            
            # Unlock assets
            remaining_qty = float(order['quantity']) - float(order['filled_quantity'])
            
            if order['side'] == 'SELL':
                lock_asset = order['pair'].split('/')[0]
                unlock_amount = remaining_qty
            else:  # BUY
                lock_asset = order['pair'].split('/')[1]
                unlock_amount = remaining_qty * float(order['price'])
            
            await conn.execute("""
                UPDATE balances
                SET available = available + $1, locked = locked - $1
                WHERE account_id = $2 AND asset_symbol = $3
            """, unlock_amount, order['account_id'], lock_asset)
            
            # Cancel order
            await conn.execute("""
                UPDATE orders
                SET status = 'CANCELLED', updated_at = NOW()
                WHERE order_id = $1
            """, uuid.UUID(order_id))
            
            return {"success": True, "order_id": order_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# MARKET DATA ENDPOINTS
# ============================================

@app.get("/orderbook/{pair}", response_model=OrderBookResponse)
async def get_orderbook(pair: str, depth: int = 20, conn = Depends(get_db)):
    """Get order book for a trading pair"""
    # Get bids (buy orders)
    bids = await conn.fetch("""
        SELECT price, SUM(remaining_quantity) as quantity, COUNT(*) as order_count
        FROM orders
        WHERE pair = $1 AND side = 'BUY' AND status = 'OPEN' AND price IS NOT NULL
        GROUP BY price
        ORDER BY price DESC
        LIMIT $2
    """, pair, depth)
    
    # Get asks (sell orders)
    asks = await conn.fetch("""
        SELECT price, SUM(remaining_quantity) as quantity, COUNT(*) as order_count
        FROM orders
        WHERE pair = $1 AND side = 'SELL' AND status = 'OPEN' AND price IS NOT NULL
        GROUP BY price
        ORDER BY price ASC
        LIMIT $2
    """, pair, depth)
    
    return OrderBookResponse(
        pair=pair,
        bids=[OrderBookLevel(
            price=str(b['price']),
            quantity=str(b['quantity']),
            order_count=b['order_count']
        ) for b in bids],
        asks=[OrderBookLevel(
            price=str(a['price']),
            quantity=str(a['quantity']),
            order_count=a['order_count']
        ) for a in asks],
        updated_at=datetime.now()
    )

@app.get("/market/{pair}", response_model=MarketDataResponse)
async def get_market_data(pair: str, conn = Depends(get_db)):
    """Get real-time market data"""
    data = await conn.fetchrow("""
        SELECT * FROM market_data WHERE pair = $1
    """, pair)
    
    if not data:
        raise HTTPException(status_code=404, detail="Market not found")
    
    return MarketDataResponse(
        pair=data['pair'],
        last_price=str(data['last_price']) if data['last_price'] else None,
        best_bid=str(data['best_bid']) if data['best_bid'] else None,
        best_ask=str(data['best_ask']) if data['best_ask'] else None,
        spread=str(data['spread']) if data['spread'] else None,
        price_change_24h=str(data['price_change_24h']) if data['price_change_24h'] else None,
        high_24h=str(data['high_24h']) if data['high_24h'] else None,
        low_24h=str(data['low_24h']) if data['low_24h'] else None,
        volume_24h=str(data['volume_24h']) if data['volume_24h'] else None
    )

@app.get("/markets", response_model=List[MarketDataResponse])
async def get_all_markets(conn = Depends(get_db)):
    """Get all market data"""
    markets = await conn.fetch("SELECT * FROM market_data")
    
    return [
        MarketDataResponse(
            pair=m['pair'],
            last_price=str(m['last_price']) if m['last_price'] else None,
            best_bid=str(m['best_bid']) if m['best_bid'] else None,
            best_ask=str(m['best_ask']) if m['best_ask'] else None,
            spread=str(m['spread']) if m['spread'] else None,
            price_change_24h=str(m['price_change_24h']) if m['price_change_24h'] else None,
            high_24h=str(m['high_24h']) if m['high_24h'] else None,
            low_24h=str(m['low_24h']) if m['low_24h'] else None,
            volume_24h=str(m['volume_24h']) if m['volume_24h'] else None
        ) for m in markets
    ]

@app.get("/trades/{pair}", response_model=List[TradeResponse])
async def get_trades(pair: str, limit: int = 50, conn = Depends(get_db)):
    """Get recent trades for a pair"""
    trades = await conn.fetch("""
        SELECT trade_id, pair, quantity, price, maker_side, matched_at, settlement_status
        FROM trades
        WHERE pair = $1
        ORDER BY matched_at DESC
        LIMIT $2
    """, pair, limit)
    
    return [
        TradeResponse(
            trade_id=str(t['trade_id']),
            pair=t['pair'],
            quantity=str(t['quantity']),
            price=str(t['price']),
            maker_side=t['maker_side'],
            matched_at=t['matched_at'],
            settlement_status=t['settlement_status']
        ) for t in trades
    ]

# ============================================
# HEALTH CHECK
# ============================================

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "cantondex-trading",
        "matching_engine": "running" if matching_engine.is_running else "stopped",
        "trades_matched": matching_engine.matched_count
    }

# ============================================
# MAIN
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
