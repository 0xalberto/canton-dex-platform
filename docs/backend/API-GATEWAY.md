# API Gateway Service Documentation

## Overview

The API Gateway is the single entry point for all client requests in the CantonDEX system. It provides authentication, request routing, rate limiting, and coordination between frontend applications and backend microservices.

**Technology Stack**: Python 3.11, FastAPI, structlog, Prometheus
**Port**: 8000
**Repository Path**: `/home/user/cantondex/cantondex-backend/api-gateway`

---

## Architecture

### Request Flow

```
Client Request
    ↓
[CORS Middleware]
    ↓
[Request ID Generation]
    ↓
[Authentication (OAuth 2.0 + JWT)]
    ↓
[Request Validation]
    ↓
[Rate Limiting]
    ↓
[Route Handler]
    ↓
[Microservice Call] → Matching Engine / Settlement / Risk / Compliance / Notification
    ↓
[Response Processing]
    ↓
[Metrics Collection]
    ↓
Client Response
```

### Key Components

1. **Authentication Layer** (`auth.py`)
   - OAuth 2.0 implementation with Keycloak
   - JWT token validation and refresh
   - Role-based access control (RBAC)
   - Account scope isolation

2. **Request Router** (`main.py`)
   - FastAPI application instance
   - Route definition and delegation
   - Request/response middleware

3. **Rate Limiter**
   - Per-account rate limiting
   - Token bucket algorithm
   - Redis-backed state storage

4. **Logging & Metrics**
   - Structured logging with structlog
   - Prometheus metrics export
   - Request tracing with correlation IDs

---

## Configuration

### Environment Variables

```bash
# Application
ENVIRONMENT=production          # development, staging, production
API_HOST=0.0.0.0               # API listen address
API_PORT=8000                  # API listen port
LOG_LEVEL=INFO                 # Logging level

# Database
DB_HOST=postgres               # PostgreSQL host
DB_PORT=5432                   # PostgreSQL port
DB_NAME=cantondex              # Database name
DB_USER=cantondex_user         # Database user
DB_PASSWORD=secure_password    # Database password

# Redis (Cache & Session Store)
REDIS_HOST=redis               # Redis host
REDIS_PORT=6379                # Redis port
REDIS_PASSWORD=redis_password  # Redis password
REDIS_DB=0                     # Redis database

# Kafka (Event Publishing)
KAFKA_BOOTSTRAP_SERVERS=kafka:9092  # Kafka brokers

# Authentication
JWT_SECRET=your-secret-key     # JWT signing key
JWT_ALGORITHM=HS256            # JWT algorithm
JWT_EXPIRATION=3600            # Token expiration (seconds)

# Keycloak Integration
KEYCLOAK_URL=https://keycloak:8080     # Keycloak server
KEYCLOAK_REALM=cantondex               # Keycloak realm
KEYCLOAK_CLIENT_ID=api-gateway         # OAuth client ID
KEYCLOAK_CLIENT_SECRET=secret          # OAuth client secret

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:4200
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=GET,POST,PUT,DELETE,PATCH,OPTIONS
CORS_ALLOW_HEADERS=Content-Type,Authorization

# Rate Limiting
RATE_LIMIT_UNAUTHENTICATED=100         # Requests per minute for unauthenticated
RATE_LIMIT_AUTHENTICATED=1000          # Requests per minute for authenticated
RATE_LIMIT_ORDER_PLACEMENT=100         # Orders per minute per account
RATE_LIMIT_DATA_ENDPOINT=500           # Data requests per minute
```

---

## API Routes

### Authentication Routes

```
POST   /auth/login              - User login
POST   /auth/logout             - User logout
POST   /auth/refresh            - Refresh JWT token
POST   /auth/register           - Register new account
GET    /auth/me                 - Get current user info
```

### Account Management Routes

```
GET    /accounts/{account_id}                   - Get account details
PUT    /accounts/{account_id}                   - Update account profile
GET    /accounts/{account_id}/balance           - Get account balance
GET    /accounts/{account_id}/portfolio         - Get portfolio
GET    /accounts/{account_id}/history           - Get account history
```

### Order Management Routes

```
POST   /orders                                  - Place order
GET    /orders/{order_id}                       - Get order details
GET    /orders                                  - List orders (with filters)
PUT    /orders/{order_id}                       - Replace order
DELETE /orders/{order_id}                       - Cancel order
```

### Trade Routes

```
GET    /trades/{trade_id}                       - Get trade details
GET    /trades                                  - List trades
GET    /trades/{trade_id}/settlement            - Get trade settlement status
```

### Market Data Routes

```
GET    /markets/{symbol}/price                  - Get current price
GET    /markets/{symbol}/orderbook              - Get order book
GET    /markets/{symbol}/stats                  - Get market statistics
GET    /markets/{symbol}/history                - Get price history
GET    /markets                                 - List all markets
```

### Settlement Routes

```
GET    /settlements/{settlement_id}             - Get settlement status
GET    /settlements                             - List settlements
```

### Deposit/Withdrawal Routes

```
POST   /accounts/{account_id}/deposits          - Create deposit address
GET    /deposits/{deposit_id}                   - Get deposit status
POST   /accounts/{account_id}/withdrawals       - Request withdrawal
GET    /withdrawals/{withdrawal_id}             - Get withdrawal status
```

### Compliance Routes

```
GET    /compliance/status/{account_id}          - Get compliance status
POST   /compliance/kyc/{account_id}             - Submit KYC information
GET    /compliance/alerts                       - Get compliance alerts (admin only)
```

### Health Routes

```
GET    /health                                  - Service health check
GET    /status                                  - Detailed status
GET    /metrics                                 - Prometheus metrics
```

---

## Microservice Integration

### Matching Engine (gRPC)

**Service**: Order matching and execution

```python
# Client initialization
from cantondex.matching_engine import MatchingEngineClient

engine = MatchingEngineClient('matching-engine:50051')

# Place order
response = engine.place_order(
    account_id='acc_123',
    symbol='AAPL/USDC',
    side='buy',
    quantity=100,
    price=150.50,
    order_type='limit'
)
```

**gRPC Endpoints**:
- `PlaceOrder` - Place new order
- `CancelOrder` - Cancel existing order
- `ReplaceOrder` - Replace order
- `GetOrderStatus` - Get order details

---

### Settlement Coordinator (gRPC)

**Service**: Atomic delivery-vs-payment settlement

```python
from cantondex.settlement import SettlementCoordinator

coordinator = SettlementCoordinator('settlement-coordinator:8003')

# Settle trade
settlement = coordinator.settle_trade(
    buyer_account_id='acc_buyer',
    seller_account_id='acc_seller',
    symbol='AAPL/USDC',
    quantity=50,
    amount=7524,
    trade_id='trd_123'
)
```

---

### Risk Management (HTTP/REST)

**Service**: Margin and risk assessment

```python
import requests

risk_service = 'http://risk-management:8002'

# Check margin availability
response = requests.post(
    f'{risk_service}/risk/check-margin',
    json={
        'account_id': 'acc_123',
        'required_margin': 75240,
        'asset_requirement': 'USDC'
    }
)
```

---

### Compliance Service (HTTP/REST)

**Service**: KYC/AML verification and trade surveillance

```python
# Check compliance status
response = requests.get(
    'http://compliance-service:8001/compliance/status/acc_123'
)

# Get alerts
alerts = requests.get(
    'http://compliance-service:8001/compliance/alerts',
    params={'account_id': 'acc_123', 'limit': 50}
)
```

---

### Notification Service (Kafka)

**Service**: Real-time notifications via WebSocket

```python
# Publishing events (automatic via middleware)
# Events are published to Kafka topics:
# - order.events
# - trade.events
# - settlement.events
# - account.events
```

---

## Database Schema

### Primary Tables

**users**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    account_type ENUM('retail', 'professional'),
    kyc_tier ENUM('tier_0', 'tier_1', 'tier_2'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    status ENUM('active', 'suspended', 'closed')
);
```

**accounts**
```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    account_number VARCHAR(20) UNIQUE,
    account_type ENUM('trading', 'custody'),
    status ENUM('active', 'inactive'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
```

**orders**
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    account_id UUID REFERENCES accounts(id),
    symbol VARCHAR(20),
    side ENUM('buy', 'sell'),
    order_type ENUM('limit', 'market', 'stop', 'stop_limit'),
    quantity DECIMAL(18, 8),
    price DECIMAL(18, 8),
    time_in_force ENUM('gtc', 'ioc', 'fok'),
    status ENUM('pending', 'filled', 'cancelled', 'rejected'),
    filled DECIMAL(18, 8) DEFAULT 0,
    average_fill_price DECIMAL(18, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    INDEX idx_account_id (account_id),
    INDEX idx_symbol (symbol),
    INDEX idx_status (status)
);
```

**trades**
```sql
CREATE TABLE trades (
    id UUID PRIMARY KEY,
    order_id UUID REFERENCES orders(id),
    account_id UUID REFERENCES accounts(id),
    symbol VARCHAR(20),
    side ENUM('buy', 'sell'),
    quantity DECIMAL(18, 8),
    price DECIMAL(18, 8),
    commission DECIMAL(18, 8),
    gross_amount DECIMAL(18, 8),
    net_amount DECIMAL(18, 8),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_account_id (account_id),
    INDEX idx_executed_at (executed_at)
);
```

---

## Logging

### Structured Logging Format

All logs are in JSON format for easy parsing and monitoring:

```json
{
  "timestamp": "2024-11-17T16:30:00.000Z",
  "level": "INFO",
  "message": "Order placed successfully",
  "logger": "api_gateway.orders",
  "request_id": "req_1234567890abcdef",
  "account_id": "acc_1234567890abcdef",
  "order_id": "ord_1234567890abcdef",
  "symbol": "AAPL/USDC",
  "quantity": 100,
  "price": 150.50,
  "duration_ms": 45
}
```

### Log Levels

- **DEBUG**: Detailed debugging information (off in production)
- **INFO**: General information messages
- **WARNING**: Warning messages for potentially problematic situations
- **ERROR**: Error messages for error conditions
- **CRITICAL**: Critical error conditions

---

## Metrics

### Prometheus Metrics Exported

**HTTP Metrics**:
```
http_requests_total{method, endpoint, status}          - Total requests
http_request_duration_seconds{method, endpoint}        - Request latency
http_request_size_bytes{method, endpoint}              - Request size
http_response_size_bytes{method, endpoint}             - Response size
```

**Business Metrics**:
```
orders_placed_total{account_id}                        - Total orders placed
orders_filled_total{account_id}                        - Total orders filled
trades_executed_total{symbol}                          - Total trades executed
trade_volume_total{symbol}                             - Total trading volume
```

**System Metrics**:
```
api_gateway_uptime_seconds                             - Service uptime
database_connection_pool_size                          - DB pool size
redis_connected                                        - Redis connection status
kafka_producer_lag                                     - Kafka producer lag
```

---

## Error Handling

### Standard Error Response

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
    "timestamp": "2024-11-17T16:30:00Z"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_REQUEST | 400 | Invalid request parameters |
| UNAUTHORIZED | 401 | Missing/invalid authentication |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict |
| INSUFFICIENT_MARGIN | 403 | Not enough margin |
| RISK_LIMIT_EXCEEDED | 422 | Risk limits exceeded |
| SERVICE_UNAVAILABLE | 503 | Microservice unavailable |
| INTERNAL_ERROR | 500 | Internal error |

---

## Running Locally

### Prerequisites

```bash
# Python 3.11+
python --version

# PostgreSQL 15
psql --version

# Redis
redis-cli --version

# Kafka (via Docker)
docker --version
```

### Installation

```bash
cd /home/user/cantondex/cantondex-backend/api-gateway

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export ENVIRONMENT=development
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=cantondex
export DB_USER=cantondex_user
export DB_PASSWORD=password
export REDIS_HOST=localhost
export REDIS_PORT=6379
```

### Running the Service

```bash
# Using uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Or using the run script
python -m api_gateway.main
```

---

## Testing

### Unit Tests

```bash
pytest tests/unit/ -v --cov=api_gateway
```

### Integration Tests

```bash
pytest tests/integration/ -v --cov=api_gateway
```

### Load Testing

```bash
# Using Locust
locust -f tests/load/locustfile.py --host=http://localhost:8000
```

---

## Production Deployment

### Docker Build

```bash
docker build -t api-gateway:latest .
docker tag api-gateway:latest <registry>/api-gateway:latest
docker push <registry>/api-gateway:latest
```

### Kubernetes Deployment

```bash
kubectl apply -f infrastructure/kubernetes/base/deployments.yaml
kubectl scale deployment api-gateway --replicas=3
```

### Health Checks

```bash
# Liveness probe
curl http://localhost:8000/health

# Readiness probe
curl http://localhost:8000/status
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Check connection
psql -h localhost -U cantondex_user -d cantondex -c "SELECT 1"

# Check logs
docker logs cantondex-postgres
```

### Redis Connection Issues

```bash
# Check connection
redis-cli -h localhost -p 6379 ping

# Monitor events
redis-cli MONITOR
```

### Kafka Connection Issues

```bash
# Check broker connectivity
kafka-broker-api-versions.sh --bootstrap-server localhost:9092

# Check topic status
kafka-topics.sh --bootstrap-server localhost:9092 --list
```

---

## References

- [REST API Specification](../api/OPENAPI-SPEC.md)
- [WebSocket API Documentation](../api/WEBSOCKET-API.md)
- [Authentication Guide](../api/AUTHENTICATION.md)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [structlog Documentation](https://www.structlog.org/)
