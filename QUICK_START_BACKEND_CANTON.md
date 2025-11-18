# 🚀 Quick Start: Backend & Canton Network

## ⚡ 5-Minute Setup

### Prerequisites
- Docker installed and running
- Python 3.11+
- Git

### Step 1: Install DAML SDK

**Windows**:
```powershell
# Download Daml SDK installer
# Install latest DAML SDK
daml install latest

# Run installer
.\daml-installer.exe

# Add to PATH (restart terminal after)
```

### Step 2: Build DAML Contracts

```bash
cd C:\Users\PC\cantondex\daml-contracts

# Build contracts
daml build

# Output: .daml\dist\cantondex-contracts-1.0.0.dar
```

### Step 3: Start Services

```bash
cd C:\Users\PC\cantondex

# Start all services (Canton + PostgreSQL + Redis + Kafka + Backends)
docker-compose up -d

# Wait for Canton to initialize (60 seconds)
timeout /t 60
```

### Step 4: Upload Contracts to Canton

```bash
# Upload DAR file
daml ledger upload-dar ^
  daml-contracts\.daml\dist\cantondex-contracts-1.0.0.dar ^
  --host=localhost ^
  --port=10011

# Output: "DAR upload successful"
```

### Step 5: Allocate Parties

```bash
# Create parties on Canton ledger
daml ledger allocate-party Alice --host=localhost --port=10011
daml ledger allocate-party Bob --host=localhost --port=10011
daml ledger allocate-party Securities-Issuer --host=localhost --port=10011
daml ledger allocate-party Cash-Provider --host=localhost --port=10011
```

### Step 6: Test Canton Integration

```bash
cd cantondex-backend\canton-client

# Install dependencies
pip install -r requirements.txt

# Test Canton client
python canton_ledger_client.py

# Expected:
# Canton is healthy: True
# Allocated party: Alice::...
# Created account contract: #...
# Active accounts: 1
```

### Step 7: Test Settlement

```bash
cd ..\settlement-coordinator

# Test settlement coordinator
python settlement_canton_integration.py

# Expected:
# Canton healthy: True
# Settlement created: #...
# DvP executed: {...}
```

## ✅ Verification

Check all services are running:

```bash
# Canton Health
curl http://localhost:4851/health

# API Gateway
curl http://localhost:8000/health

# Settlement Coordinator
curl http://localhost:8003/health

# Check Docker containers
docker ps
```

Expected containers:
- `cantondex-canton-participant`
- `cantondex-postgres`
- `cantondex-redis`
- `cantondex-kafka`
- `cantondex-api-gateway`
- `cantondex-settlement-coordinator`
- `cantondex-risk-management`
- `cantondex-matching-engine`

## 🎯 What's Working

### ✅ Canton Network
- Participant node running
- JSON Ledger API accessible (port 4851)
- Admin API accessible (port 10011)
- DAML contracts deployed

### ✅ DAML Contracts
- 10 core templates compiled
- DAR file generated
- Contracts uploaded to Canton
- Parties allocated

### ✅ Backend Services
- API Gateway integrated with Canton
- Settlement Coordinator using Canton DvP
- Canton Python client operational
- Atomic settlement ready

## 📊 Test Endpoints

### Canton Health
```bash
curl http://localhost:4851/health
# Expected: 200 OK
```

### List Parties
```bash
curl -X POST http://localhost:4851/v1/parties \
  -H "Content-Type: application/json"
```

### Query Contracts
```bash
curl -X POST http://localhost:4851/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "templateIds": ["Main:Account"],
    "query": {},
    "readAs": ["Alice::participant"]
  }'
```

## 🐛 Troubleshooting

### Canton not starting?
```bash
# Check logs
docker logs cantondex-canton-participant -f

# Restart
docker-compose restart canton-participant
```

### DAR upload fails?
```bash
# Ensure Canton is fully started
timeout /t 60

# Check Canton admin API
curl http://localhost:10011/health

# Retry upload
daml ledger upload-dar daml-contracts\.daml\dist\cantondex-contracts-1.0.0.dar --host=localhost --port=10011
```

### Python client errors?
```bash
# Install dependencies
cd cantondex-backend\canton-client
pip install aiohttp

# Set environment variables
set CANTON_LEDGER_API_HOST=localhost
set CANTON_LEDGER_API_PORT=4851
```

## 📖 Next Steps

1. **Explore DAML Contracts**: `daml-contracts/daml/`
2. **Read Architecture**: `docs/ARCHITECTURE.md`
3. **Try Settlement Flow**: `cantondex-backend/settlement-coordinator/`
4. **API Integration**: `docs/api/OPENAPI-SPEC.md`
5. **Production Deployment**: `docs/DEVOPS.md`

## 🎉 Success!

If all steps completed successfully, you now have:
- ✅ Canton Network participant running
- ✅ 10 DAML contracts deployed
- ✅ Backend services integrated
- ✅ Atomic DvP settlement ready
- ✅ Privacy-preserving trading operational

**Your CantonDEX platform is now LIVE!** 🚀

---

For detailed documentation, see:
- `BACKEND_CANTON_COMPLETE.md` - Full implementation details
- `CANTON_IMPLEMENTATION_GUIDE.md` - Step-by-step guide
- `docs/ARCHITECTURE.md` - System architecture
