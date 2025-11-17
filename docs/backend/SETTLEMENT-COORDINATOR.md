# Settlement Coordinator Service Documentation

## Overview

The Settlement Coordinator orchestrates atomic Delivery-vs-Payment (DvP) settlement across multiple Canton Network domains. It ensures that securities and cash transfers occur simultaneously across domain boundaries, guaranteeing settlement finality and preventing post-trade risks.

**Technology Stack**: Python 3.11, FastAPI, SQLAlchemy, asyncio
**Port**: 8003
**Repository Path**: `/home/user/cantondex/cantondex-backend/settlement-coordinator`
**Performance Target**: <2s P99 settlement confirmation

---

## Architecture

### Settlement Flow Diagram

```
Trade Execution (Matching Engine)
    ↓
Settlement Event (via Kafka)
    ↓
[Settlement Coordinator]
    ├─ 1. Validate Trade
    ├─ 2. Create Settlement Instructions
    ├─ 3. Check Ledger Status
    ├─ 4. Create DvP Atomic Transaction
    ├─ 5. Execute on Canton Domains
    ├─ 6. Verify Finality
    └─ 7. Publish Settlement Confirmation
    ↓
Buyer Receives Securities
Seller Receives Cash (simultaneously)
    ↓
Settlement Complete
```

### Key Components

1. **Settlement Manager**
   - Tracks settlement lifecycle
   - Manages state transitions
   - Handles retry logic

2. **DvP Orchestrator**
   - Creates multi-domain atomic transactions
   - Coordinates domain-to-domain transfers
   - Ensures settlement finality

3. **Ledger Interface**
   - Communicates with Canton Ledger API
   - Creates contracts and exercises choices
   - Verifies settlement completion

4. **Event Publisher**
   - Publishes settlement events to Kafka
   - Notifies interested services
   - Maintains event audit trail

---

## Settlement Lifecycle

### States

```
PENDING
    ↓
INITIATED (DvP contract created)
    ↓
SELLER_SECURITIES_LOCKED (Securities reserved)
    ↓
BUYER_CASH_LOCKED (Cash reserved)
    ↓
EXECUTING (Transaction executing on domains)
    ↓
CONFIRMED (Both sides finalized)
    ↓
SETTLED
```

### State Transitions

```python
PENDING → INITIATED              # When settlement starts
INITIATED → SELLER_SECURITIES_LOCKED  # Securities confirmed locked
SELLER_SECURITIES_LOCKED → BUYER_CASH_LOCKED  # Cash confirmed locked
BUYER_CASH_LOCKED → EXECUTING   # Starting cross-domain transaction
EXECUTING → CONFIRMED            # Domain transactions confirmed
CONFIRMED → SETTLED              # Finality verified
```

### Failure Cases

```
PENDING → FAILED                 # Trade validation failed
INITIATED → FAILED               # DvP contract creation failed
SELLER_SECURITIES_LOCKED → FAILED # Securities unavailable
BUYER_CASH_LOCKED → FAILED       # Cash unavailable
EXECUTING → FAILED               # Domain transaction failed
EXECUTING → PARTIALLY_SETTLED    # Partial execution completed
```

---

## Database Schema

### Settlements Table

```sql
CREATE TABLE settlements (
    id UUID PRIMARY KEY,
    trade_id UUID UNIQUE NOT NULL,
    buyer_account_id UUID NOT NULL,
    seller_account_id UUID NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    quantity DECIMAL(18, 8) NOT NULL,
    amount DECIMAL(18, 8) NOT NULL,

    status ENUM('pending', 'initiated', 'seller_securities_locked',
                'buyer_cash_locked', 'executing', 'confirmed',
                'settled', 'failed', 'partially_settled'),

    dvp_contract_id VARCHAR(255),
    dvp_contract_template_id VARCHAR(255),

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
    updated_at TIMESTAMP,

    INDEX idx_trade_id (trade_id),
    INDEX idx_status (status),
    INDEX idx_settlement_date (settlement_date)
);
```

### Settlement Events Table

```sql
CREATE TABLE settlement_events (
    id UUID PRIMARY KEY,
    settlement_id UUID NOT NULL REFERENCES settlements(id),

    event_type ENUM('initiated', 'seller_securities_locked',
                    'buyer_cash_locked', 'executing',
                    'confirmed', 'settled', 'failed'),

    details JSON NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_settlement_id (settlement_id),
    INDEX idx_created_at (created_at)
);
```

---

## REST API Endpoints

### 1. Get Settlement Status

**Endpoint**: `GET /settlements/{settlement_id}`

**Response**:
```json
{
  "settlement_id": "set_1234567890abcdef",
  "trade_id": "trd_1234567890abcdef",
  "buyer_account_id": "acc_buyer1234567",
  "seller_account_id": "acc_seller1234567",
  "symbol": "AAPL/USDC",
  "quantity": "50.00000000",
  "amount": "7524.00",
  "status": "confirmed",
  "settlement_date": "2024-11-19T00:00:00Z",
  "initiated_at": "2024-11-17T16:30:00Z",
  "confirmed_at": "2024-11-17T16:30:45Z",
  "settled_at": "2024-11-19T00:00:30Z",
  "dvp_atomic_transaction_id": "dvp_tx_1234567890",
  "buyer_securities_ledger_ref": "sec_buyer_ref_123",
  "seller_cash_ledger_ref": "cash_seller_ref_123"
}
```

### 2. List Settlements

**Endpoint**: `GET /settlements?account_id={account_id}&status={status}&start_date={date}&end_date={date}&limit={limit}`

**Response**:
```json
{
  "settlements": [
    {
      "settlement_id": "set_1234567890abcdef",
      "trade_id": "trd_1234567890abcdef",
      "symbol": "AAPL/USDC",
      "quantity": "50.00000000",
      "amount": "7524.00",
      "status": "settled",
      "settlement_date": "2024-11-19T00:00:00Z",
      "settled_at": "2024-11-19T00:00:30Z"
    }
  ],
  "total": 245,
  "limit": 50
}
```

### 3. Manual Settlement Retry

**Endpoint**: `POST /settlements/{settlement_id}/retry`

**Request**:
```json
{
  "reason": "Domain connectivity restored"
}
```

**Response**:
```json
{
  "settlement_id": "set_1234567890abcdef",
  "status": "executing",
  "retry_count": 2,
  "message": "Settlement retry initiated"
}
```

---

## Canton Integration

### DvP Contract Template

```daml
template DeliveryVsPayment with
    buyer : Party
    seller : Party
    securities_issuer : Party
    cash_provider : Party
    symbol : Text
    quantity : Decimal
    cash_amount : Decimal
    settlement_date : Date
  where
    signatory buyer, seller, securities_issuer, cash_provider

    choice SettleDeliveryVsPayment : ContractId SettledDeliveryVsPayment
      with
        buyer_securities_ref : Text
        seller_cash_ref : Text
      controller buyer, seller
      do
        -- Verify securities locked
        assert (buyer_securities_ref != "")

        -- Verify cash locked
        assert (seller_cash_ref != "")

        -- Atomic commitment (both succeed or both fail)
        securities_result <- securities_issuer `exercise` TransferSecurities
          with buyer = buyer; seller = seller; quantity = quantity; symbol = symbol

        cash_result <- cash_provider `exercise` TransferCash
          with buyer = buyer; seller = seller; amount = cash_amount

        create SettledDeliveryVsPayment with
          buyer = buyer
          seller = seller
          securities_issuer = securities_issuer
          cash_provider = cash_provider
          symbol = symbol
          quantity = quantity
          cash_amount = cash_amount
          settlement_date = settlement_date
          securities_transfer_id = securities_result
          cash_transfer_id = cash_result
          settled_at = getCurrentTime
```

### Settlement API Calls

```python
class SettlementOrchestrator:
    async def create_dvp_contract(
        self,
        buyer_account: Account,
        seller_account: Account,
        symbol: str,
        quantity: Decimal,
        cash_amount: Decimal,
        settlement_date: date
    ) -> str:
        """Create a DvP contract on the ledger"""

        # Create DvP contract
        contract_args = {
            'buyer': buyer_account.canton_party,
            'seller': seller_account.canton_party,
            'securities_issuer': self.securities_issuer_party,
            'cash_provider': self.cash_provider_party,
            'symbol': symbol,
            'quantity': str(quantity),
            'cash_amount': str(cash_amount),
            'settlement_date': settlement_date.isoformat()
        }

        # Submit to ledger
        dvp_contract = await self.ledger_client.create_contract(
            template_id='DeliveryVsPayment',
            arguments=contract_args
        )

        return dvp_contract.contract_id

    async def execute_settlement(
        self,
        settlement_id: str,
        dvp_contract_id: str,
        buyer_securities_ref: str,
        seller_cash_ref: str
    ) -> bool:
        """Execute the settlement on the ledger"""

        try:
            # Exercise SettleDeliveryVsPayment choice
            result = await self.ledger_client.exercise_choice(
                contract_id=dvp_contract_id,
                choice_name='SettleDeliveryVsPayment',
                arguments={
                    'buyer_securities_ref': buyer_securities_ref,
                    'seller_cash_ref': seller_cash_ref
                }
            )

            # Verify result
            if result.status == 'COMMITTED':
                return True
            else:
                raise SettlementException(f"Settlement failed: {result.message}")

        except Exception as e:
            await self.handle_settlement_failure(settlement_id, str(e))
            return False
```

---

## Kafka Event Integration

### Settlement Events Published

**settlement.initiated**
```json
{
  "event_id": "evt_1234567890abcdef",
  "event_type": "settlement_initiated",
  "settlement_id": "set_1234567890abcdef",
  "trade_id": "trd_1234567890abcdef",
  "buyer_account_id": "acc_buyer1234567",
  "seller_account_id": "acc_seller1234567",
  "symbol": "AAPL/USDC",
  "quantity": "50.00000000",
  "amount": "7524.00",
  "settlement_date": "2024-11-19T00:00:00Z",
  "timestamp": "2024-11-17T16:30:00Z"
}
```

**settlement.confirmed**
```json
{
  "event_id": "evt_1234567890abcdef",
  "event_type": "settlement_confirmed",
  "settlement_id": "set_1234567890abcdef",
  "dvp_atomic_transaction_id": "dvp_tx_1234567890",
  "buyer_securities_ledger_ref": "sec_buyer_ref_123",
  "seller_cash_ledger_ref": "cash_seller_ref_123",
  "timestamp": "2024-11-17T16:30:45Z"
}
```

**settlement.failed**
```json
{
  "event_id": "evt_1234567890abcdef",
  "event_type": "settlement_failed",
  "settlement_id": "set_1234567890abcdef",
  "failure_reason": "Insufficient cash balance",
  "retry_count": 1,
  "timestamp": "2024-11-17T16:35:00Z"
}
```

---

## Configuration

### Environment Variables

```bash
# Application
ENVIRONMENT=production
LOG_LEVEL=INFO

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=cantondex
DB_USER=cantondex_user
DB_PASSWORD=password

# Kafka
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
SETTLEMENT_EVENTS_TOPIC=settlement.events
TRADE_EVENTS_TOPIC=trade.events

# Canton
CANTON_DOMAIN_HOST=localhost
CANTON_DOMAIN_PORT=5008
CANTON_LEDGER_API_HOST=localhost
CANTON_LEDGER_API_PORT=4751
SECURITIES_ISSUER_PARTY=securities-issuer::12345
CASH_PROVIDER_PARTY=cash-provider::67890

# Settlement
SETTLEMENT_TIMEOUT_SECONDS=300     # 5 minute timeout
SETTLEMENT_RETRY_ATTEMPTS=3        # Retry failed settlements
SETTLEMENT_RETRY_DELAY_SECONDS=30  # Wait before retry
SETTLEMENT_BATCH_SIZE=100          # Process settlements in batches
```

---

## Running Locally

### Installation

```bash
cd /home/user/cantondex/cantondex-backend/settlement-coordinator

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export ENVIRONMENT=development
export DB_HOST=localhost
export CANTON_DOMAIN_HOST=localhost
```

### Running the Service

```bash
uvicorn main:app --host 0.0.0.0 --port 8003 --reload
```

---

## Testing

### Unit Tests

```bash
pytest tests/unit/ -v --cov=settlement_coordinator
```

### Integration Tests

```bash
pytest tests/integration/ -v --cov=settlement_coordinator
```

### DvP Settlement Test

```bash
pytest tests/integration/test_dvp_settlement.py -v
```

---

## Troubleshooting

### Settlement Stuck in EXECUTING State

1. Check Ledger API connectivity: `curl http://localhost:4751/health`
2. Check domain status: Review Canton logs
3. Check Kafka events: Verify events are being published
4. Manually retry: `POST /settlements/{id}/retry`

### Insufficient Funds on Settlement

1. Check buyer cash balance before settlement
2. Review Risk Management margin checks
3. Verify order execution quantities match settlement

### Domain Synchronization Issues

1. Check inter-domain connectivity
2. Verify party mappings are correct
3. Check timestamp synchronization between domains

---

## References

- [API Gateway Integration](./API-GATEWAY.md)
- [Canton Integration Guide](../architecture/CANTON-INTEGRATION.md)
- [Database Schema](../database/SCHEMA.md)
- [Kafka Event Streaming](../infrastructure/KAFKA.md)
