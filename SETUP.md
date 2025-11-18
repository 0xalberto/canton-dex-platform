# CantonDEX Setup Guide

## Prerequisites

### Required Software
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)
- **DAML SDK (latest)** - Install via: `daml install latest`
- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **pnpm** - `npm install -g pnpm`

## Installation Steps

### 1. Install DAML SDK

#### Windows
```powershell
# Download installer
# Install latest DAML SDK
daml install latest

# Run installer
.\daml-installer.exe

# Verify installation
daml version
```

#### macOS/Linux
```bash
curl -sSL https://get.daml.com | sh
daml version
```

### 2. Clone Repository

```bash
git clone https://github.com/getcakedieyoungx/cantondex.git
cd cantondex
```

### 3. Build DAML Contracts

```bash
cd daml-contracts
daml build

# Output: .daml/dist/cantondex-contracts-1.0.0.dar
```

### 4. Start Infrastructure

```bash
cd ..
docker compose up -d

# Wait 60 seconds for Canton initialization
```

### 5. Upload Contracts to Canton

```bash
daml ledger upload-dar \
  daml-contracts/.daml/dist/cantondex-contracts-1.0.0.dar \
  --host=localhost --port=10011

# Allocate parties
daml ledger allocate-party Alice --host=localhost --port=10011
daml ledger allocate-party Bob --host=localhost --port=10011
daml ledger allocate-party Securities-Issuer --host=localhost --port=10011
daml ledger allocate-party Cash-Provider --host=localhost --port=10011
```

### 6. Install Backend Dependencies

```bash
# API Gateway
cd cantondex-backend/api-gateway
pip install -r requirements.txt

# Canton Client
cd ../canton-client
pip install -r requirements.txt
```

### 7. Start Backend

```bash
# API Gateway
cd cantondex-backend/api-gateway
python main.py
```

### 8. Start Frontend

```bash
# Install dependencies
pnpm install

# Start Trading Terminal
cd apps/trading-terminal
pnpm dev
# Open http://localhost:5174
```

## Verification

```bash
# Canton health
curl http://localhost:4851/health

# API Gateway
curl http://localhost:8000/health

# Wallet nonce
curl -X POST http://localhost:8000/wallet/nonce \
  -H "Content-Type: application/json" \
  -d '{"wallet_address":"0x..."}'
```

## Troubleshooting

### Canton not starting?
```bash
docker logs cantondex-canton-participant -f
docker compose restart canton-participant
```

### DAR upload fails?
```bash
# Wait longer
sleep 120
# Retry
```

---

For detailed testing, see [TESTING_GUIDE.md](TESTING_GUIDE.md)
