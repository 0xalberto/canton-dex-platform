# Matching Engine Service Documentation

## Overview

The Matching Engine is the high-performance order matching and execution service. Built in Rust for sub-millisecond latency, it implements confidential order matching with encrypted order book visibility, enabling privacy-preserving trading on the CantonDEX platform.

**Technology Stack**: Rust, gRPC, Protocol Buffers
**Port**: 50051
**Repository Path**: `/home/user/cantondex/cantondex-backend/matching-engine`
**Performance Target**: <1ms P99 latency

---

## Architecture

### Key Features

1. **Price-Time Priority Matching**
   - Orders matched by price first, then by time
   - FIFO matching within same price level
   - Support for multiple matching algorithms

2. **Order Types**
   - Limit orders (immediate-or-cancel, good-till-cancel)
   - Market orders
   - Stop orders
   - Stop-limit orders
   - Hidden/iceberg orders

3. **Privacy Features**
   - Encrypted order comparison using homomorphic encryption
   - Order book confidentiality
   - Trade privacy with aggregated public book

4. **Performance Optimizations**
   - In-memory order book per symbol
   - B-tree data structure for price levels
   - Lock-free concurrent processing
   - Batch order processing

---

## Data Structures

### Order Book Structure

```
Price Level (Buy Side)
├── 150.50 → [Order 1 (100 qty), Order 2 (50 qty), Order 3 (200 qty)]
├── 150.45 → [Order 4 (300 qty)]
├── 150.40 → [Order 5 (150 qty)]
└── ...

Mid Price: 150.475

Price Level (Sell Side)
├── 150.50 → [Order 6 (200 qty)]
├── 150.55 → [Order 7 (100 qty), Order 8 (300 qty)]
├── 150.60 → [Order 9 (250 qty)]
└── ...
```

### Order Representation

```rust
struct Order {
    id: String,                    // Unique order ID
    account_id: String,            // Account placing order
    symbol: String,                // Trading pair (e.g., AAPL/USDC)
    side: OrderSide,               // Buy or Sell
    order_type: OrderType,         // Limit, Market, Stop, Stop-Limit
    quantity: Decimal,             // Order quantity
    price: Decimal,                // Order price (0 for market)
    time_in_force: TimeInForce,    // GTC, IOC, FOK
    created_at: Timestamp,         // Order creation time
    fills: Vec<Fill>,              // Partial fills
    status: OrderStatus,           // Pending, Filled, Cancelled
}

struct Fill {
    counter_order_id: String,      // Order this filled against
    quantity: Decimal,             // Quantity filled
    price: Decimal,                // Fill price
    timestamp: Timestamp,          // Fill time
}
```

---

## gRPC Service Definition

### Endpoints

#### 1. PlaceOrder

Places a new order into the matching engine.

**Request**:
```protobuf
message PlaceOrderRequest {
    string account_id = 1;
    string symbol = 2;
    OrderSide side = 3;
    OrderType order_type = 4;
    string quantity = 5;           // Decimal as string
    string price = 6;              // Decimal as string (0 for market)
    TimeInForce time_in_force = 7;
    bool hidden = 8;               // Hidden from order book
    string ioc_limit = 9;          // Max execution price impact
}
```

**Response**:
```protobuf
message PlaceOrderResponse {
    string order_id = 1;
    OrderStatus status = 2;
    repeated Fill fills = 3;       // Immediate fills if any
    string message = 4;
}
```

#### 2. CancelOrder

Cancels an existing order.

**Request**:
```protobuf
message CancelOrderRequest {
    string order_id = 1;
    string account_id = 2;         // Verification
}
```

**Response**:
```protobuf
message CancelOrderResponse {
    string order_id = 1;
    OrderStatus status = 2;
    string unfilled_quantity = 3;
}
```

#### 3. ReplaceOrder

Replaces an existing order with new parameters.

**Request**:
```protobuf
message ReplaceOrderRequest {
    string order_id = 1;
    string account_id = 2;
    string new_quantity = 3;
    string new_price = 4;
}
```

**Response**:
```protobuf
message ReplaceOrderResponse {
    string order_id = 1;
    OrderStatus status = 2;
    repeated Fill fills = 3;
}
```

#### 4. GetOrderStatus

Retrieves current order status.

**Request**:
```protobuf
message GetOrderStatusRequest {
    string order_id = 1;
}
```

**Response**:
```protobuf
message GetOrderStatusResponse {
    Order order = 1;
    repeated Fill fill_history = 2;
}
```

#### 5. GetOrderBook

Retrieves current order book snapshot.

**Request**:
```protobuf
message GetOrderBookRequest {
    string symbol = 1;
    int32 depth = 2;               // Number of levels per side
}
```

**Response**:
```protobuf
message GetOrderBookResponse {
    string symbol = 1;
    repeated PriceLevel bids = 2;
    repeated PriceLevel asks = 3;
    string timestamp = 4;
}

message PriceLevel {
    string price = 1;
    string quantity = 2;
    int32 order_count = 3;
}
```

#### 6. GetMarketStats

Retrieves market statistics for a symbol.

**Request**:
```protobuf
message GetMarketStatsRequest {
    string symbol = 1;
    string period = 2;             // 1m, 5m, 15m, 1h, 1d
}
```

**Response**:
```protobuf
message GetMarketStatsResponse {
    string symbol = 1;
    string open = 2;
    string high = 3;
    string low = 4;
    string close = 5;
    string volume = 6;
    int64 trade_count = 7;
    string vwap = 8;
}
```

---

## Matching Algorithm

### Order Matching Process

```
1. New Order Arrives
   ↓
2. Check Order Validity
   - Validate account, symbol, quantity, price
   - Check against order validation rules
   ↓
3. Match Against Order Book
   - For BUY order: Match against lowest ASK prices
   - For SELL order: Match against highest BID prices
   - Continue until no more matches or order filled
   ↓
4. Create Fills
   - Create fill record for each match
   - Update both orders with fill information
   - Generate trade events
   ↓
5. Place Remaining Quantity
   - If order not fully filled:
     - Place on order book at specified price
     - For market orders not filled: Cancel remaining
   ↓
6. Publish Events
   - Publish to Kafka: order.events
   - Publish to Kafka: trade.events
   - Update WebSocket subscribers
```

### Fill Criteria

Orders are matched if:
- Buy order price >= Sell order price
- Quantity available at matching price
- Account has sufficient margin (checked by Risk Management)
- Order not hidden or price-improved on public book

---

## Configuration

### Environment Variables

```bash
# Service
RUST_LOG=info              # Logging level
MATCHING_ENGINE_PORT=50051  # gRPC port

# Order Book
MAX_ORDER_BOOK_DEPTH=1000   # Max orders per price level
MAX_SYMBOL_DEPTH=10000      # Max total orders per symbol
PRICE_PRECISION=2           # Decimal places for prices
QUANTITY_PRECISION=8        # Decimal places for quantities

# Performance
BATCH_SIZE=100              # Orders to batch process
BATCH_TIMEOUT_MS=10         # Max time to wait for batch

# Matching
MIN_ORDER_SIZE=0.01         # Minimum order quantity
MAX_ORDER_SIZE=1000000      # Maximum order quantity
TICK_SIZE=0.01              # Minimum price increment

# Encryption (for privacy)
USE_HOMOMORPHIC=false       # Use encrypted order comparison
ENCRYPTION_KEY_PATH=/etc/cantondex/enc.key
```

---

## Performance Characteristics

### Latency

- Order placement: **<0.5ms** (p50)
- Order matching: **<1ms** (p99)
- Order book snapshot: **<2ms** (p99)
- Market stats: **<5ms** (p99)

### Throughput

- **10,000+ orders/second** sustained
- **100,000+ matches/minute** during peak
- **1,000+ trades/second** creation rate

### Memory Usage

- Per symbol order book: ~10MB (1000 orders)
- Total system memory: ~500MB (typical operation)
- Scales linearly with number of active orders

---

## Event Streams

### Kafka Topics

**order-events**
```json
{
  "event_id": "evt_1234567890abcdef",
  "event_type": "order_placed",
  "order_id": "ord_1234567890abcdef",
  "account_id": "acc_1234567890abcdef",
  "symbol": "AAPL/USDC",
  "side": "buy",
  "quantity": "100.00000000",
  "price": "150.50",
  "timestamp": "2024-11-17T16:30:00Z"
}
```

**trade-events**
```json
{
  "event_id": "evt_1234567890abcdef",
  "event_type": "trade_executed",
  "trade_id": "trd_1234567890abcdef",
  "symbol": "AAPL/USDC",
  "quantity": "50.00000000",
  "price": "150.48",
  "buyer_account_id": "acc_buyer1234567",
  "seller_account_id": "acc_seller1234567",
  "buyer_order_id": "ord_buyer1234567",
  "seller_order_id": "ord_seller1234567",
  "timestamp": "2024-11-17T16:30:15Z"
}
```

---

## Running Locally

### Prerequisites

```bash
# Rust 1.70+
rustc --version

# Protobuf compiler
protoc --version
```

### Installation

```bash
cd /home/user/cantondex/cantondex-backend/matching-engine

# Build the project
cargo build --release

# Run with default settings
cargo run --release
```

### Environment Setup

```bash
export RUST_LOG=debug
export MATCHING_ENGINE_PORT=50051
cargo run --release
```

---

## Testing

### Unit Tests

```bash
cargo test --lib
```

### Integration Tests

```bash
cargo test --test '*'
```

### Performance Tests

```bash
# Benchmark order matching
cargo bench --bench matching
```

### Load Testing

```bash
# Using grpcurl for gRPC load testing
ghz --insecure \
  --proto ./protos/matching_engine.proto \
  --call matching_engine.MatchingEngine/PlaceOrder \
  -d '{"account_id":"acc_123","symbol":"AAPL/USDC","side":"BUY","order_type":"LIMIT","quantity":"100","price":"150.50","time_in_force":"GTC"}' \
  -c 100 -n 10000 \
  localhost:50051
```

---

## Deployment

### Docker Build

```bash
docker build -t matching-engine:latest .
docker tag matching-engine:latest <registry>/matching-engine:latest
docker push <registry>/matching-engine:latest
```

### Kubernetes Deployment

```bash
kubectl apply -f infrastructure/kubernetes/base/deployments.yaml -l app=matching-engine
kubectl scale statefulset matching-engine --replicas=3
```

### Health Checks

```bash
# gRPC health check
grpcurl -plaintext localhost:50051 grpc.health.v1.Health/Check
```

---

## Monitoring

### Key Metrics

```
matching_engine_orders_received_total{symbol}      - Total orders received
matching_engine_orders_placed_total{symbol}        - Orders successfully placed
matching_engine_trades_executed_total{symbol}      - Total trades executed
matching_engine_order_latency_seconds{percentile}  - Order processing latency
matching_engine_orderbook_depth{symbol}            - Current order book depth
matching_engine_matched_volume_total{symbol}       - Total matched volume
```

### Health Indicators

- Order receipt rate: Should be consistent
- Trade execution rate: Should correlate with order placement
- Order book depth: Should remain within expected range
- Latency: P99 should stay <1ms

---

## Troubleshooting

### High Latency

1. Check system load: `top` or `htop`
2. Check network latency: `ping <matching-engine-host>`
3. Check Kafka lag: `kafka-consumer-groups.sh --describe`
4. Review logs: `RUST_LOG=debug` for detailed output

### Order Matching Issues

1. Check order validation: Verify prices/quantities are valid
2. Check account permissions: Ensure account can trade
3. Check order book state: Request orderbook snapshot
4. Check event logs: Review Kafka topics for missed events

### Memory Issues

1. Check order book size: Monitor active orders
2. Check for stuck orders: Verify cancelled orders removed
3. Implement order book cleanup: Remove old orders periodically

---

## References

- [API Gateway Integration](./API-GATEWAY.md)
- [Settlement Coordinator](./SETTLEMENT-COORDINATOR.md)
- [Kafka Event Streaming](../infrastructure/KAFKA.md)
- [Performance Optimization Guide](../performance/TUNING-GUIDE.md)
