# Risk Management Service Documentation

## Overview

The Risk Management Service provides real-time margin calculation, risk assessment, and position monitoring. It ensures traders maintain sufficient margin for open positions and enforces risk limits to protect the platform.

**Technology Stack**: Python 3.11, FastAPI, Redis (for caching)
**Port**: 8002
**Repository Path**: `/home/user/cantondex/cantondex-backend/risk-management`
**Performance Target**: <50ms P95 risk check

---

## Key Features

1. **Margin Calculation**
   - Real-time margin requirement calculation
   - Position-based margin (SPAN model)
   - Scenario analysis for stress testing

2. **Risk Limits**
   - Daily loss limits per account
   - Position size limits per symbol
   - Aggregate portfolio limits
   - Counterparty exposure limits

3. **Monitoring**
   - Real-time position tracking
   - Margin level monitoring
   - Unrealized P&L calculation
   - VaR and stress test metrics

4. **Alerts & Actions**
   - Margin call notifications
   - Liquidation warnings
   - Automatic position reduction
   - Emergency close-out procedures

---

## Risk Models

### Margin Calculation

**Initial Margin (IM)**:
```
IM = (Position Quantity × Mid Price) × IM Percentage

For AAPL/USDC:
  - Position: 100 shares
  - Mid Price: $150.475
  - IM %: 20% (for equities)
  - IM = 100 × 150.475 × 0.20 = $3,009.50
```

**Maintenance Margin (MM)**:
```
MM = IM × 50%
MM = $3,009.50 × 0.50 = $1,504.75
```

**Available Margin**:
```
Available Margin = Account Equity - Initial Margin
Account Equity = Cash Balance + Unrealized P&L

Example:
  - Cash: $100,000
  - Positions P&L: +$2,000
  - Account Equity: $102,000
  - Initial Margin: $3,009.50
  - Available Margin: $98,990.50
```

### Margin Levels

```
Level 1: Equity ≥ IM × 2.0         (Safe)
Level 2: IM × 1.5 ≤ Equity < IM × 2.0  (Caution)
Level 3: MM ≤ Equity < IM × 1.5    (Warning)
Level 4: Equity < MM                (Danger)
```

### Position-Based Limits

**Notional Exposure Limit**:
```
Max Position Size = Account Equity × 3.0

Example:
  - Account Equity: $100,000
  - Max Notional: $300,000
  - Current Position: $150,000 (at mid price)
  - Available: $150,000
```

**Concentration Limit**:
```
Per Symbol Limit = Account Equity × Symbol Limit %

For major symbols: 20%
For minor symbols: 10%

Example:
  - Account Equity: $100,000
  - AAPL Position: $20,000 (20%)
  - Max AAPL: $20,000
```

---

## REST API Endpoints

### 1. Check Margin Availability

**Endpoint**: `POST /risk/check-margin`

**Request**:
```json
{
  "account_id": "acc_1234567890abcdef",
  "symbol": "AAPL/USDC",
  "side": "buy",
  "quantity": 100,
  "price": 150.50
}
```

**Response (200 OK)**:
```json
{
  "account_id": "acc_1234567890abcdef",
  "check_passed": true,
  "current_margin_level": 1.8,
  "required_margin": 3009.50,
  "available_margin": 98990.50,
  "account_equity": 102000,
  "margin_utilization_percent": 2.95
}
```

**Response (403 Forbidden)** (Insufficient margin):
```json
{
  "account_id": "acc_1234567890abcdef",
  "check_passed": false,
  "reason": "insufficient_margin",
  "current_margin_level": 0.85,
  "required_margin": 5015.25,
  "available_margin": -1005.25,
  "shortfall": 1005.25,
  "account_equity": 102000
}
```

### 2. Get Account Risk

**Endpoint**: `GET /risk/account/{account_id}`

**Response**:
```json
{
  "account_id": "acc_1234567890abcdef",
  "margin_level": 1.8,
  "account_equity": 102000,
  "cash_balance": 100000,
  "unrealized_pnl": 2000,
  "initial_margin_requirement": 5015.25,
  "maintenance_margin_requirement": 2507.62,
  "available_margin": 96984.75,
  "margin_utilization_percent": 4.92,
  "positions": [
    {
      "symbol": "AAPL/USDC",
      "quantity": 100,
      "mid_price": 150.475,
      "position_value": 15047.50,
      "unrealized_pnl": 50,
      "margin_requirement": 3009.50
    }
  ],
  "risk_limits": {
    "daily_loss_limit": 10000,
    "daily_loss_used": 2000,
    "daily_loss_remaining": 8000
  },
  "margin_call_level": "safe"
}
```

### 3. Get Position Risk

**Endpoint**: `GET /risk/position/{account_id}/{symbol}`

**Response**:
```json
{
  "account_id": "acc_1234567890abcdef",
  "symbol": "AAPL/USDC",
  "quantity": 100,
  "average_entry_price": 149.975,
  "current_mid_price": 150.475,
  "position_value": 15047.50,
  "unrealized_pnl": 50,
  "unrealized_pnl_percent": 0.33,
  "margin_requirement": 3009.50,
  "concentration_percent": 14.7,
  "concentration_limit_percent": 20,
  "risk_warning": "normal"
}
```

### 4. Get Daily Risk Summary

**Endpoint**: `GET /risk/daily-summary/{account_id}`

**Response**:
```json
{
  "account_id": "acc_1234567890abcdef",
  "date": "2024-11-17",
  "opening_balance": 100000,
  "current_equity": 102000,
  "daily_pnl": 2000,
  "daily_pnl_percent": 2.0,
  "highest_equity": 103500,
  "lowest_equity": 100500,
  "max_daily_loss": 500,
  "margin_level": 1.8,
  "daily_loss_limit": 10000,
  "daily_loss_used": 2000,
  "trades_count": 15,
  "closed_positions": 3,
  "open_positions": 4
}
```

---

## Margin Call Workflow

### Margin Call Levels

```
Safe Zone (Margin Level > 1.5)
    ↓ (Margin Level drops below 1.5)
Warning Zone (1.0 < Margin Level ≤ 1.5)
    ├─ Warning notification sent
    ├─ Post only orders only
    ├─ Hedge orders allowed
    ↓
Liquidation Zone (Margin Level ≤ 1.0)
    ├─ Margin call issued
    ├─ New orders rejected
    ├─ Force liquidation of positions
    ├─ Liquidation orders executed ASAP
    ↓
Emergency Close-out (Margin Level < 0.0)
    ├─ Account locked
    ├─ All positions forcibly liquidated
    ├─ Compliance notified
    ├─ Legal team engaged
    ↓
Account Recovery / Resolution
```

### Margin Call Response

```python
async def handle_margin_call(account_id: str):
    account = await get_account(account_id)
    margin_level = calculate_margin_level(account)

    if margin_level < 1.0:
        # Issue margin call
        margin_call = MarginCall(
            account_id=account_id,
            margin_level=margin_level,
            issued_at=datetime.now(),
            deadline=datetime.now() + timedelta(hours=24)
        )

        # Notify trader
        await notify_margin_call(account_id, margin_level)

        # Restrict trading
        account.status = AccountStatus.MARGIN_CALL

        # Optional: Begin liquidation if margin negative
        if margin_level < 0:
            await liquidate_account(account_id)

    elif margin_level < 1.5:
        # Send warning
        await send_warning_notification(account_id, margin_level)
```

---

## Configuration

### Environment Variables

```bash
# Application
ENVIRONMENT=production
LOG_LEVEL=INFO

# Redis (Caching)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=password

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=cantondex
DB_USER=cantondex_user
DB_PASSWORD=password

# Risk Parameters
INITIAL_MARGIN_PERCENT_EQUITY=20    # 20% for equities
INITIAL_MARGIN_PERCENT_CRYPTO=30    # 30% for crypto
MAINTENANCE_MARGIN_PERCENT=50       # 50% of IM

# Position Limits
MAX_NOTIONAL_MULTIPLIER=3.0         # 3x equity
CONCENTRATION_LIMIT_MAJOR=20        # 20% for major symbols
CONCENTRATION_LIMIT_MINOR=10        # 10% for minor symbols

# Daily Limits
DEFAULT_DAILY_LOSS_LIMIT=10000      # $10,000
DEFAULT_DAILY_TRADE_LIMIT=1000000   # $1,000,000

# Margin Levels
MARGIN_WARNING_LEVEL=1.5
MARGIN_LIQUIDATION_LEVEL=1.0
MARGIN_EMERGENCY_LEVEL=0.0
```

---

## Database Schema

### risk_parameters Table

```sql
CREATE TABLE risk_parameters (
    id UUID PRIMARY KEY,
    account_id UUID REFERENCES accounts(id),
    symbol VARCHAR(20),

    initial_margin_percent DECIMAL(5, 2) DEFAULT 20.0,
    maintenance_margin_percent DECIMAL(5, 2) DEFAULT 10.0,

    max_position_notional DECIMAL(18, 2),
    concentration_limit_percent DECIMAL(5, 2) DEFAULT 20.0,

    daily_loss_limit DECIMAL(18, 2) DEFAULT 10000.0,
    daily_trade_limit DECIMAL(18, 2) DEFAULT 1000000.0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,

    INDEX idx_account_id (account_id)
);
```

---

## Running Locally

### Installation

```bash
cd /home/user/cantondex/cantondex-backend/risk-management

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Running the Service

```bash
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

---

## References

- [API Gateway Integration](./API-GATEWAY.md)
- [Matching Engine](./MATCHING-ENGINE.md)
- [Compliance Service](./COMPLIANCE-SERVICE.md)
