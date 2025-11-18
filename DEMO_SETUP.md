# CantonDEX Demo Setup Guide

Quick setup guide to run all services for hackathon demonstration.

## Prerequisites

- **Docker & Docker Compose** (Canton node)
- **Python 3.11+** with `pip`
- **Node.js 18+** with `pnpm`
- **DAML SDK 2.x**
- **MetaMask** browser extension

## Setup Steps

### 1. Backend Services

```bash
cd cantondex-backend

# Start Canton node (in separate terminal)
docker-compose up canton

# Install Python dependencies for all services
pip install -r api-gateway/requirements.txt
pip install -r compliance-service/requirements.txt
pip install -r settlement-coordinator/requirements.txt
pip install -r matching-engine/requirements.txt

# Start API Gateway (port 8000)
cd api-gateway
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Start Compliance Service (port 8004)
cd ../compliance-service
uvicorn main:app --host 0.0.0.0 --port 8004 --reload

# Start Settlement Coordinator (port 8003)
cd ../settlement-coordinator
uvicorn main:app --host 0.0.0.0 --port 8003 --reload

# Start Matching Engine (port 8002)
cd ../matching-engine
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

### 2. Frontend Applications

```bash
# From project root
pnpm install

# Copy environment files
cp apps/trading-terminal/.env.example apps/trading-terminal/.env
cp apps/admin-panel/.env.example apps/admin-panel/.env.local
cp apps/compliance-dashboard/.env.example apps/compliance-dashboard/.env

# Trading Terminal (port 5173)
cd apps/trading-terminal
pnpm dev

# Admin Panel (port 3000)
cd apps/admin-panel
pnpm dev

# Compliance Dashboard (port 5174)
cd apps/compliance-dashboard
pnpm dev

# Custody Portal (port 4200)
cd apps/custody-portal
pnpm start
```

## Service Ports Summary

| Service | Port | URL |
|---------|------|-----|
| API Gateway | 8000 | http://localhost:8000 |
| Matching Engine | 8002 | http://localhost:8002 |
| Settlement Coordinator | 8003 | http://localhost:8003 |
| Compliance Service | 8004 | http://localhost:8004 |
| Canton Participant | 5011-5019 | Admin port 5012 |
| Trading Terminal | 5173 | http://localhost:5173 |
| Compliance Dashboard | 5174 | http://localhost:5174 |
| Admin Panel | 3000 | http://localhost:3000 |
| Custody Portal | 4200 | http://localhost:4200 |

## Health Checks

```bash
# API Gateway
curl http://localhost:8000/health

# Compliance Service
curl http://localhost:8004/health

# Settlement Coordinator
curl http://localhost:8003/health

# Matching Engine
curl http://localhost:8002/health
```

## Demo Flow

### 1. Connect Wallet (Trading Terminal)
- Open http://localhost:5173
- Click "Connect Wallet"
- Approve MetaMask connection
- Sign authentication message
- JWT token stored in localStorage

### 2. View System Health (Admin Panel)
- Open http://localhost:3000
- Navigate to "System Health"
- See all backend services status
- Check Canton participant list

### 3. Monitor Compliance (Compliance Dashboard)
- Open http://localhost:5174
- View KYC records
- Check AML alerts
- Review audit log entries

### 4. Place Order (Trading Terminal)
- Select trading pair (e.g., BTC/USD)
- Choose order type (Market/Limit)
- Enter amount and price
- Submit order
- Order sent to matching engine

### 5. Settlement (Settlement Coordinator)
- Matched orders trigger DvP workflow
- Canton DAML contracts execute
- Atomic settlement on ledger
- Settlement history visible in Admin Panel

### 6. Custody Operations (Custody Portal)
- Open http://localhost:4200
- View asset balances
- Create withdrawal request
- Track deposit reconciliation

## Troubleshooting

### Canton Connection Issues
```bash
# Restart Canton node
docker-compose down
docker-compose up canton
```

### Port Conflicts
```bash
# Check ports in use
netstat -ano | findstr "8000 8002 8003 8004 5173"

# Kill process if needed
taskkill /PID <PID> /F
```

### CORS Errors
Ensure backend services have CORS configured:
```python
# In main.py of each service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", ...],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Wallet Connection Failed
- Ensure MetaMask is installed and unlocked
- Check API Gateway is running on port 8000
- Verify `/wallet/nonce` and `/wallet/login` endpoints

## Testing

```bash
# Run backend tests (10 passing, 78 skipped, 78 need fixtures)
cd cantondex-backend
pytest tests/ -v

# Note: Some tests require running services
# Core integration tests passing:
# - Canton contract creation
# - WebSocket notifications  
# - Redis caching
# - Database transactions
# - Audit trail logging

# Frontend tests
# Trading terminal, admin panel, compliance dashboard
# currently verified via TypeScript compilation
```

## Production Deployment

See [DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md) for production deployment guide.

## Support

For issues during demo:
1. Check service health endpoints
2. Review browser console (F12)
3. Check backend logs
4. Verify Canton node status: `docker logs cantondex-backend-canton-1`
