-- ============================================
-- CantonDEX Database Schema
-- DAML-Compatible "Shadow Ledger" Design
-- ============================================
-- This schema mirrors the DAML contracts structure,
-- allowing seamless migration to Canton Participant Nodes
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PARTIES (Maps to DAML Parties)
-- ============================================
CREATE TABLE IF NOT EXISTS parties (
    party_id VARCHAR(255) PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    public_key TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'CLOSED'))
);

CREATE INDEX idx_parties_email ON parties(email);

-- ============================================
-- TRADING_ACCOUNTS (Maps to TradingAccount.daml)
-- ============================================
CREATE TABLE IF NOT EXISTS trading_accounts (
    account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    party_id VARCHAR(255) NOT NULL REFERENCES parties(party_id),
    custodian_party_id VARCHAR(255) REFERENCES parties(party_id),
    account_status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'CLOSED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contract metadata (for DAML compatibility)
    contract_id VARCHAR(255) UNIQUE,
    template_id VARCHAR(255) DEFAULT 'TradingAccount',
    
    UNIQUE(party_id, account_id)
);

CREATE INDEX idx_trading_accounts_party ON trading_accounts(party_id);
CREATE INDEX idx_trading_accounts_status ON trading_accounts(account_status);

-- ============================================
-- BALANCES (Part of TradingAccount state)
-- ============================================
CREATE TABLE IF NOT EXISTS balances (
    balance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES trading_accounts(account_id),
    asset_symbol VARCHAR(50) NOT NULL,
    available DECIMAL(38, 18) DEFAULT 0.0 CHECK (available >= 0),
    locked DECIMAL(38, 18) DEFAULT 0.0 CHECK (locked >= 0),
    total DECIMAL(38, 18) GENERATED ALWAYS AS (available + locked) STORED,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(account_id, asset_symbol)
);

CREATE INDEX idx_balances_account ON balances(account_id);
CREATE INDEX idx_balances_asset ON balances(asset_symbol);

-- ============================================
-- ORDERS (Maps to ConfidentialOrder.daml)
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES trading_accounts(account_id),
    party_id VARCHAR(255) NOT NULL REFERENCES parties(party_id),
    
    -- Order details
    pair VARCHAR(50) NOT NULL, -- e.g., "BTC/USDT"
    side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('MARKET', 'LIMIT', 'STOP', 'ICEBERG')),
    quantity DECIMAL(38, 18) NOT NULL CHECK (quantity > 0),
    price DECIMAL(38, 18), -- NULL for market orders
    stop_price DECIMAL(38, 18), -- For stop orders
    
    -- Execution state
    filled_quantity DECIMAL(38, 18) DEFAULT 0.0 CHECK (filled_quantity >= 0),
    remaining_quantity DECIMAL(38, 18) GENERATED ALWAYS AS (quantity - filled_quantity) STORED,
    average_fill_price DECIMAL(38, 18),
    
    -- Order status
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'REJECTED', 'EXPIRED')),
    
    -- Time controls
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    filled_at TIMESTAMP,
    
    -- DAML contract metadata
    contract_id VARCHAR(255) UNIQUE,
    template_id VARCHAR(255) DEFAULT 'ConfidentialOrder',
    
    -- Privacy (for Canton Network compatibility)
    is_confidential BOOLEAN DEFAULT TRUE,
    visible_to TEXT[] -- Array of party_ids who can see this order
);

CREATE INDEX idx_orders_account ON orders(account_id);
CREATE INDEX idx_orders_party ON orders(party_id);
CREATE INDEX idx_orders_pair ON orders(pair);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_side ON orders(side);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ============================================
-- TRADES (Maps to AtomicTrade.daml)
-- ============================================
CREATE TABLE IF NOT EXISTS trades (
    trade_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Maker and Taker
    maker_order_id UUID NOT NULL REFERENCES orders(order_id),
    taker_order_id UUID NOT NULL REFERENCES orders(order_id),
    maker_party_id VARCHAR(255) NOT NULL REFERENCES parties(party_id),
    taker_party_id VARCHAR(255) NOT NULL REFERENCES parties(party_id),
    
    -- Trade details
    pair VARCHAR(50) NOT NULL,
    quantity DECIMAL(38, 18) NOT NULL CHECK (quantity > 0),
    price DECIMAL(38, 18) NOT NULL CHECK (price > 0),
    maker_side VARCHAR(10) NOT NULL CHECK (maker_side IN ('BUY', 'SELL')),
    
    -- Settlement
    settlement_status VARCHAR(50) DEFAULT 'PENDING' CHECK (settlement_status IN ('PENDING', 'SETTLED', 'FAILED', 'ROLLED_BACK')),
    settled_at TIMESTAMP,
    
    -- Atomic DvP (Delivery vs Payment)
    asset_transferred BOOLEAN DEFAULT FALSE,
    payment_transferred BOOLEAN DEFAULT FALSE,
    is_atomic BOOLEAN GENERATED ALWAYS AS (asset_transferred AND payment_transferred) STORED,
    
    -- Timestamps
    matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP,
    
    -- DAML contract metadata
    contract_id VARCHAR(255) UNIQUE,
    template_id VARCHAR(255) DEFAULT 'AtomicTrade',
    
    -- Fees
    maker_fee DECIMAL(38, 18) DEFAULT 0.0,
    taker_fee DECIMAL(38, 18) DEFAULT 0.0,
    fee_asset VARCHAR(50) DEFAULT 'USDT'
);

CREATE INDEX idx_trades_maker_order ON trades(maker_order_id);
CREATE INDEX idx_trades_taker_order ON trades(taker_order_id);
CREATE INDEX idx_trades_maker_party ON trades(maker_party_id);
CREATE INDEX idx_trades_taker_party ON trades(taker_party_id);
CREATE INDEX idx_trades_pair ON trades(pair);
CREATE INDEX idx_trades_matched ON trades(matched_at DESC);
CREATE INDEX idx_trades_settlement ON trades(settlement_status);

-- ============================================
-- TRANSACTIONS (Audit trail for all balance changes)
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES trading_accounts(account_id),
    party_id VARCHAR(255) NOT NULL REFERENCES parties(party_id),
    
    -- Transaction details
    tx_type VARCHAR(50) NOT NULL CHECK (tx_type IN ('DEPOSIT', 'WITHDRAW', 'TRADE', 'FEE', 'TRANSFER')),
    asset_symbol VARCHAR(50) NOT NULL,
    amount DECIMAL(38, 18) NOT NULL, -- Positive for credit, negative for debit
    balance_after DECIMAL(38, 18) NOT NULL,
    
    -- References
    order_id UUID REFERENCES orders(order_id),
    trade_id UUID REFERENCES trades(trade_id),
    
    -- Metadata
    description TEXT,
    tx_hash VARCHAR(255), -- For blockchain compatibility
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- DAML compatibility
    contract_id VARCHAR(255),
    ledger_offset BIGINT -- For Canton Ledger API compatibility
);

CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_party ON transactions(party_id);
CREATE INDEX idx_transactions_type ON transactions(tx_type);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_asset ON transactions(asset_symbol);

-- ============================================
-- ORDER_BOOK_SNAPSHOT (For efficient querying)
-- ============================================
CREATE TABLE IF NOT EXISTS order_book_snapshot (
    snapshot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pair VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    price DECIMAL(38, 18) NOT NULL,
    quantity DECIMAL(38, 18) NOT NULL,
    order_count INTEGER NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(pair, side, price)
);

CREATE INDEX idx_orderbook_pair ON order_book_snapshot(pair);
CREATE INDEX idx_orderbook_price ON order_book_snapshot(pair, side, price);

-- ============================================
-- MARKET_DATA (Real-time market statistics)
-- ============================================
CREATE TABLE IF NOT EXISTS market_data (
    market_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pair VARCHAR(50) UNIQUE NOT NULL,
    
    -- Price data
    last_price DECIMAL(38, 18),
    best_bid DECIMAL(38, 18),
    best_ask DECIMAL(38, 18),
    spread DECIMAL(38, 18) GENERATED ALWAYS AS (best_ask - best_bid) STORED,
    
    -- 24h statistics
    price_change_24h DECIMAL(38, 18),
    price_change_percent_24h DECIMAL(10, 4),
    high_24h DECIMAL(38, 18),
    low_24h DECIMAL(38, 18),
    volume_24h DECIMAL(38, 18),
    
    -- Timestamps
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_market_data_pair ON market_data(pair);

-- ============================================
-- TRIGGERS (Auto-update timestamps)
-- ============================================

-- Update trading_accounts.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trading_accounts_updated_at BEFORE UPDATE ON trading_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_balances_updated_at BEFORE UPDATE ON balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA (For demo purposes)
-- ============================================

-- Create system party for automated processes
INSERT INTO parties (party_id, display_name, email, status) VALUES
    ('canton::system::operator', 'System Operator', 'system@cantondex.io', 'ACTIVE')
ON CONFLICT (party_id) DO NOTHING;

    -- Create supported trading pairs in market_data
    INSERT INTO market_data (pair, last_price, best_bid, best_ask, high_24h, low_24h, volume_24h) VALUES
        ('BTC/USDT', 92500.00, 92450.00, 92550.00, 92800.00, 92000.00, 1250000.00),
        ('ETH/USDT', 3200.00, 3195.00, 3205.00, 3250.00, 3180.00, 850000.00),
        ('SOL/USDT', 108.50, 108.45, 108.55, 110.00, 107.00, 125000.00),
        ('tTBILL/USDT', 10000.00, 9998.00, 10002.00, 10010.00, 9990.00, 50000.00)
ON CONFLICT (pair) DO NOTHING;

-- ============================================
-- VIEWS (For convenient querying)
-- ============================================

-- Active orders view
CREATE OR REPLACE VIEW v_active_orders AS
SELECT 
    o.*,
    p.display_name as party_name,
    p.email as party_email
FROM orders o
JOIN parties p ON o.party_id = p.party_id
WHERE o.status IN ('OPEN', 'PARTIALLY_FILLED')
ORDER BY o.created_at DESC;

-- Trade history with party info
CREATE OR REPLACE VIEW v_trade_history AS
SELECT 
    t.*,
    mp.display_name as maker_name,
    tp.display_name as taker_name,
    mo.price as maker_order_price,
    to2.price as taker_order_price
FROM trades t
JOIN parties mp ON t.maker_party_id = mp.party_id
JOIN parties tp ON t.taker_party_id = tp.party_id
JOIN orders mo ON t.maker_order_id = mo.order_id
JOIN orders to2 ON t.taker_order_id = to2.order_id
ORDER BY t.matched_at DESC;

-- Account balances with party info
CREATE OR REPLACE VIEW v_account_balances AS
SELECT 
    b.*,
    a.party_id,
    p.display_name as party_name,
    p.email as party_email
FROM balances b
JOIN trading_accounts a ON b.account_id = a.account_id
JOIN parties p ON a.party_id = p.party_id;

-- ============================================
-- COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE parties IS 'Maps to DAML Parties - represents organizations/users on Canton Network';
COMMENT ON TABLE trading_accounts IS 'Maps to TradingAccount.daml contract';
COMMENT ON TABLE balances IS 'Part of TradingAccount state - tracks asset balances';
COMMENT ON TABLE orders IS 'Maps to ConfidentialOrder.daml contract';
COMMENT ON TABLE trades IS 'Maps to AtomicTrade.daml contract - represents matched trades';
COMMENT ON TABLE transactions IS 'Audit trail for all ledger state changes';
COMMENT ON COLUMN orders.contract_id IS 'Will contain Canton Contract ID in production';
COMMENT ON COLUMN orders.is_confidential IS 'Privacy flag - orders are private by default on Canton';
COMMENT ON COLUMN trades.is_atomic IS 'Enforces atomic DvP settlement';

-- ============================================
-- GRANTS (Application user permissions)
-- ============================================

-- Create application role if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cantondex_app') THEN
        CREATE ROLE cantondex_app WITH LOGIN PASSWORD 'changeme_in_production';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE cantondex TO cantondex_app;
GRANT USAGE ON SCHEMA public TO cantondex_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cantondex_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO cantondex_app;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO cantondex_app;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'CantonDEX Database Schema Created Successfully!';
    RAISE NOTICE 'DAML-Compatible Shadow Ledger Ready';
    RAISE NOTICE '============================================';
END
$$;
