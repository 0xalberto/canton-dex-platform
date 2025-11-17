# CantonDEX OpenAPI 3.0 Specification

## Overview

This document provides the complete OpenAPI 3.0 specification for all REST API endpoints in the CantonDEX system. The API follows RESTful conventions and uses JSON for request/response payloads.

**API Base URL**: `https://api.cantondex.io/v1`
**API Gateway Port (Local)**: `8000`

---

## Authentication

All API endpoints (except `/auth/login` and `/health`) require authentication using JWT (JSON Web Tokens) passed via the `Authorization` header.

### Authentication Methods

#### 1. Login Endpoint
```http
POST /auth/login
Content-Type: application/json

{
  "email": "trader@cantondex.io",
  "password": "secure_password"
}
```

**Response (200 OK)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Token Refresh
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 3. Using Bearer Token
```http
GET /accounts/balance
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Account Management API

### 1. Create Account

**Endpoint**: `POST /accounts`

**Request**:
```json
{
  "email": "trader@example.com",
  "password": "secure_password",
  "first_name": "John",
  "last_name": "Doe",
  "account_type": "professional",
  "kyc_tier": "tier_1"
}
```

**Response (201 Created)**:
```json
{
  "account_id": "acc_1234567890abcdef",
  "email": "trader@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "account_type": "professional",
  "kyc_tier": "tier_1",
  "created_at": "2024-11-17T10:30:00Z",
  "status": "active"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input
- `409 Conflict`: Email already registered

---

### 2. Get Account Profile

**Endpoint**: `GET /accounts/{account_id}`

**Parameters**:
- `account_id` (path, required): Account identifier

**Response (200 OK)**:
```json
{
  "account_id": "acc_1234567890abcdef",
  "email": "trader@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "account_type": "professional",
  "kyc_tier": "tier_1",
  "created_at": "2024-11-17T10:30:00Z",
  "last_login": "2024-11-17T14:22:00Z",
  "status": "active",
  "risk_profile": {
    "daily_loss_limit": 10000,
    "position_limit": 5000000
  }
}
```

---

### 3. Update Account Profile

**Endpoint**: `PUT /accounts/{account_id}`

**Request**:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890"
}
```

**Response (200 OK)**:
```json
{
  "account_id": "acc_1234567890abcdef",
  "email": "trader@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "updated_at": "2024-11-17T15:00:00Z"
}
```

---

### 4. Get Account Balance

**Endpoint**: `GET /accounts/{account_id}/balance`

**Response (200 OK)**:
```json
{
  "account_id": "acc_1234567890abcdef",
  "total_balance": 1000000,
  "available_balance": 850000,
  "reserved_balance": 150000,
  "currency": "USD",
  "last_updated": "2024-11-17T15:00:00Z",
  "assets": [
    {
      "asset_id": "AAPL",
      "quantity": 100,
      "market_value": 15000,
      "cost_basis": 14800
    },
    {
      "asset_id": "USDC",
      "quantity": 850000,
      "market_value": 850000,
      "cost_basis": 850000
    }
  ]
}
```

---

## Order Management API

### 1. Place Order

**Endpoint**: `POST /orders`

**Request**:
```json
{
  "account_id": "acc_1234567890abcdef",
  "symbol": "AAPL/USDC",
  "side": "buy",
  "order_type": "limit",
  "quantity": 100,
  "price": 150.50,
  "time_in_force": "gtc",
  "post_only": false,
  "hidden": true,
  "ioc_limit": 50
}
```

**Parameters Explanation**:
- `side`: "buy" or "sell"
- `order_type`: "limit", "market", "stop", "stop_limit"
- `time_in_force`: "gtc" (Good Till Cancelled), "ioc" (Immediate or Cancel), "fok" (Fill or Kill)
- `hidden`: If true, order not visible in public order book
- `ioc_limit`: Max execution price impact for IOC orders

**Response (201 Created)**:
```json
{
  "order_id": "ord_1234567890abcdef",
  "account_id": "acc_1234567890abcdef",
  "symbol": "AAPL/USDC",
  "side": "buy",
  "order_type": "limit",
  "quantity": 100,
  "price": 150.50,
  "status": "pending",
  "filled": 0,
  "average_fill_price": 0,
  "created_at": "2024-11-17T15:30:00Z",
  "updated_at": "2024-11-17T15:30:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid order parameters
- `403 Forbidden`: Insufficient margin
- `422 Unprocessable Entity`: Risk limits exceeded

---

### 2. Get Order Status

**Endpoint**: `GET /orders/{order_id}`

**Response (200 OK)**:
```json
{
  "order_id": "ord_1234567890abcdef",
  "account_id": "acc_1234567890abcdef",
  "symbol": "AAPL/USDC",
  "side": "buy",
  "order_type": "limit",
  "quantity": 100,
  "price": 150.50,
  "status": "partially_filled",
  "filled": 50,
  "average_fill_price": 150.45,
  "created_at": "2024-11-17T15:30:00Z",
  "updated_at": "2024-11-17T15:31:00Z"
}
```

---

### 3. List Orders

**Endpoint**: `GET /orders?account_id={account_id}&status={status}&limit={limit}&offset={offset}`

**Query Parameters**:
- `account_id` (required): Account identifier
- `status` (optional): Filter by status (pending, filled, cancelled)
- `symbol` (optional): Filter by trading pair
- `limit` (optional, default=20): Number of results
- `offset` (optional, default=0): Pagination offset

**Response (200 OK)**:
```json
{
  "orders": [
    {
      "order_id": "ord_1234567890abcdef",
      "account_id": "acc_1234567890abcdef",
      "symbol": "AAPL/USDC",
      "side": "buy",
      "order_type": "limit",
      "quantity": 100,
      "price": 150.50,
      "status": "filled",
      "filled": 100,
      "average_fill_price": 150.48,
      "created_at": "2024-11-17T15:30:00Z",
      "updated_at": "2024-11-17T15:31:00Z"
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

---

### 4. Cancel Order

**Endpoint**: `DELETE /orders/{order_id}`

**Request**:
```json
{
  "account_id": "acc_1234567890abcdef"
}
```

**Response (200 OK)**:
```json
{
  "order_id": "ord_1234567890abcdef",
  "status": "cancelled",
  "cancelled_at": "2024-11-17T15:35:00Z"
}
```

---

### 5. Replace Order

**Endpoint**: `PUT /orders/{order_id}`

**Request**:
```json
{
  "quantity": 120,
  "price": 151.00
}
```

**Response (200 OK)**:
```json
{
  "order_id": "ord_1234567890abcdef",
  "quantity": 120,
  "price": 151.00,
  "updated_at": "2024-11-17T15:36:00Z"
}
```

---

## Trade Execution API

### 1. Get Trade Details

**Endpoint**: `GET /trades/{trade_id}`

**Response (200 OK)**:
```json
{
  "trade_id": "trd_1234567890abcdef",
  "order_id": "ord_1234567890abcdef",
  "account_id": "acc_1234567890abcdef",
  "symbol": "AAPL/USDC",
  "side": "buy",
  "quantity": 50,
  "price": 150.48,
  "commission": 7.52,
  "gross_amount": 7524,
  "net_amount": 7516.48,
  "executed_at": "2024-11-17T15:31:00Z",
  "settlement_status": "pending",
  "settlement_date": "2024-11-19T00:00:00Z"
}
```

---

### 2. List Account Trades

**Endpoint**: `GET /trades?account_id={account_id}&start_date={date}&end_date={date}&limit={limit}`

**Query Parameters**:
- `account_id` (required): Account identifier
- `start_date` (optional): ISO 8601 format
- `end_date` (optional): ISO 8601 format
- `symbol` (optional): Filter by trading pair
- `limit` (optional, default=50): Number of results

**Response (200 OK)**:
```json
{
  "trades": [
    {
      "trade_id": "trd_1234567890abcdef",
      "order_id": "ord_1234567890abcdef",
      "account_id": "acc_1234567890abcdef",
      "symbol": "AAPL/USDC",
      "side": "buy",
      "quantity": 50,
      "price": 150.48,
      "commission": 7.52,
      "executed_at": "2024-11-17T15:31:00Z",
      "settlement_status": "pending"
    }
  ],
  "total": 234,
  "limit": 50
}
```

---

## Market Data API

### 1. Get Current Price

**Endpoint**: `GET /markets/{symbol}/price`

**Response (200 OK)**:
```json
{
  "symbol": "AAPL/USDC",
  "bid": 150.45,
  "ask": 150.50,
  "mid": 150.475,
  "last_price": 150.48,
  "high_24h": 152.00,
  "low_24h": 149.50,
  "volume_24h": 1250000,
  "timestamp": "2024-11-17T15:45:00Z"
}
```

---

### 2. Get Order Book

**Endpoint**: `GET /markets/{symbol}/orderbook?depth={depth}`

**Query Parameters**:
- `symbol` (required): Trading pair
- `depth` (optional, default=20): Number of levels on each side

**Response (200 OK)**:
```json
{
  "symbol": "AAPL/USDC",
  "bids": [
    {"price": 150.45, "quantity": 5000},
    {"price": 150.40, "quantity": 10000},
    {"price": 150.35, "quantity": 15000}
  ],
  "asks": [
    {"price": 150.50, "quantity": 5000},
    {"price": 150.55, "quantity": 10000},
    {"price": 150.60, "quantity": 15000}
  ],
  "timestamp": "2024-11-17T15:45:00Z"
}
```

---

### 3. Get Market Statistics

**Endpoint**: `GET /markets/{symbol}/stats?period={period}`

**Query Parameters**:
- `symbol` (required): Trading pair
- `period` (optional, default=1h): "1m", "5m", "15m", "1h", "1d"

**Response (200 OK)**:
```json
{
  "symbol": "AAPL/USDC",
  "period": "1h",
  "open": 150.20,
  "high": 151.00,
  "low": 150.15,
  "close": 150.48,
  "volume": 125000,
  "trades_count": 450,
  "vwap": 150.42,
  "timestamp": "2024-11-17T15:45:00Z"
}
```

---

## Settlement API

### 1. Get Settlement Status

**Endpoint**: `GET /settlements/{settlement_id}`

**Response (200 OK)**:
```json
{
  "settlement_id": "set_1234567890abcdef",
  "trade_id": "trd_1234567890abcdef",
  "buyer_account_id": "acc_buyer1234567",
  "seller_account_id": "acc_seller1234567",
  "symbol": "AAPL/USDC",
  "quantity": 50,
  "amount": 7524,
  "status": "confirmed",
  "dvp_atomic_transaction": "dvp_tx_1234567890",
  "securities_ledger_reference": "sec_ref_1234567890",
  "cash_ledger_reference": "cash_ref_1234567890",
  "settlement_date": "2024-11-19T00:00:00Z",
  "created_at": "2024-11-17T15:31:00Z",
  "confirmed_at": "2024-11-17T15:31:30Z"
}
```

---

### 2. List Account Settlements

**Endpoint**: `GET /settlements?account_id={account_id}&status={status}`

**Query Parameters**:
- `account_id` (required): Account identifier
- `status` (optional): "pending", "confirmed", "failed"
- `start_date` (optional): ISO 8601 format
- `end_date` (optional): ISO 8601 format

**Response (200 OK)**:
```json
{
  "settlements": [
    {
      "settlement_id": "set_1234567890abcdef",
      "trade_id": "trd_1234567890abcdef",
      "symbol": "AAPL/USDC",
      "quantity": 50,
      "amount": 7524,
      "status": "confirmed",
      "settlement_date": "2024-11-19T00:00:00Z",
      "confirmed_at": "2024-11-17T15:31:30Z"
    }
  ],
  "total": 45
}
```

---

## Compliance API

### 1. Get Compliance Status

**Endpoint**: `GET /compliance/status/{account_id}`

**Response (200 OK)**:
```json
{
  "account_id": "acc_1234567890abcdef",
  "kyc_status": "approved",
  "kyc_tier": "tier_2",
  "aml_status": "cleared",
  "sanctions_status": "cleared",
  "pep_status": "cleared",
  "daily_limit": 10000000,
  "daily_used": 2500000,
  "daily_remaining": 7500000,
  "last_kyc_update": "2024-09-15T10:00:00Z",
  "next_kyc_review": "2025-09-15T00:00:00Z"
}
```

---

### 2. Submit KYC Information

**Endpoint**: `POST /compliance/kyc/{account_id}`

**Request**:
```json
{
  "full_name": "John Doe",
  "date_of_birth": "1990-01-15",
  "nationality": "US",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "US"
  },
  "employment": {
    "employer": "Goldman Sachs",
    "position": "Senior Trader",
    "years_experience": 10
  },
  "documents": {
    "passport_id": "doc_passport_1234",
    "address_proof_id": "doc_address_1234",
    "employment_proof_id": "doc_employment_1234"
  }
}
```

**Response (202 Accepted)**:
```json
{
  "account_id": "acc_1234567890abcdef",
  "kyc_status": "pending_review",
  "submission_id": "sub_1234567890abcdef",
  "submitted_at": "2024-11-17T15:50:00Z",
  "estimated_review_time": "24 hours"
}
```

---

## Deposit & Withdrawal API

### 1. Create Deposit Address

**Endpoint**: `POST /accounts/{account_id}/deposits`

**Request**:
```json
{
  "currency": "USDC",
  "blockchain": "ethereum"
}
```

**Response (201 Created)**:
```json
{
  "deposit_id": "dep_1234567890abcdef",
  "account_id": "acc_1234567890abcdef",
  "currency": "USDC",
  "blockchain": "ethereum",
  "address": "0x1234567890abcdef1234567890abcdef12345678",
  "tag": null,
  "min_deposit": 100,
  "created_at": "2024-11-17T16:00:00Z"
}
```

---

### 2. Get Deposit Status

**Endpoint**: `GET /deposits/{deposit_id}`

**Response (200 OK)**:
```json
{
  "deposit_id": "dep_1234567890abcdef",
  "account_id": "acc_1234567890abcdef",
  "currency": "USDC",
  "blockchain": "ethereum",
  "amount": 10000,
  "transaction_hash": "0xabcd1234...",
  "confirmations": 12,
  "required_confirmations": 12,
  "status": "confirmed",
  "created_at": "2024-11-17T16:00:00Z",
  "confirmed_at": "2024-11-17T16:15:00Z"
}
```

---

### 3. Request Withdrawal

**Endpoint**: `POST /accounts/{account_id}/withdrawals`

**Request**:
```json
{
  "currency": "USDC",
  "amount": 5000,
  "blockchain": "ethereum",
  "address": "0xabcdef1234567890abcdef1234567890abcdef12",
  "tag": null
}
```

**Response (201 Created)**:
```json
{
  "withdrawal_id": "wth_1234567890abcdef",
  "account_id": "acc_1234567890abcdef",
  "currency": "USDC",
  "amount": 5000,
  "blockchain": "ethereum",
  "address": "0xabcdef1234567890abcdef1234567890abcdef12",
  "status": "pending",
  "fee": 5,
  "net_amount": 4995,
  "created_at": "2024-11-17T16:05:00Z"
}
```

---

### 4. Get Withdrawal Status

**Endpoint**: `GET /withdrawals/{withdrawal_id}`

**Response (200 OK)**:
```json
{
  "withdrawal_id": "wth_1234567890abcdef",
  "account_id": "acc_1234567890abcdef",
  "currency": "USDC",
  "amount": 5000,
  "blockchain": "ethereum",
  "address": "0xabcdef1234567890abcdef1234567890abcdef12",
  "status": "confirmed",
  "transaction_hash": "0xabcd1234...",
  "fee": 5,
  "net_amount": 4995,
  "created_at": "2024-11-17T16:05:00Z",
  "confirmed_at": "2024-11-17T16:20:00Z"
}
```

---

## Health & Status API

### 1. API Health Check

**Endpoint**: `GET /health`

**Response (200 OK)**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-11-17T16:10:00Z",
  "services": {
    "api_gateway": "healthy",
    "matching_engine": "healthy",
    "settlement_coordinator": "healthy",
    "risk_management": "healthy",
    "compliance_service": "healthy",
    "notification_service": "healthy",
    "database": "healthy",
    "redis": "healthy",
    "kafka": "healthy"
  }
}
```

---

### 2. Service Status

**Endpoint**: `GET /status`

**Response (200 OK)**:
```json
{
  "timestamp": "2024-11-17T16:10:00Z",
  "uptime_seconds": 864000,
  "services": {
    "api_gateway": {
      "status": "healthy",
      "uptime": "99.99%",
      "response_time_ms": 5
    },
    "matching_engine": {
      "status": "healthy",
      "uptime": "99.99%",
      "orders_processed": 1250000,
      "avg_latency_ms": 0.5
    },
    "settlement_coordinator": {
      "status": "healthy",
      "uptime": "99.99%",
      "settlements_processed": 45000
    },
    "risk_management": {
      "status": "healthy",
      "uptime": "99.99%"
    },
    "compliance_service": {
      "status": "healthy",
      "uptime": "99.99%"
    },
    "notification_service": {
      "status": "healthy",
      "uptime": "99.99%",
      "notifications_sent": 125000
    }
  }
}
```

---

## Error Handling

All API errors follow a standard error response format:

```json
{
  "error": {
    "code": "INSUFFICIENT_MARGIN",
    "message": "Insufficient margin to place order",
    "details": {
      "required_margin": 75240,
      "available_margin": 50000,
      "shortfall": 25240
    },
    "request_id": "req_1234567890abcdef",
    "timestamp": "2024-11-17T16:10:00Z"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_REQUEST | 400 | Invalid request parameters |
| UNAUTHORIZED | 401 | Missing or invalid authentication |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict |
| INSUFFICIENT_MARGIN | 403 | Not enough margin for order |
| RISK_LIMIT_EXCEEDED | 422 | Risk limits exceeded |
| SYSTEM_OVERLOADED | 429 | Rate limit exceeded |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |
| INTERNAL_ERROR | 500 | Internal server error |

---

## Rate Limiting

All API endpoints are rate-limited to prevent abuse:

- **Unauthenticated endpoints**: 100 requests per minute per IP
- **Authenticated endpoints**: 1,000 requests per minute per account
- **Order placement**: 100 orders per minute per account
- **Data endpoints**: 500 requests per minute per account

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1700239440
```

---

## API Pagination

List endpoints support pagination using `limit` and `offset` parameters:

```http
GET /orders?account_id=acc_123&limit=20&offset=0
```

Response structure:

```json
{
  "orders": [...],
  "total": 245,
  "limit": 20,
  "offset": 0,
  "has_more": true
}
```

---

## API Versioning

The API uses URL-based versioning. Current version is `v1`.

- Current: `https://api.cantondex.io/v1/...`
- Future versions will be available as `https://api.cantondex.io/v2/...`

---

## Testing

### Sample cURL Requests

**Login**:
```bash
curl -X POST https://api.cantondex.io/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "trader@example.com",
    "password": "secure_password"
  }'
```

**Place Order**:
```bash
curl -X POST https://api.cantondex.io/v1/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "acc_1234567890abcdef",
    "symbol": "AAPL/USDC",
    "side": "buy",
    "order_type": "limit",
    "quantity": 100,
    "price": 150.50
  }'
```

**Get Account Balance**:
```bash
curl -X GET https://api.cantondex.io/v1/accounts/acc_1234567890abcdef/balance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Documentation Links

- **WebSocket API**: See [WEBSOCKET-API.md](./WEBSOCKET-API.md)
- **Canton Integration**: See [CANTON-INTEGRATION.md](./CANTON-INTEGRATION.md)
- **Authentication Details**: See [AUTHENTICATION.md](./AUTHENTICATION.md)
- **Rate Limiting**: See [RATE-LIMITING.md](./RATE-LIMITING.md)
