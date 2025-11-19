import asyncio
import logging
from database import get_db_pool

logger = logging.getLogger(__name__)

class MatchingEngine:
    def __init__(self):
        self.is_running = False
        self._task = None

    async def run_continuous_matching(self):
        """Run the matching engine loop"""
        self.is_running = True
        print("🔄 Matching Engine started")
        
        while self.is_running:
            try:
                await self.match_orders()
                await asyncio.sleep(0.5)  # Run every 500ms
            except Exception as e:
                logger.error(f"Error in matching engine: {e}")
                await asyncio.sleep(1)

    def stop(self):
        """Stop the matching engine"""
        self.is_running = False
        if self._task:
            self._task.cancel()
        print("⏹️ Matching Engine stopped")

    async def match_orders(self):
        """Execute order matching logic"""
        pool = await get_db_pool()
        
        async with pool.acquire() as conn:
            # Get all active pairs
            pairs = await conn.fetch("SELECT DISTINCT pair FROM orders WHERE status = 'OPEN'")
            
            for record in pairs:
                pair = record['pair']
                await self._match_pair(conn, pair)

    async def _match_pair(self, conn, pair):
        """Match orders for a specific pair"""
        # Fetch best bid (highest price)
        best_bid = await conn.fetchrow("""
            SELECT * FROM orders 
            WHERE pair = $1 AND side = 'BUY' AND status = 'OPEN'
            ORDER BY price DESC, created_at ASC
            LIMIT 1
        """, pair)

        # Fetch best ask (lowest price)
        best_ask = await conn.fetchrow("""
            SELECT * FROM orders 
            WHERE pair = $1 AND side = 'SELL' AND status = 'OPEN'
            ORDER BY price ASC, created_at ASC
            LIMIT 1
        """, pair)

        if not best_bid or not best_ask:
            return

        # Check for cross
        if best_bid['price'] >= best_ask['price']:
            # Match found!
            match_price = best_ask['price'] # Price-time priority (maker's price)
            match_qty = min(best_bid['quantity'] - best_bid['filled_quantity'], 
                          best_ask['quantity'] - best_ask['filled_quantity'])
            
            if match_qty > 0:
                await self._execute_trade(conn, best_bid, best_ask, match_price, match_qty)

    async def _execute_trade(self, conn, bid, ask, price, quantity):
        """Execute the trade atomically"""
        print(f"⚡ Executing Trade: {quantity} {bid['pair']} @ {price}")
        
        async with conn.transaction():
            # Update Bidder (Buyer)
            await conn.execute("""
                UPDATE orders 
                SET filled_quantity = filled_quantity + $1,
                    status = CASE WHEN filled_quantity + $1 >= quantity THEN 'FILLED' ELSE 'PARTIAL' END,
                    updated_at = NOW()
                WHERE order_id = $2
            """, quantity, bid['order_id'])

            # Update Asker (Seller)
            await conn.execute("""
                UPDATE orders 
                SET filled_quantity = filled_quantity + $1,
                    status = CASE WHEN filled_quantity + $1 >= quantity THEN 'FILLED' ELSE 'PARTIAL' END,
                    updated_at = NOW()
                WHERE order_id = $2
            """, quantity, ask['order_id'])

            # Create Trade Record
            await conn.execute("""
                INSERT INTO trades (
                    pair, price, quantity, 
                    bid_order_id, ask_order_id,
                    maker_order_id, taker_order_id,
                    settlement_status
                ) VALUES ($1, $2, $3, $4, $5, $5, $4, 'COMPLETED')
            """, bid['pair'], price, quantity, bid['order_id'], ask['order_id'])

            # Transfer Assets (Simplified for now - real implementation would update balances)
            # In a real system, we would unlock the frozen assets and swap them here.
            # For this demo, we assume the order placement locked the assets and we just update the balances.
            
            base, quote = bid['pair'].split('/')
            total_cost = price * quantity

            # Buyer: +Base, -Quote (Locked)
            # Seller: -Base (Locked), +Quote

            # Update Buyer Balances
            # Unlock Quote (cost) and deduct it
            await conn.execute("""
                UPDATE balances SET locked = locked - $1 WHERE account_id = $2 AND asset_symbol = $3
            """, total_cost, bid['account_id'], quote)
            
            # Add Base
            await conn.execute("""
                INSERT INTO balances (account_id, asset_symbol, available)
                VALUES ($1, $2, $3)
                ON CONFLICT (account_id, asset_symbol) 
                DO UPDATE SET available = balances.available + $3
            """, bid['account_id'], base, quantity)

            # Update Seller Balances
            # Unlock Base (quantity) and deduct it
            await conn.execute("""
                UPDATE balances SET locked = locked - $1 WHERE account_id = $2 AND asset_symbol = $3
            """, quantity, ask['account_id'], base)

            # Add Quote
            await conn.execute("""
                INSERT INTO balances (account_id, asset_symbol, available)
                VALUES ($1, $2, $3)
                ON CONFLICT (account_id, asset_symbol) 
                DO UPDATE SET available = balances.available + $3
            """, ask['account_id'], quote, total_cost)
