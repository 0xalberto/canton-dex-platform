use std::collections::BTreeMap;
use dashmap::DashMap;
use parking_lot::RwLock;
use std::sync::Arc;
use uuid::Uuid;
use chrono::Utc;

use crate::types::{
    Order, OrderBook, OrderSide, OrderStatus, OrderType, PriceLevel, TimeInForce, Trade, TradingPair, Decimal,
};

/// Matching engine for a single trading pair
pub struct OrderBookEngine {
    pair: TradingPair,
    /// Buy orders sorted by price (descending) then time
    bids: RwLock<BTreeMap<(std::cmp::Reverse<Decimal>, chrono::DateTime<Utc>), Order>>,
    /// Sell orders sorted by price (ascending) then time
    asks: RwLock<BTreeMap<(Decimal, chrono::DateTime<Utc>), Order>>,
    /// Order lookup
    orders: DashMap<Uuid, Order>,
    /// Executed trades
    trades: RwLock<Vec<Trade>>,
}

impl OrderBookEngine {
    pub fn new(pair: TradingPair) -> Self {
        OrderBookEngine {
            pair,
            bids: RwLock::new(BTreeMap::new()),
            asks: RwLock::new(BTreeMap::new()),
            orders: DashMap::new(),
            trades: RwLock::new(Vec::new()),
        }
    }
    
    /// Add order to order book
    pub fn add_order(&self, order: Order) -> Result<Vec<Trade>, String> {
        let mut trades = Vec::new();
        
        match order.side {
            OrderSide::Buy => {
                // Try to match against sell orders
                trades.extend(self.match_buy_order(&order)?);
            }
            OrderSide::Sell => {
                // Try to match against buy orders
                trades.extend(self.match_sell_order(&order)?);
            }
        }
        
        // Store remaining quantity in order book
        if !order.is_fully_filled() {
            self.insert_order(order.clone());
        }
        
        Ok(trades)
    }
    
    /// Match buy order against sell orders
    fn match_buy_order(&self, buy_order: &Order) -> Result<Vec<Trade>, String> {
        let mut trades = Vec::new();
        let mut asks = self.asks.write();
        let mut remaining_qty = buy_order.quantity;
        
        let keys_to_remove: Vec<_> = asks.iter()
            .take_while(|(_, sell_order)| sell_order.price <= buy_order.price)
            .map(|(k, _)| k.clone())
            .collect();
        
        for key in keys_to_remove {
            if remaining_qty.0 == 0 {
                break;
            }
            
            if let Some((_, mut sell_order)) = asks.remove(&key) {
                let match_qty = if sell_order.remaining_quantity() <= remaining_qty {
                    sell_order.remaining_quantity()
                } else {
                    remaining_qty
                };
                
                sell_order.filled_quantity = Decimal(sell_order.filled_quantity.0 + match_qty.0);
                if sell_order.is_fully_filled() {
                    sell_order.status = OrderStatus::Filled;
                } else {
                    sell_order.status = OrderStatus::PartiallyFilled;
                }
                
                remaining_qty = Decimal(remaining_qty.0 - match_qty.0);
                
                let trade = Trade {
                    id: Uuid::new_v4(),
                    trading_pair: self.pair.clone(),
                    buyer_id: buy_order.account_id.clone(),
                    seller_id: sell_order.account_id.clone(),
                    buy_order_id: buy_order.id,
                    sell_order_id: sell_order.id,
                    price: sell_order.price,
                    quantity: match_qty,
                    timestamp: Utc::now(),
                };
                
                trades.push(trade);
                self.orders.insert(sell_order.id, sell_order);
            }
        }
        
        Ok(trades)
    }
    
    /// Match sell order against buy orders
    fn match_sell_order(&self, sell_order: &Order) -> Result<Vec<Trade>, String> {
        let mut trades = Vec::new();
        let mut bids = self.bids.write();
        let mut remaining_qty = sell_order.quantity;
        
        let keys_to_remove: Vec<_> = bids.iter()
            .take_while(|(_, buy_order)| buy_order.price >= sell_order.price)
            .map(|(k, _)| k.clone())
            .collect();
        
        for key in keys_to_remove {
            if remaining_qty.0 == 0 {
                break;
            }
            
            if let Some((_, mut buy_order)) = bids.remove(&key) {
                let match_qty = if buy_order.remaining_quantity() <= remaining_qty {
                    buy_order.remaining_quantity()
                } else {
                    remaining_qty
                };
                
                buy_order.filled_quantity = Decimal(buy_order.filled_quantity.0 + match_qty.0);
                if buy_order.is_fully_filled() {
                    buy_order.status = OrderStatus::Filled;
                } else {
                    buy_order.status = OrderStatus::PartiallyFilled;
                }
                
                remaining_qty = Decimal(remaining_qty.0 - match_qty.0);
                
                let trade = Trade {
                    id: Uuid::new_v4(),
                    trading_pair: self.pair.clone(),
                    buyer_id: buy_order.account_id.clone(),
                    seller_id: sell_order.account_id.clone(),
                    buy_order_id: buy_order.id,
                    sell_order_id: sell_order.id,
                    price: buy_order.price,
                    quantity: match_qty,
                    timestamp: Utc::now(),
                };
                
                trades.push(trade);
                self.orders.insert(buy_order.id, buy_order);
            }
        }
        
        Ok(trades)
    }
    
    /// Insert order into order book
    fn insert_order(&self, order: Order) {
        let key = match order.side {
            OrderSide::Buy => {
                // For bids, use reverse price ordering (highest first)
                let mut bids = self.bids.write();
                let key = (std::cmp::Reverse(order.price), order.created_at);
                bids.insert(key, order.clone());
                return;
            }
            OrderSide::Sell => {
                let mut asks = self.asks.write();
                let key = (order.price, order.created_at);
                asks.insert(key, order.clone());
                return;
            }
        };
    }
    
    /// Cancel order
    pub fn cancel_order(&self, order_id: Uuid) -> Result<Order, String> {
        if let Some((_, mut order)) = self.orders.remove(&order_id) {
            order.status = OrderStatus::Cancelled;
            
            match order.side {
                OrderSide::Buy => {
                    let mut bids = self.bids.write();
                    let key = (std::cmp::Reverse(order.price), order.created_at);
                    bids.remove(&key);
                }
                OrderSide::Sell => {
                    let mut asks = self.asks.write();
                    let key = (order.price, order.created_at);
                    asks.remove(&key);
                }
            }
            
            Ok(order)
        } else {
            Err(format!("Order not found: {}", order_id))
        }
    }
    
    /// Get order book snapshot
    pub fn get_snapshot(&self, depth: usize) -> OrderBook {
        let bids = self.bids.read();
        let asks = self.asks.read();
        
        let bid_levels: Vec<PriceLevel> = bids.iter()
            .take(depth)
            .map(|(_, order)| PriceLevel {
                price: order.price,
                quantity: order.remaining_quantity(),
            })
            .collect();
        
        let ask_levels: Vec<PriceLevel> = asks.iter()
            .take(depth)
            .map(|(_, order)| PriceLevel {
                price: order.price,
                quantity: order.remaining_quantity(),
            })
            .collect();
        
        OrderBook {
            trading_pair: self.pair.clone(),
            bids: bid_levels,
            asks: ask_levels,
            timestamp: Utc::now(),
        }
    }
    
    /// Get order
    pub fn get_order(&self, order_id: Uuid) -> Option<Order> {
        self.orders.get(&order_id).map(|r| r.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    
    fn create_order(
        id: Uuid,
        pair: TradingPair,
        side: OrderSide,
        price: f64,
        qty: f64,
        account: &str,
    ) -> Order {
        Order {
            id,
            trading_pair: pair,
            side,
            order_type: OrderType::Limit,
            price: Decimal::from_f64(price),
            quantity: Decimal::from_f64(qty),
            filled_quantity: Decimal(0),
            status: OrderStatus::New,
            time_in_force: TimeInForce::GTC,
            account_id: account.to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            expiration: None,
        }
    }
    
    #[test]
    fn test_simple_match() {
        let pair = TradingPair {
            base: "BTC".to_string(),
            quote: "USD".to_string(),
        };
        
        let engine = OrderBookEngine::new(pair.clone());
        
        let buy_order = create_order(
            Uuid::new_v4(),
            pair.clone(),
            OrderSide::Buy,
            100.0,
            1.0,
            "account1",
        );
        
        let sell_order = create_order(
            Uuid::new_v4(),
            pair,
            OrderSide::Sell,
            100.0,
            1.0,
            "account2",
        );
        
        let _ = engine.add_order(buy_order).unwrap();
        let trades = engine.add_order(sell_order).unwrap();
        
        assert_eq!(trades.len(), 1);
        assert_eq!(trades[0].quantity.to_f64(), 1.0);
    }
}
