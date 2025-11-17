# CantonDEX Testing Guide for Judges

## Overview

This guide provides step-by-step instructions for judges to review and test the CantonDEX platform.

## Prerequisites Check

Ensure you have:
- ✅ Docker Desktop installed and running
- ✅ DAML SDK 2.9.0 installed
- ✅ Python 3.11+
- ✅ Node.js 18+ and pnpm
- ✅ MetaMask browser extension (for wallet testing)

## Quick Verification (2 minutes)

```bash
# Verify installations
docker --version        # Should show Docker 20.10+
daml version           # Should show 2.9.0
python --version       # Should show 3.11+
node --version         # Should show 18.0+
pnpm --version         # Should show 8.0+
```

## Part 1: Infrastructure Setup (5 minutes)

### Step 1: Clone Repository

```bash
git clone https://github.com/getcakedieyoungx/cantondex.git
cd cantondex
```

### Step 2: Build DAML Contracts

```bash
cd daml-contracts
daml build

# Expected output:
# Compiling cantondex-contracts to a DAR.
# Created .daml/dist/cantondex-contracts-1.0.0.dar
```

**What to verify**:
- DAR file created at `.daml/dist/cantondex-contracts-1.0.0.dar`
- No compilation errors
- All 10 templates compiled successfully

### Step 3: Start Docker Services

```bash
cd ..
docker-compose up -d

# Wait for services to initialize (60 seconds)
```

**What to verify**:
```bash
docker ps

# Should show containers:
# - cantondex-canton-participant
# - cantondex-postgres  
# - cantondex-redis
# - cantondex-kafka
# - cantondex-zookeeper
```

### Step 4: Verify Canton is Running

```bash
# Check Canton health (wait up to 2 minutes for startup)
curl http://localhost:4851/health

# Expected: HTTP 200 OK
```

**If Canton not responding**: Wait another minute and retry. Canton takes time to initialize.

### Step 5: Upload Contracts to Canton

```bash
daml ledger upload-dar \
  daml-contracts/.daml/dist/cantondex-contracts-1.0.0.dar \
  --host=localhost \
  --port=10011

# Expected output:
# DAR upload succeeded.
```

**What to verify**:
- Upload completes without errors
- Canton accepts the DAR file

### Step 6: Allocate Test Parties

```bash
daml ledger allocate-party Alice --host=localhost --port=10011
daml ledger allocate-party Bob --host=localhost --port=10011
daml ledger allocate-party Securities-Issuer --host=localhost --port=10011
daml ledger allocate-party Cash-Provider --host=localhost --port=10011

# Each command outputs a party identifier like:
# Alice::participant::1234567890abcdef
```

**What to verify**:
- 4 parties created successfully
- Each party has a unique identifier

## Part 2: Backend Testing (5 minutes)

### Step 7: Test Canton Python Client

```bash
cd cantondex-backend/canton-client

# Install dependencies
pip install -r requirements.txt

# Run test client
python canton_ledger_client.py
```

**Expected Output**:
```
Canton is healthy: True
Allocated party: Alice::participant::...
Created account contract: #...
Active accounts: 1
```

**What to verify**:
- Canton connection successful
- Party allocation works
- Contract creation succeeds
- Contract query returns results

### Step 8: Test API Gateway

```bash
cd ../api-gateway

# Install dependencies
pip install -r requirements.txt

# Start API Gateway (in new terminal)
python main.py

# In another terminal, test endpoints:
curl http://localhost:8000/health

# Expected:
# {"status":"healthy","canton_network":"connected",...}

curl http://localhost:8000/canton/parties

# Expected: List of allocated parties
```

**What to verify**:
- API Gateway starts without errors
- Health endpoint responds
- Canton integration working
- Parties endpoint returns data

### Step 9: Test Wallet Integration

```bash
# Get wallet nonce
curl -X POST http://localhost:8000/wallet/nonce \
  -H "Content-Type: application/json" \
  -d '{"wallet_address":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'

# Expected:
# {
#   "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
#   "message": "Welcome to CantonDEX!...",
#   "instructions": "Please sign this message with your wallet"
# }
```

**What to verify**:
- Nonce generation works
- Message format correct
- No errors in response

## Part 3: Frontend Testing (5 minutes)

### Step 10: Start Frontend Applications

```bash
# Install dependencies (from project root)
pnpm install

# Start Trading Terminal
cd apps/trading-terminal
pnpm dev

# Opens at http://localhost:5174
```

**What to verify**:
- No build errors
- Application starts successfully
- UI loads properly

### Step 11: Test Trading Terminal

1. Open browser to http://localhost:5174
2. **Modern UI**: Verify glass morphism design, gradient backgrounds
3. **Navigation**: Check all menu items accessible
4. **Responsive**: Test on different screen sizes

**What to verify**:
- Clean, modern interface
- No console errors
- Smooth animations
- Responsive design

### Step 12: Test Wallet Connection (Optional - Requires MetaMask)

1. Click "Connect Wallet" button
2. MetaMask popup appears
3. Select account and approve
4. Sign authentication message (no gas fees)
5. Wallet address and balance displayed
6. "Disconnect" button appears

**What to verify**:
- Wallet connection flow works
- Signature request correct
- Authentication succeeds
- Balance displays correctly

## Part 4: DAML Contract Review (10 minutes)

### Step 13: Review Smart Contracts

```bash
# View contract files
cd daml-contracts/daml

ls -la
# Should show 10 .daml files + Main.daml
```

**Contracts to Review**:

1. **Settlement.daml** - Core atomic DvP logic
```bash
cat Settlement.daml | head -50
```
**Key Points**:
- `ExecuteDeliveryVsPayment` choice
- Atomic execution guarantees
- Multi-party signatories

2. **Account.daml** - Trading account management
```bash
cat Account.daml | head -30
```
**Key Points**:
- Balance management
- Fund reservation
- Transfer logic

3. **Order.daml** - Order lifecycle
```bash
cat Order.daml | head -30
```
**Key Points**:
- Order creation
- Partial fills
- Cancellation

**What to verify**:
- Type-safe DAML code
- No obvious vulnerabilities
- Clear business logic
- Proper signatories

### Step 14: Review Canton Integration

```bash
cd ../../cantondex-backend/canton-client
cat canton_ledger_client.py | head -100
```

**Key Methods to Review**:
- `create_contract()` - Contract creation
- `exercise_choice()` - Choice execution
- `query_active_contracts()` - Contract queries
- `allocate_party()` - Party management

**What to verify**:
- Async/await properly used
- Error handling present
- Type hints provided
- Documentation clear

### Step 15: Review Settlement Coordinator

```bash
cd ../settlement-coordinator
cat settlement_canton_integration.py | head -100
```

**Key Methods to Review**:
- `create_settlement_contract()` - Settlement initiation
- `execute_atomic_dvp()` - DvP execution
- `fail_settlement()` - Failure handling

**What to verify**:
- Atomic execution logic
- Retry mechanisms
- Error handling
- Canton API usage

## Part 5: Architecture Review (5 minutes)

### Step 16: Review Documentation

```bash
cd ../..

# Read project overview
cat README.md

# Review setup instructions
cat SETUP.md

# Check wallet integration
cat WALLET_INTEGRATION.md

# Review submission details
cat HACKATHON_SUBMISSION.md
```

**What to verify**:
- Clear project description
- Complete setup instructions
- Comprehensive documentation
- Professional presentation

### Step 17: Review Project Structure

```bash
# View project tree
tree -L 2 -I 'node_modules|.daml|dist|build'
```

**Expected Structure**:
```
cantondex/
├── daml-contracts/           # 10 DAML contracts
├── cantondex-backend/        # Backend services
│   ├── canton-client/       # Canton integration
│   ├── api-gateway/         # REST API + Wallet
│   └── settlement-coordinator/
├── apps/                     # 4 Frontend apps
├── canton-config/           # Canton config
├── docs/                    # Documentation
└── docker-compose.yml       # Infrastructure
```

**What to verify**:
- Organized structure
- Clear separation of concerns
- Complete implementation

## Part 6: Code Quality Review (5 minutes)

### Step 18: Check Code Statistics

```bash
# Count DAML lines
find daml-contracts/daml -name "*.daml" -exec wc -l {} + | tail -1

# Count Python lines
find cantondex-backend -name "*.py" -exec wc -l {} + | tail -1

# Count TypeScript lines
find apps/trading-terminal/src -name "*.tsx" -name "*.ts" -exec wc -l {} + | tail -1
```

**Expected Totals**:
- DAML: ~579 lines
- Python: ~1176 lines
- TypeScript: ~149 lines
- **Total: 3800+ lines of code**

### Step 19: Check Test Coverage

```bash
# DAML tests (if present)
cd daml-contracts
daml test

# Python tests (if present)
cd ../cantondex-backend/canton-client
pytest tests/ -v --cov
```

**What to verify**:
- Tests exist and pass
- Good code coverage
- No failing tests

## Part 7: Performance Testing (Optional)

### Step 20: Load Test Canton

```bash
# Simple load test
for i in {1..10}; do
  curl http://localhost:4851/health &
done
wait

# All requests should succeed
```

### Step 21: Test Settlement Latency

```bash
cd cantondex-backend/settlement-coordinator

# Time settlement execution
time python settlement_canton_integration.py

# Should complete in <5 seconds
```

## Evaluation Criteria

### ✅ Technical Implementation (40 points)
- [ ] 10 DAML smart contracts implemented
- [ ] Canton integration working
- [ ] Atomic DvP settlement functional
- [ ] Web3 wallet integration
- [ ] Type-safe code
- [ ] Error handling

### ✅ Privacy & Security (20 points)
- [ ] Sub-transaction privacy architecture
- [ ] Canton protocol usage
- [ ] Signature verification
- [ ] JWT authentication
- [ ] No private key storage

### ✅ Code Quality (15 points)
- [ ] Clean, readable code
- [ ] Proper documentation
- [ ] Type hints/safety
- [ ] Error handling
- [ ] Best practices

### ✅ Completeness (15 points)
- [ ] All 10 contracts implemented
- [ ] Backend fully functional
- [ ] Frontend working
- [ ] Documentation complete
- [ ] Testing instructions clear

### ✅ Innovation (10 points)
- [ ] Novel privacy approach
- [ ] Atomic settlement
- [ ] Multi-framework frontend
- [ ] Web3 integration
- [ ] Production-ready quality

---

## Troubleshooting

### Canton Not Starting
```bash
docker logs cantondex-canton-participant -f
docker-compose restart canton-participant
```

### DAML Upload Fails
```bash
# Wait longer for Canton
sleep 120
# Retry upload
```

### Port Conflicts
```bash
# Check port usage
netstat -ano | findstr :4851  # Windows
lsof -i :4851  # Mac/Linux
```

### Frontend Build Errors
```bash
# Clear and reinstall
rm -rf node_modules
pnpm install
```

---

## Support

- **GitHub Issues**: https://github.com/getcakedieyoungx/cantondex/issues
- **Documentation**: See README.md and SETUP.md
- **Canton Docs**: https://docs.daml.com/

---

**Total Testing Time**: ~30-40 minutes

**Judge Access**: All features accessible without special credentials

**Demo Ready**: Complete system functional after setup
