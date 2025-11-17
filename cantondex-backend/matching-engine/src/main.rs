use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::info;
use tracing_subscriber;

mod types;
mod orderbook;

use types::*;
use orderbook::OrderBookEngine;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_target(false)
        .with_thread_ids(true)
        .with_level(true)
        .init();

    info!("Starting CantonDEX Matching Engine");

    // Initialize order book for BTC/USD pair
    let trading_pair = TradingPair {
        base: "BTC".to_string(),
        quote: "USD".to_string(),
    };
    let order_book = Arc::new(RwLock::new(OrderBookEngine::new(trading_pair)));
    
    // Start the matching engine server
    let server = MatchingEngineServer::new(order_book);
    server.start().await?;

    Ok(())
}

pub struct MatchingEngineServer {
    order_book: Arc<RwLock<OrderBookEngine>>,
}

impl MatchingEngineServer {
    pub fn new(order_book: Arc<RwLock<OrderBookEngine>>) -> Self {
        Self { order_book }
    }

    pub async fn start(&self) -> Result<()> {
        info!("Matching Engine Server started successfully");
        
        // Keep the server running
        loop {
            tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
        }
    }
}