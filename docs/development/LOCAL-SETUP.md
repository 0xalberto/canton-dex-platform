# CantonDEX Local Development Setup Guide

## Prerequisites

### System Requirements

**Minimum Specifications**:
- CPU: 4 cores (8+ recommended for comfortable development)
- RAM: 8GB minimum (16GB recommended)
- Disk: 50GB free space SSD
- OS: macOS 12+, Ubuntu 20.04+, Windows 10/11 with WSL2

### Required Software

```bash
# Check versions
node --version      # Should be 18.0.0+
npm --version       # Should be 9.0.0+
pnpm --version      # Should be 8.0.0+
python --version    # Should be 3.11+
rust --version      # Should be 1.70.0+
docker --version    # Should be 24.0.0+
git --version       # Should be 2.40.0+
```

---

## Installation Guide

### Step 1: Clone Repository

```bash
# Clone the main repository
git clone https://github.com/yourusername/cantondex.git
cd cantondex

# Switch to your development branch
git checkout claude/project-documentation-01MEYMADYtBUZR4BgngDvPoi
```

### Step 2: Install Node.js & npm (macOS with Homebrew)

```bash
# Install Node.js
brew install node

# Verify installation
node --version
npm --version

# Install pnpm (faster package manager)
npm install -g pnpm
pnpm --version
```

### Step 3: Install Python 3.11 (macOS)

```bash
# Using Homebrew
brew install python@3.11

# Create alias for easy access
echo 'alias python=python3.11' >> ~/.zshrc
source ~/.zshrc

# Verify
python --version  # Should show 3.11.x
```

### Step 4: Install Rust

```bash
# Using rustup (recommended)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Follow prompts and activate environment
source $HOME/.cargo/env

# Verify
rustc --version
cargo --version
```

### Step 5: Install Docker & Docker Compose

**macOS**:
```bash
# Install Docker Desktop
brew install --cask docker

# Start Docker Desktop from Applications
open /Applications/Docker.app

# Verify installation
docker --version
docker-compose --version
```

**Ubuntu**:
```bash
# Install Docker
sudo apt-get install docker.io docker-compose

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
```

### Step 6: Install PostgreSQL CLI (Optional, for direct DB access)

```bash
# macOS
brew install postgresql

# Ubuntu
sudo apt-get install postgresql-client

# Verify
psql --version
```

---

## Project Setup

### Step 1: Install Dependencies

```bash
# Navigate to project root
cd /path/to/cantondex

# Install all monorepo dependencies
pnpm install

# This installs dependencies for all apps and packages
# ~5-10 minutes depending on internet speed
```

### Step 2: Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit configuration (optional for development)
# Default values in .env.example are suitable for local development
nano .env  # or use your editor
```

**Key environment variables** (defaults usually work):

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cantondex
DB_USER=cantondex_user
DB_PASSWORD=password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=password

# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# API Gateway
API_PORT=8000

# Matching Engine
MATCHING_ENGINE_PORT=50051
```

---

## Running Services Locally

### Method 1: Using Docker Compose (Recommended)

**Step 1: Start Infrastructure**

```bash
# Navigate to project root
cd /path/to/cantondex

# Start all services (infrastructure + backends + frontends)
docker-compose up -d

# Watch logs
docker-compose logs -f

# Verify all services are running
docker-compose ps

# Output should show all containers as "Up"
```

**Step 2: Wait for Service Readiness**

```bash
# Services startup sequence:
# 1. PostgreSQL (30 seconds)
# 2. Redis (10 seconds)
# 3. Zookeeper (20 seconds)
# 4. Kafka (30 seconds)
# 5. API Gateway (15 seconds)
# 6. Matching Engine (15 seconds)
# 7. Frontend apps (loaded on-demand)

# Total startup time: ~2-3 minutes

# Check service health
curl http://localhost:8000/health
```

**Step 3: Access Services**

```
Frontend Applications:
- Trading Terminal: http://localhost:3000
- Admin Panel: http://localhost:3001
- Compliance Dashboard: http://localhost:3002
- Custody Portal: http://localhost:4200

Backend Services:
- API Gateway: http://localhost:8000
- Settlement Coordinator: http://localhost:8003
- Risk Management: http://localhost:8002
- Notification Service: http://localhost:8004

Infrastructure:
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Kafka: localhost:9092

Development Tools:
- API Docs: http://localhost:8000/docs (if Swagger UI enabled)
```

### Method 2: Running Services Individually

**Terminal 1: PostgreSQL & Redis**

```bash
docker run -d \
  --name cantondex-postgres \
  -e POSTGRES_USER=cantondex_user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=cantondex \
  -p 5432:5432 \
  postgres:15-alpine

docker run -d \
  --name cantondex-redis \
  -p 6379:6379 \
  redis:7-alpine
```

**Terminal 2: Kafka Stack**

```bash
docker-compose -f docker-compose.yml up zookeeper kafka
```

**Terminal 3: API Gateway**

```bash
cd cantondex-backend/api-gateway
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

**Terminal 4: Matching Engine**

```bash
cd cantondex-backend/matching-engine
cargo run --release
```

**Terminal 5: Frontend (Choose One)**

```bash
# Trading Terminal
cd apps/trading-terminal
pnpm dev

# Or Admin Panel
cd apps/admin-panel
pnpm dev

# Or Compliance Dashboard
cd apps/compliance-dashboard
pnpm dev

# Or Custody Portal
cd apps/custody-portal
pnpm start
```

---

## Database Setup

### Initialize Database Schema

```bash
# Using docker-compose, schema auto-initializes
# For manual initialization:

psql -h localhost -U cantondex_user -d cantondex < migrations/001-initial-schema.sql

# Verify schema created
psql -h localhost -U cantondex_user -d cantondex -c "\dt"
```

### Seed Sample Data (Optional)

```bash
# Load test data for development
psql -h localhost -U cantondex_user -d cantondex < migrations/002-seed-data.sql

# Verify data loaded
psql -h localhost -U cantondex_user -d cantondex -c "SELECT COUNT(*) FROM users;"
```

---

## Verification Checklist

### Health Checks

```bash
# 1. Check API Gateway
curl http://localhost:8000/health

# Expected response:
# {"status": "healthy", "services": {...}}

# 2. Check Matching Engine (gRPC, harder to test with curl)
# Skip or use: grpcurl -plaintext localhost:50051 grpc.health.v1.Health/Check

# 3. Check Database connection
psql -h localhost -U cantondex_user -d cantondex -c "SELECT 1;"
# Expected: (1 row)

# 4. Check Redis connection
redis-cli -h localhost PING
# Expected: PONG

# 5. Check Kafka connectivity
docker exec cantondex-kafka kafka-topics.sh --bootstrap-server localhost:9092 --list
```

### Frontend Verification

```bash
# 1. Trading Terminal should load
# Browser: http://localhost:3000
# Should see: Login page (or dashboard if signed in)

# 2. Admin Panel should load
# Browser: http://localhost:3001
# Should see: Admin login page

# 3. API should respond
curl -X GET http://localhost:8000/status
```

---

## Common Issues & Fixes

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use different port
docker-compose -e API_PORT=8001 up
```

### Docker Memory Issues

```bash
# If Docker containers keep stopping:
# Increase Docker memory allocation
# Docker Desktop → Preferences → Resources → Memory: Set to 4GB+
```

### PostgreSQL Connection Refused

```bash
# Ensure PostgreSQL container is running
docker ps | grep postgres

# If not, start it
docker-compose up postgres -d

# Wait 30 seconds for startup
sleep 30

# Test connection
psql -h localhost -U cantondex_user -d cantondex -c "SELECT 1;"
```

### Kafka Connection Timeout

```bash
# Wait for Kafka to fully start (takes ~30 seconds)
sleep 30

# Check Kafka broker status
docker logs cantondex-kafka | tail -20

# Restart if needed
docker-compose restart kafka
```

### Python Virtual Environment Issues

```bash
# Remove old venv
rm -rf cantondex-backend/api-gateway/venv

# Recreate it
cd cantondex-backend/api-gateway
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## Development Workflow

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm test --filter=@cantondex/api-gateway

# Run with coverage
pnpm test:coverage

# Run backend Python tests
cd cantondex-backend/api-gateway
pytest tests/ -v --cov

# Run Rust tests
cd cantondex-backend/matching-engine
cargo test --release
```

### Code Linting

```bash
# Lint all JavaScript/TypeScript
pnpm lint

# Fix linting issues
pnpm lint:fix

# Python linting
cd cantondex-backend
flake8 . --max-line-length=120
black . --check

# Fix Python formatting
black . && isort .
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm build --filter=@cantondex/trading-terminal

# Build backend services
cd cantondex-backend/api-gateway && pip install -r requirements.txt
cd cantondex-backend/matching-engine && cargo build --release
```

---

## Development Tips

### Hot Reload
- Frontend: Enabled by default with `pnpm dev`
- Backend Python: Use `--reload` flag with uvicorn
- Backend Rust: Requires rebuild

### Database Debugging

```bash
# Connect directly to database
psql -h localhost -U cantondex_user -d cantondex

# Useful queries
\dt                    # List tables
\d users              # Describe table
SELECT * FROM users;  # View data
```

### Redis Debugging

```bash
# Connect to Redis
redis-cli -h localhost

# List all keys
keys *

# Get value
get user:123

# Monitor all commands
monitor
```

### Kafka Debugging

```bash
# List topics
kafka-topics.sh --bootstrap-server localhost:9092 --list

# Consume from topic
kafka-console-consumer.sh --bootstrap-server localhost:9092 \
  --topic order.events --from-beginning

# Describe topic
kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic order.events
```

### Browser DevTools

```javascript
// Frontend debugging
// Open browser console (F12)

// View API requests
// Network tab → see all API calls

// Check local storage
// Application tab → Storage → Local Storage

// Debug Redux state (if installed Redux DevTools)
// Redux tab → see state changes
```

---

## VS Code Configuration

### Recommended Extensions

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.vscode-pylance",
    "rust-lang.rust-analyzer",
    "ESbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-azuretools.vscode-docker",
    "eamodio.gitlens",
    "ms-vscode-remote.remote-containers"
  ]
}
```

### Debug Configuration

**.vscode/launch.json**:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: API Gateway",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["main:app", "--reload"],
      "cwd": "${workspaceFolder}/cantondex-backend/api-gateway",
      "env": {"PYTHONPATH": "${workspaceFolder}"},
      "console": "integratedTerminal"
    }
  ]
}
```

---

## Next Steps

1. **Explore Codebase**
   - Read [System Architecture](../architecture/SYSTEM-ARCHITECTURE.md)
   - Review [API Documentation](../api/OPENAPI-SPEC.md)

2. **Make Your First Change**
   - Fix a small bug
   - Add a feature
   - Improve documentation

3. **Submit Pull Request**
   - Follow [Contributing Guide](./CONTRIBUTING.md)
   - Request review
   - Iterate on feedback

4. **Get Familiar with Services**
   - Run each service individually
   - Review service documentation
   - Understand data flow

---

## Support

**Questions?**
- Check [FAQs](../knowledge/FAQs.md)
- Search documentation
- Ask in team chat
- Email: dev-support@cantondex.io

**Need Help?**
- [Troubleshooting Guide](../operations/TROUBLESHOOTING.md)
- GitHub Issues: Report bugs
- Discussions: Ask questions
