# CantonDEX WebSocket API Documentation

## Overview

The WebSocket API provides real-time data streams and notifications for traders, compliance officers, and system administrators. The WebSocket endpoint enables low-latency push updates for orders, trades, market data, and system events.

**WebSocket URL**: `wss://api.cantondex.io/v1/ws`
**WebSocket Port (Local)**: `8000`

---

## Connection

### Establishing a Connection

```javascript
const ws = new WebSocket('wss://api.cantondex.io/v1/ws');

ws.onopen = () => {
  console.log('Connected to CantonDEX WebSocket');

  // Authenticate immediately after connection
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'YOUR_JWT_TOKEN'
  }));
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket disconnected');
};
```

### Authentication

All WebSocket connections must be authenticated using JWT tokens. Send the authentication message immediately after connection:

**Request**:
```json
{
  "type": "auth",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success)**:
```json
{
  "type": "auth_response",
  "status": "authenticated",
  "account_id": "acc_1234567890abcdef",
  "message": "Successfully authenticated"
}
```

**Response (Error)**:
```json
{
  "type": "auth_response",
  "status": "failed",
  "error_code": "INVALID_TOKEN",
  "error_message": "Token is invalid or expired"
}
```

---

## Subscriptions

### Order Updates Stream

Subscribe to real-time order updates for a specific account:

**Subscribe Request**:
```json
{
  "type": "subscribe",
  "channel": "orders",
  "account_id": "acc_1234567890abcdef"
}
```

**Subscription Confirmation**:
```json
{
  "type": "subscription_response",
  "channel": "orders",
  "account_id": "acc_1234567890abcdef",
  "status": "subscribed",
  "message": "Now receiving order updates"
}
```

**Order Created Event**:
```json
{
  "type": "order_created",
  "account_id": "acc_1234567890abcdef",
  "order_id": "ord_1234567890abcdef",
  "symbol": "AAPL/USDC",
  "side": "buy",
  "order_type": "limit",
  "quantity": 100,
  "price": 150.50,
  "status": "pending",
  "timestamp": "2024-11-17T16:30:00Z"
}
```

**Order Updated Event**:
```json
{
  "type": "order_updated",
  "account_id": "acc_1234567890abcdef",
  "order_id": "ord_1234567890abcdef",
  "status": "partially_filled",
  "filled": 50,
  "average_fill_price": 150.48,
  "timestamp": "2024-11-17T16:30:15Z"
}
```

**Order Filled Event**:
```json
{
  "type": "order_filled",
  "account_id": "acc_1234567890abcdef",
  "order_id": "ord_1234567890abcdef",
  "quantity": 100,
  "price": 150.48,
  "fill_time": "2024-11-17T16:30:30Z",
  "trade_id": "trd_1234567890abcdef"
}
```

**Order Cancelled Event**:
```json
{
  "type": "order_cancelled",
  "account_id": "acc_1234567890abcdef",
  "order_id": "ord_1234567890abcdef",
  "reason": "user_requested",
  "timestamp": "2024-11-17T16:31:00Z"
}
```

---

### Trade Updates Stream

Subscribe to real-time trade executions:

**Subscribe Request**:
```json
{
  "type": "subscribe",
  "channel": "trades",
  "account_id": "acc_1234567890abcdef"
}
```

**Trade Executed Event**:
```json
{
  "type": "trade_executed",
  "account_id": "acc_1234567890abcdef",
  "trade_id": "trd_1234567890abcdef",
  "order_id": "ord_1234567890abcdef",
  "symbol": "AAPL/USDC",
  "side": "buy",
  "quantity": 50,
  "price": 150.48,
  "commission": 7.52,
  "gross_amount": 7524,
  "net_amount": 7516.48,
  "executed_at": "2024-11-17T16:30:30Z"
}
```

**Trade Cancelled Event**:
```json
{
  "type": "trade_cancelled",
  "trade_id": "trd_1234567890abcdef",
  "reason": "settlement_failed",
  "timestamp": "2024-11-17T16:35:00Z"
}
```

---

### Market Data Stream

Subscribe to real-time market prices and order book updates:

**Subscribe Request**:
```json
{
  "type": "subscribe",
  "channel": "market_data",
  "symbols": ["AAPL/USDC", "GOOGL/USDC"],
  "aggregation": "1s"
}
```

**Price Update Event**:
```json
{
  "type": "price_update",
  "symbol": "AAPL/USDC",
  "bid": 150.45,
  "ask": 150.50,
  "mid": 150.475,
  "last_price": 150.48,
  "timestamp": "2024-11-17T16:30:45Z"
}
```

**Order Book Update Event**:
```json
{
  "type": "orderbook_update",
  "symbol": "AAPL/USDC",
  "timestamp": "2024-11-17T16:30:45Z",
  "changes": {
    "bids": [
      {"price": 150.45, "quantity": 5000, "action": "update"},
      {"price": 150.40, "quantity": 0, "action": "delete"}
    ],
    "asks": [
      {"price": 150.50, "quantity": 4500, "action": "update"}
    ]
  }
}
```

---

### Settlement Stream

Subscribe to settlement status updates:

**Subscribe Request**:
```json
{
  "type": "subscribe",
  "channel": "settlements",
  "account_id": "acc_1234567890abcdef"
}
```

**Settlement Created Event**:
```json
{
  "type": "settlement_created",
  "settlement_id": "set_1234567890abcdef",
  "trade_id": "trd_1234567890abcdef",
  "symbol": "AAPL/USDC",
  "quantity": 50,
  "amount": 7524,
  "settlement_date": "2024-11-19T00:00:00Z",
  "timestamp": "2024-11-17T16:30:30Z"
}
```

**Settlement Confirmed Event**:
```json
{
  "type": "settlement_confirmed",
  "settlement_id": "set_1234567890abcdef",
  "dvp_transaction_id": "dvp_tx_1234567890",
  "timestamp": "2024-11-17T16:30:45Z"
}
```

**Settlement Failed Event**:
```json
{
  "type": "settlement_failed",
  "settlement_id": "set_1234567890abcdef",
  "reason": "insufficient_funds",
  "error_message": "Insufficient cash balance for settlement",
  "timestamp": "2024-11-17T16:35:00Z"
}
```

---

### Account Notifications Stream

Subscribe to important account notifications:

**Subscribe Request**:
```json
{
  "type": "subscribe",
  "channel": "account_notifications",
  "account_id": "acc_1234567890abcdef"
}
```

**Balance Updated Event**:
```json
{
  "type": "balance_updated",
  "account_id": "acc_1234567890abcdef",
  "total_balance": 975000,
  "available_balance": 825000,
  "reserved_balance": 150000,
  "timestamp": "2024-11-17T16:30:30Z"
}
```

**Margin Call Event**:
```json
{
  "type": "margin_call",
  "account_id": "acc_1234567890abcdef",
  "current_margin_level": 0.45,
  "warning_level": 0.5,
  "liquidation_level": 0.3,
  "message": "Your margin level is below 50%. Please add funds or reduce positions.",
  "timestamp": "2024-11-17T16:35:00Z"
}
```

**Deposit Received Event**:
```json
{
  "type": "deposit_received",
  "account_id": "acc_1234567890abcdef",
  "deposit_id": "dep_1234567890abcdef",
  "currency": "USDC",
  "amount": 10000,
  "transaction_hash": "0xabcd1234...",
  "timestamp": "2024-11-17T16:20:00Z"
}
```

**Withdrawal Processed Event**:
```json
{
  "type": "withdrawal_processed",
  "account_id": "acc_1234567890abcdef",
  "withdrawal_id": "wth_1234567890abcdef",
  "currency": "USDC",
  "amount": 5000,
  "transaction_hash": "0xabcd1234...",
  "timestamp": "2024-11-17T16:25:00Z"
}
```

---

### Compliance Events Stream

Subscribe to compliance-related events (for compliance officers):

**Subscribe Request**:
```json
{
  "type": "subscribe",
  "channel": "compliance_events"
}
```

**Suspicious Activity Detected Event**:
```json
{
  "type": "suspicious_activity_detected",
  "event_id": "evt_1234567890abcdef",
  "account_id": "acc_1234567890abcdef",
  "activity_type": "unusual_trading_pattern",
  "severity": "medium",
  "description": "Trader executed 50 orders in 2 minutes (unusual for this account)",
  "timestamp": "2024-11-17T16:35:00Z",
  "action_required": true
}
```

**KYC Status Changed Event**:
```json
{
  "type": "kyc_status_changed",
  "account_id": "acc_1234567890abcdef",
  "new_status": "approved",
  "previous_status": "pending_review",
  "kyc_tier": "tier_2",
  "timestamp": "2024-11-17T16:40:00Z"
}
```

**Large Transaction Alert Event**:
```json
{
  "type": "large_transaction_alert",
  "alert_id": "alr_1234567890abcdef",
  "account_id": "acc_1234567890abcdef",
  "transaction_type": "trade",
  "amount": 5000000,
  "threshold": 1000000,
  "timestamp": "2024-11-17T16:45:00Z"
}
```

---

### System Health Stream

Subscribe to system-wide health and status updates:

**Subscribe Request**:
```json
{
  "type": "subscribe",
  "channel": "system_health"
}
```

**System Status Event**:
```json
{
  "type": "system_status",
  "status": "operational",
  "all_services_healthy": true,
  "timestamp": "2024-11-17T16:50:00Z"
}
```

**Service Degraded Event**:
```json
{
  "type": "service_degraded",
  "service": "matching_engine",
  "status": "degraded",
  "message": "Increased latency detected (P99: 5ms)",
  "timestamp": "2024-11-17T16:55:00Z"
}
```

**Maintenance Notice Event**:
```json
{
  "type": "maintenance_notice",
  "service": "compliance_service",
  "start_time": "2024-11-18T02:00:00Z",
  "end_time": "2024-11-18T03:00:00Z",
  "description": "Database maintenance - full functionality will be unavailable",
  "timestamp": "2024-11-17T17:00:00Z"
}
```

---

## Unsubscribe

**Unsubscribe Request**:
```json
{
  "type": "unsubscribe",
  "channel": "orders",
  "account_id": "acc_1234567890abcdef"
}
```

**Unsubscribe Response**:
```json
{
  "type": "unsubscribe_response",
  "channel": "orders",
  "status": "unsubscribed",
  "message": "No longer receiving order updates"
}
```

---

## Heartbeat / Keep-Alive

The server sends periodic heartbeat messages to keep the connection alive. Clients should respond with a pong message:

**Server Heartbeat**:
```json
{
  "type": "ping",
  "timestamp": "2024-11-17T17:05:00Z"
}
```

**Client Response**:
```json
{
  "type": "pong",
  "timestamp": "2024-11-17T17:05:00Z"
}
```

If no heartbeat is received for 30 seconds, the connection may be dropped.

---

## Error Handling

When an error occurs on the WebSocket, an error message is sent:

**Error Message**:
```json
{
  "type": "error",
  "code": "SUBSCRIPTION_ERROR",
  "message": "Failed to subscribe to channel",
  "details": {
    "channel": "orders",
    "reason": "insufficient_permissions"
  },
  "timestamp": "2024-11-17T17:10:00Z"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| INVALID_REQUEST | Malformed request message |
| AUTH_FAILED | Authentication failed |
| SUBSCRIPTION_ERROR | Failed to subscribe to channel |
| ALREADY_SUBSCRIBED | Already subscribed to this channel |
| NOT_SUBSCRIBED | Not subscribed to this channel |
| INVALID_CHANNEL | Channel does not exist |
| INSUFFICIENT_PERMISSIONS | No permission to access this channel |
| CONNECTION_CLOSED | Connection was closed |
| MESSAGE_SIZE_EXCEEDED | Message too large |
| RATE_LIMITED | Rate limit exceeded |

---

## Message Format

All WebSocket messages are JSON-formatted with the following structure:

```json
{
  "type": "message_type",
  "timestamp": "2024-11-17T17:00:00Z",
  "...": "other fields specific to message type"
}
```

---

## Connection Management

### Maximum Connections

- 10 concurrent connections per account
- Connection timeout: 5 minutes of inactivity
- Message rate limit: 100 messages/second per connection

### Automatic Reconnection

Clients should implement exponential backoff when reconnecting:

```javascript
let reconnectDelay = 1000; // Start with 1 second
const maxDelay = 30000; // Max 30 seconds

function reconnect() {
  setTimeout(() => {
    try {
      ws = new WebSocket('wss://api.cantondex.io/v1/ws');
      // Reset delay on successful connection
      ws.onopen = () => reconnectDelay = 1000;
    } catch (error) {
      reconnectDelay = Math.min(reconnectDelay * 2, maxDelay);
      reconnect();
    }
  }, reconnectDelay);
}
```

---

## Example Implementation

### JavaScript / TypeScript

```typescript
class CantonDEXWebSocket {
  private ws: WebSocket | null = null;
  private token: string;
  private accountId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(token: string, accountId: string) {
    this.token = token;
    this.accountId = accountId;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket('wss://api.cantondex.io/v1/ws');

        this.ws.onopen = () => {
          this.authenticate().then(resolve).catch(reject);
        };

        this.ws.onmessage = (event) => this.handleMessage(JSON.parse(event.data));
        this.ws.onerror = (error) => reject(error);
      } catch (error) {
        reject(error);
      }
    });
  }

  private authenticate(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, 5000);

      this.send({
        type: 'auth',
        token: this.token
      });

      // Wait for auth response
      const originalOnMessage = this.ws!.onmessage;
      this.ws!.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'auth_response') {
          clearTimeout(timeout);
          this.ws!.onmessage = originalOnMessage;
          if (message.status === 'authenticated') {
            resolve();
          } else {
            reject(new Error(`Authentication failed: ${message.error_message}`));
          }
        }
      };
    });
  }

  subscribeToOrders(): void {
    this.send({
      type: 'subscribe',
      channel: 'orders',
      account_id: this.accountId
    });
  }

  subscribeToTrades(): void {
    this.send({
      type: 'subscribe',
      channel: 'trades',
      account_id: this.accountId
    });
  }

  subscribeToMarketData(symbols: string[]): void {
    this.send({
      type: 'subscribe',
      channel: 'market_data',
      symbols: symbols
    });
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'order_created':
        this.onOrderCreated(message);
        break;
      case 'order_updated':
        this.onOrderUpdated(message);
        break;
      case 'trade_executed':
        this.onTradeExecuted(message);
        break;
      case 'price_update':
        this.onPriceUpdate(message);
        break;
      case 'ping':
        this.sendPong();
        break;
      // Handle other message types...
    }
  }

  private send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private sendPong(): void {
    this.send({
      type: 'pong',
      timestamp: new Date().toISOString()
    });
  }

  protected onOrderCreated(order: any): void {}
  protected onOrderUpdated(order: any): void {}
  protected onTradeExecuted(trade: any): void {}
  protected onPriceUpdate(price: any): void {}

  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Usage
const ws = new CantonDEXWebSocket(accessToken, accountId);
ws.connect().then(() => {
  ws.subscribeToOrders();
  ws.subscribeToTrades();
  ws.subscribeToMarketData(['AAPL/USDC', 'GOOGL/USDC']);
});
```

---

## Performance Considerations

1. **Batch Subscriptions**: Subscribe to multiple channels in one message when possible
2. **Message Filtering**: Use aggregation parameters to reduce message frequency
3. **Connection Pooling**: Reuse WebSocket connections across multiple subscriptions
4. **Backpressure Handling**: Process messages asynchronously to avoid blocking
5. **Memory Management**: Clean up event listeners and unsubscribe when no longer needed

---

## See Also

- [REST API Documentation](./OPENAPI-SPEC.md)
- [Authentication Details](./AUTHENTICATION.md)
- [Rate Limiting](./RATE-LIMITING.md)
