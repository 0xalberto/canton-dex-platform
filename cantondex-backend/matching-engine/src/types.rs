use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::cmp::Ordering;

/// Market trading pair (e.g., BTC/USD)
#[derive(Clone, Debug, Eq, PartialEq, Hash, Serialize, Deserialize)]
pub struct TradingPair {
    pub base: String,
    pub quote: String,
}

impl std::fmt::Display for TradingPair {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}/{}", self.base, self.quote)
    }
}

/// Order side (Buy/Sell)
#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize, Deserialize)]
pub enum OrderSide {
    Buy,
    Sell,
}

/// Order type
#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize, Deserialize)]
pub enum OrderType {
    Limit,
    Market,
    Stop,
    Iceberg,
}

/// Time-in-force
#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize, Deserialize)]
pub enum TimeInForce {
    /// Good-til-cancelled (default)
    GTC,
    /// Immediate-or-cancel
    IOC,
    /// Fill-or-kill
    FOK,
    /// Good-til-date
    GTD,
}

/// Order status
#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize, Deserialize)]
pub enum OrderStatus {
    New,
    PartiallyFilled,
    Filled,
    Cancelled,
    Rejected,
    Expired,
}

/// Decimal price/quantity type (u128 with 18 decimal places)
#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd, Serialize, Deserialize)]
pub struct Decimal(pub u128);

impl Decimal {
    pub const SCALE: u32 = 18;
    pub const ONE: Decimal = Decimal(10u128.pow(Self::SCALE));
    
    pub fn from_f64(val: f64) -> Self {
        Decimal((val * (10f64.powi(Self::SCALE as i32))) as u128)
    }
    
    pub fn to_f64(&self) -> f64 {
        self.0 as f64 / (10f64.powi(Self::SCALE as i32))
    }
}

/// Trading order
#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
pub struct Order {
    pub id: Uuid,
    pub trading_pair: TradingPair,
    pub side: OrderSide,
    pub order_type: OrderType,
    pub price: Decimal,
    pub quantity: Decimal,
    pub filled_quantity: Decimal,
    pub status: OrderStatus,
    pub time_in_force: TimeInForce,
    pub account_id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub expiration: Option<DateTime<Utc>>,
}

impl Order {
    pub fn remaining_quantity(&self) -> Decimal {
        Decimal(self.quantity.0 - self.filled_quantity.0)
    }
    
    pub fn is_fully_filled(&self) -> bool {
        self.filled_quantity == self.quantity
    }
    
    pub fn is_expired(&self, now: DateTime<Utc>) -> bool {
        if let Some(exp) = self.expiration {
            now > exp
        } else {
            false
        }
    }
}

impl Ord for Order {
    fn cmp(&self, other: &Self) -> Ordering {
        // Price-time priority: better price first, then earlier time
        match other.price.cmp(&self.price) {
            Ordering::Equal => self.created_at.cmp(&other.created_at),
            other_ord => other_ord,
        }
    }
}

impl PartialOrd for Order {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

/// Trade execution
#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
pub struct Trade {
    pub id: Uuid,
    pub trading_pair: TradingPair,
    pub buyer_id: String,
    pub seller_id: String,
    pub buy_order_id: Uuid,
    pub sell_order_id: Uuid,
    pub price: Decimal,
    pub quantity: Decimal,
    pub timestamp: DateTime<Utc>,
}

/// Order book level
#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize)]
pub struct PriceLevel {
    pub price: Decimal,
    pub quantity: Decimal,
}

/// Order book snapshot
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct OrderBook {
    pub trading_pair: TradingPair,
    pub bids: Vec<PriceLevel>,
    pub asks: Vec<PriceLevel>,
    pub timestamp: DateTime<Utc>,
}
