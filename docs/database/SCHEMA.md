# CantonDEX Database Schema Documentation

## Overview

This document provides comprehensive documentation of all database tables, relationships, indexes, and constraints in the CantonDEX system. The primary database is PostgreSQL 15.3 with TimescaleDB extension for time-series data.

**Database Name**: `cantondex`
**User**: `cantondex_user`
**Port**: 5432

---

## ER Diagram (Simplified)

```
┌─────────────────────┐
│      users          │
│─────────────────────│
│ id (PK)             │
│ email (UNIQUE)      │
│ password_hash       │
│ first_name          │
│ last_name           │
│ kyc_tier            │
│ created_at          │
└──────────┬──────────┘
           │
           │ 1:N
           ↓
┌─────────────────────┐
│    accounts         │
│─────────────────────│
│ id (PK)             │
│ user_id (FK)        │
│ account_number      │
│ status              │
│ created_at          │
└──┬─────────────────┬┘
   │                 │
   │ 1:N             │ 1:N
   ↓                 ↓
┌─────────────────────┐
│     orders          │
│─────────────────────│
│ id (PK)             │
│ account_id (FK)     │
│ symbol              │
│ quantity            │
│ price               │
│ status              │
│ created_at          │
└────────┬────────────┘
         │
         │ 1:N
         ↓
┌──────────────────────┐
│      trades          │
│──────────────────────│
│ id (PK)              │
│ order_id (FK)        │
│ account_id (FK)      │
│ quantity             │
│ price                │
│ executed_at          │
└──────────┬───────────┘
           │
           │ 1:1
           ↓
┌──────────────────────┐
│   settlements        │
│──────────────────────│
│ id (PK)              │
│ trade_id (FK)        │
│ buyer_account_id (FK)│
│ seller_account_id(FK)│
│ status               │
│ settlement_date      │
└──────────────────────┘
```

---

## Core Tables

### 1. users Table

Stores user account information and authentication credentials.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    kyc_status ENUM('pending', 'approved', 'rejected', 'pending_update') DEFAULT 'pending',
    kyc_tier ENUM('tier_0', 'tier_1', 'tier_2', 'tier_3') DEFAULT 'tier_0',
    account_type ENUM('retail', 'professional', 'institutional') DEFAULT 'retail',
    status ENUM('active', 'suspended', 'closed') DEFAULT 'active',
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_kyc_status ON users(kyc_status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
```

**Column Descriptions**:
- `id`: Unique identifier (UUID)
- `email`: User email address (must be unique)
- `password_hash`: BCrypt hash of password
- `kyc_status`: Know Your Customer verification status
- `kyc_tier`: Customer risk/trading tier
- `account_type`: Retail, Professional, or Institutional
- `status`: Account status (active, suspended, closed)
- `two_factor_enabled`: Whether 2FA is enabled
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp
- `deleted_at`: Soft delete timestamp

---

### 2. accounts Table

Trading accounts for users (1 user can have multiple accounts).

```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    account_type ENUM('spot', 'margin', 'custody') DEFAULT 'spot',
    status ENUM('active', 'inactive', 'closed', 'margin_call') DEFAULT 'active',
    currency_primary VARCHAR(10) DEFAULT 'USDC',
    currency_secondary VARCHAR(10) DEFAULT 'USD',
    cash_balance DECIMAL(18, 8) DEFAULT 0,
    reserved_balance DECIMAL(18, 8) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_account_number ON accounts(account_number);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_accounts_created_at ON accounts(created_at DESC);
```

**Column Descriptions**:
- `id`: Account unique identifier
- `user_id`: Reference to parent user
- `account_number`: Public account number
- `account_type`: Spot, Margin, or Custody trading
- `status`: Account operational status
- `cash_balance`: Available cash in account
- `reserved_balance`: Cash reserved for open orders

---

### 3. orders Table

Trading orders placed by accounts.

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    client_order_id VARCHAR(255),
    symbol VARCHAR(20) NOT NULL,
    side ENUM('buy', 'sell') NOT NULL,
    order_type ENUM('limit', 'market', 'stop', 'stop_limit', 'post_only') NOT NULL,
    quantity DECIMAL(18, 8) NOT NULL,
    price DECIMAL(18, 8),
    time_in_force ENUM('gtc', 'ioc', 'fok', 'day') DEFAULT 'gtc',
    status ENUM('pending', 'accepted', 'filled', 'partially_filled', 'cancelled', 'rejected') DEFAULT 'pending',
    filled DECIMAL(18, 8) DEFAULT 0,
    average_fill_price DECIMAL(18, 8),
    commission DECIMAL(18, 8) DEFAULT 0,
    commission_rate DECIMAL(6, 4),
    hidden BOOLEAN DEFAULT FALSE,
    post_only BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP,
    cancelled_at TIMESTAMP
);

CREATE INDEX idx_orders_account_id ON orders(account_id);
CREATE INDEX idx_orders_symbol ON orders(symbol);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_account_symbol_status ON orders(account_id, symbol, status);
```

**Column Descriptions**:
- `client_order_id`: Client-provided order identifier
- `order_type`: Limit, Market, Stop, Stop-Limit
- `quantity`: Total order quantity
- `filled`: Quantity filled so far
- `average_fill_price`: Volume-weighted average fill price
- `commission`: Total commission paid
- `hidden`: Not visible in public order book
- `post_only`: Only add liquidity, no take

---

### 4. trades Table

Executed trades (matches from Matching Engine).

```sql
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    matching_engine_trade_id VARCHAR(255) UNIQUE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    symbol VARCHAR(20) NOT NULL,
    side ENUM('buy', 'sell') NOT NULL,
    quantity DECIMAL(18, 8) NOT NULL,
    price DECIMAL(18, 8) NOT NULL,
    gross_amount DECIMAL(18, 8),
    commission DECIMAL(18, 8),
    net_amount DECIMAL(18, 8),
    counter_order_id VARCHAR(255),
    counter_account_id VARCHAR(255),
    executed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trades_account_id ON trades(account_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_executed_at ON trades(executed_at DESC);
CREATE INDEX idx_trades_order_id ON trades(order_id);

-- TimescaleDB hypertable for time-series
SELECT create_hypertable('trades', 'executed_at', if_not_exists => TRUE);
```

**Column Descriptions**:
- `matching_engine_trade_id`: ID from Matching Engine
- `quantity`: Quantity traded
- `price`: Trade execution price
- `gross_amount`: quantity × price
- `commission`: Trading fees
- `net_amount`: gross_amount - commission
- `counter_order_id`: ID of order this matched against
- `counter_account_id`: Account of counter-party

---

### 5. settlements Table

Delivery-vs-Payment settlements.

```sql
CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID UNIQUE NOT NULL REFERENCES trades(id) ON DELETE RESTRICT,
    buyer_account_id UUID NOT NULL REFERENCES accounts(id),
    seller_account_id UUID NOT NULL REFERENCES accounts(id),
    symbol VARCHAR(20) NOT NULL,
    quantity DECIMAL(18, 8) NOT NULL,
    amount DECIMAL(18, 8) NOT NULL,
    status ENUM('pending', 'initiated', 'seller_securities_locked',
                'buyer_cash_locked', 'executing', 'confirmed',
                'settled', 'failed', 'partially_settled') DEFAULT 'pending',
    dvp_contract_id VARCHAR(255),
    dvp_atomic_transaction_id VARCHAR(255),
    buyer_securities_ledger_ref VARCHAR(255),
    seller_securities_ledger_ref VARCHAR(255),
    buyer_cash_ledger_ref VARCHAR(255),
    seller_cash_ledger_ref VARCHAR(255),
    settlement_date DATE NOT NULL,
    initiated_at TIMESTAMP,
    confirmed_at TIMESTAMP,
    settled_at TIMESTAMP,
    failed_at TIMESTAMP,
    failure_reason TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX idx_settlements_buyer_account_id ON settlements(buyer_account_id);
CREATE INDEX idx_settlements_seller_account_id ON settlements(seller_account_id);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_settlements_settlement_date ON settlements(settlement_date);
CREATE INDEX idx_settlements_trade_id ON settlements(trade_id);

SELECT create_hypertable('settlements', 'settlement_date', if_not_exists => TRUE);
```

---

### 6. deposits Table

Cryptocurrency deposits from users.

```sql
CREATE TABLE deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    currency VARCHAR(10) NOT NULL,
    blockchain VARCHAR(50) NOT NULL,
    amount DECIMAL(18, 8) NOT NULL,
    blockchain_address VARCHAR(255) NOT NULL,
    blockchain_tag VARCHAR(255),
    transaction_hash VARCHAR(255) UNIQUE,
    confirmations INT DEFAULT 0,
    required_confirmations INT DEFAULT 12,
    status ENUM('pending', 'confirmed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP
);

CREATE INDEX idx_deposits_account_id ON deposits(account_id);
CREATE INDEX idx_deposits_status ON deposits(status);
CREATE INDEX idx_deposits_created_at ON deposits(created_at DESC);
```

---

### 7. withdrawals Table

Cryptocurrency withdrawal requests from users.

```sql
CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    currency VARCHAR(10) NOT NULL,
    blockchain VARCHAR(50) NOT NULL,
    amount DECIMAL(18, 8) NOT NULL,
    blockchain_address VARCHAR(255) NOT NULL,
    blockchain_tag VARCHAR(255),
    fee DECIMAL(18, 8),
    net_amount DECIMAL(18, 8),
    transaction_hash VARCHAR(255),
    status ENUM('pending', 'approved', 'processing', 'confirmed', 'failed', 'cancelled') DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP
);

CREATE INDEX idx_withdrawals_account_id ON withdrawals(account_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_created_at ON withdrawals(created_at DESC);
```

---

### 8. kyc_documents Table

KYC document uploads and verification.

```sql
CREATE TABLE kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type ENUM('passport', 'drivers_license', 'national_id', 'address_proof', 'employment_proof') NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(50),
    file_size INT,
    verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    rejection_reason TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kyc_documents_user_id ON kyc_documents(user_id);
CREATE INDEX idx_kyc_documents_verification_status ON kyc_documents(verification_status);
```

---

### 9. market_data Table

OHLCV candle data for symbols.

```sql
CREATE TABLE market_data (
    time TIMESTAMP NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    open DECIMAL(18, 8) NOT NULL,
    high DECIMAL(18, 8) NOT NULL,
    low DECIMAL(18, 8) NOT NULL,
    close DECIMAL(18, 8) NOT NULL,
    volume DECIMAL(18, 8) NOT NULL,
    trade_count INT,
    vwap DECIMAL(18, 8),
    PRIMARY KEY (symbol, time)
);

-- TimescaleDB hypertable for time-series
SELECT create_hypertable('market_data', 'time', if_not_exists => TRUE);

CREATE INDEX idx_market_data_symbol ON market_data(symbol);
```

---

### 10. audit_logs Table

Comprehensive audit trail for compliance.

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    account_id UUID REFERENCES accounts(id),
    event_type VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    action VARCHAR(50),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

SELECT create_hypertable('audit_logs', 'created_at', if_not_exists => TRUE);
```

---

## Constraints & Referential Integrity

### Foreign Keys

All foreign keys use proper referential integrity with appropriate cascade rules:

```sql
-- Cascade deletes when user is deleted
accounts.user_id → users.id (ON DELETE CASCADE)

-- Restrict deletes when account has orders
orders.account_id → accounts.id (ON DELETE RESTRICT)

-- Cascade deletes when order is cancelled
trades.order_id → orders.id (ON DELETE RESTRICT)
```

### Unique Constraints

```sql
-- Email must be unique
UNIQUE(email) ON users

-- Account number must be unique
UNIQUE(account_number) ON accounts

-- One settlement per trade
UNIQUE(trade_id) ON settlements

-- Transaction hashes must be unique
UNIQUE(transaction_hash) ON deposits
UNIQUE(transaction_hash) ON withdrawals
```

---

## Indexes Strategy

### Query Optimization Indexes

**Orders by Account & Status**:
```sql
CREATE INDEX idx_orders_account_symbol_status
ON orders(account_id, symbol, status);
```

**Trades by Account**:
```sql
CREATE INDEX idx_trades_account_executed_at
ON trades(account_id, executed_at DESC);
```

**Settlements by Date**:
```sql
CREATE INDEX idx_settlements_buyer_settlement_date
ON settlements(buyer_account_id, settlement_date DESC);
```

### Time-Series Indexes

TimescaleDB automatically creates optimal indexes for time-series tables:

```sql
-- Automatic for trades hypertable
-- Automatic for market_data hypertable
-- Automatic for audit_logs hypertable
```

---

## Data Integrity Constraints

### Check Constraints

```sql
-- Orders must have positive quantity
ALTER TABLE orders ADD CONSTRAINT check_order_quantity
  CHECK (quantity > 0);

-- Filled cannot exceed quantity
ALTER TABLE orders ADD CONSTRAINT check_order_filled
  CHECK (filled <= quantity AND filled >= 0);

-- Prices must be positive
ALTER TABLE orders ADD CONSTRAINT check_order_price
  CHECK (price > 0 OR price = 0);  -- 0 for market orders

-- Settlement amount must match
ALTER TABLE settlements ADD CONSTRAINT check_settlement_amount
  CHECK (amount > 0);

-- Cash balances cannot be negative
ALTER TABLE accounts ADD CONSTRAINT check_cash_balance
  CHECK (cash_balance >= 0);
```

---

## Sequence Diagrams

### Order to Settlement Flow

```
User places Order
    ↓
INSERT INTO orders (status='pending')
    ↓
API Gateway calls Matching Engine
    ↓
Matching Engine executes
    ↓
INSERT INTO trades (executed_at=now)
    ↓
Settlement Coordinator creates DvP
    ↓
INSERT INTO settlements (status='initiated')
    ↓
... settlement states progress ...
    ↓
UPDATE settlements (status='settled', settled_at=now)
    ↓
Trader receives securities
Seller receives cash
```

---

## Maintenance Tasks

### Vacuuming

```sql
-- Regular maintenance
VACUUM ANALYZE;

-- Full vacuum (requires exclusive lock)
VACUUM FULL;
```

### Reindexing

```sql
-- Rebuild fragmented indexes
REINDEX INDEX idx_orders_account_id;

-- Rebuild all indexes
REINDEX TABLE orders;
```

### Partitioning Strategy

Tables using TimescaleDB are automatically partitioned by time:

```sql
-- Trades partitioned by month
SELECT * FROM trades
WHERE executed_at >= '2024-10-01' AND executed_at < '2024-11-01';

-- Settlements partitioned by month
SELECT * FROM settlements
WHERE settlement_date >= '2024-10-01' AND settlement_date < '2024-11-01';
```

---

## Connection Pooling

### PgBouncer Configuration

```ini
[databases]
cantondex = host=localhost port=5432 dbname=cantondex

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 10
```

---

## Backup & Recovery

### Backup Strategy

```bash
# Full backup
pg_dump -U cantondex_user -d cantondex -Fc > backup.dump

# Point-in-time recovery
pg_basebackup -U cantondex_user -Pv -R -W -D /var/lib/postgresql/backup
```

---

## References

- [Data Modeling Best Practices](../architecture/DATA-MODELING.md)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TimescaleDB Documentation](https://docs.timescale.com/)
