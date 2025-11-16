# Local Development Guide

## Quick Start (5 minutes)

### 1. Prerequisites

```bash
# Check Docker
docker --version
docker-compose --version

# Check Python
python3 --version  # Should be 3.11+

# Check Rust (optional, for matching engine development)
rustc --version
cargo --version
```

### 2. Clone & Setup

```bash
# Clone repository
git clone https://github.com/cantondex/cantondex.git
cd cantondex

# Create .env file
cp .env.example .env
```

### 3. Start Services

```bash
# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps
```

**Expected output:**
```
NAME                          STATUS
cantondex-postgres            Up (healthy)
cantondex-redis               Up (healthy)
cantondex-zookeeper           Up
cantondex-kafka               Up (healthy)
cantondex-api-gateway         Up (healthy)
cantondex-matching-engine     Up
cantondex-compliance-service  Up
cantondex-risk-management     Up
cantondex-settlement-coordinator  Up
cantondex-notification-service    Up
```

### 4. Test Services

```bash
# Test API Gateway
curl http://localhost:8000/health

# View logs
docker-compose logs -f api-gateway
```

---

## Development Workflows

### API Gateway (Python/FastAPI)

**Edit code:**
- Files in `cantondex-backend/api-gateway/`
- Changes reflected immediately (volume mounted)

**Run tests:**
```bash
docker-compose exec api-gateway pytest
# or from host
cd cantondex-backend/api-gateway
python -m pytest
```

**Format code:**
```bash
cd cantondex-backend/api-gateway
black .
isort .
```

**Run linter:**
```bash
cd cantondex-backend/api-gateway
flake8 .
```

### Matching Engine (Rust)

**Edit code:**
- Files in `cantondex-backend/matching-engine/`

**Run tests:**
```bash
cd cantondex-backend/matching-engine
cargo test
```

**Format code:**
```bash
cd cantondex-backend/matching-engine
cargo fmt
```

**Run linter:**
```bash
cd cantondex-backend/matching-engine
cargo clippy
```

---

## Database Management

### Access PostgreSQL

```bash
# Connect to database
docker-compose exec postgres psql -U cantondex -d cantondex

# Useful SQL commands
\dt              # List tables
\d table_name    # Describe table
\l               # List databases
\q               # Quit
```

### Run Migrations

```bash
# Using Alembic (Python services)
docker-compose exec api-gateway alembic upgrade head

# Check migration status
docker-compose exec api-gateway alembic current

# Create new migration
docker-compose exec api-gateway alembic revision --autogenerate -m "description"
```

### Reset Database

```bash
# Stop and remove containers + volumes
docker-compose down -v

# Restart
docker-compose up -d
```

---

## Cache Management

### Access Redis

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Useful Redis commands
keys *                  # List all keys
get key_name           # Get value
del key_name           # Delete key
flushdb                # Clear all keys
quit                   # Exit
```

### Clear Cache

```bash
# Remove specific key
docker-compose exec redis redis-cli del key_name

# Clear all cache
docker-compose exec redis redis-cli flushdb
```

---

## Message Queue

### Monitor Kafka

```bash
# List topics
docker-compose exec kafka kafka-topics --bootstrap-server kafka:9092 --list

# Create topic
docker-compose exec kafka kafka-topics \
  --bootstrap-server kafka:9092 \
  --create \
  --topic orders \
  --partitions 3 \
  --replication-factor 1

# Monitor topic
docker-compose exec kafka kafka-console-consumer \
  --bootstrap-server kafka:9092 \
  --topic orders \
  --from-beginning
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs <service-name>

# Check resource usage
docker stats

# Restart service
docker-compose restart <service-name>

# Rebuild service
docker-compose up -d --build <service-name>
```

### Port Already in Use

```bash
# Find process using port
lsof -i :<port_number>

# Kill process
kill -9 <pid>

# Or change port in docker-compose.yml
```

### Database Connection Error

```bash
# Verify database is healthy
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### Memory Issues

```bash
# Increase Docker memory (Docker Desktop)
# Settings → Resources → Memory → increase to 4GB+

# Or cleanup
docker system prune -a
docker volume prune
```

---

## IDE Setup

### VS Code

**Extensions:**
- Python (Microsoft)
- Rust Analyzer (rust-lang)
- Docker (Microsoft)
- Remote - Containers (Microsoft)

**Python debugging:**
1. Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: Current File",
      "type": "python",
      "request": "launch",
      "program": "${file}",
      "console": "integratedTerminal"
    }
  ]
}
```

2. Set breakpoint and press F5 to debug

### PyCharm

1. Open project
2. Configure Python interpreter:
   - Settings → Project → Python Interpreter
   - Add interpreter → Docker Compose → Select service
3. Configure run configuration for tests

---

## Git Workflow

### Create Feature Branch

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/my-feature

# Make changes
git add .
git commit -m "feat: description of change"

# Push to remote
git push -u origin feature/my-feature

# Create pull request on GitHub
```

### Keep Fork Updated

```bash
# Add upstream remote
git remote add upstream https://github.com/cantondex/cantondex.git

# Fetch upstream
git fetch upstream

# Rebase on upstream main
git rebase upstream/main

# Force push to your fork
git push origin feature/my-feature --force-with-lease
```

---

## Performance Tips

### Build Cache

```bash
# Docker builds use cache
# To skip cache: docker-compose build --no-cache <service>

# Rust builds cache in target/
# Clean: cargo clean
```

### Database Indexing

```bash
# Create indexes for frequently queried columns
docker-compose exec postgres psql -U cantondex -d cantondex

# Example
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_trades_timestamp ON trades(created_at DESC);
```

### Redis Optimization

```bash
# Monitor Redis commands
docker-compose exec redis redis-cli --stat

# Check memory usage
docker-compose exec redis redis-cli info memory

# Set memory policy
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

---

## Common Commands Cheatsheet

| Command | Purpose |
|---------|---------|
| `docker-compose up -d` | Start all services |
| `docker-compose down` | Stop all services |
| `docker-compose logs -f` | View logs (all services) |
| `docker-compose exec <svc> bash` | Shell into service |
| `docker-compose ps` | List running services |
| `docker-compose build` | Rebuild images |
| `docker-compose restart <svc>` | Restart service |
| `cd cantondex-backend/api-gateway && pytest` | Run tests |
| `cd cantondex-backend/api-gateway && black .` | Format code |
| `curl http://localhost:8000/health` | Health check |

---

## Next Steps

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Read [CONTRIBUTING.md](../CONTRIBUTING.md) for development standards
- Check GitHub Actions logs for CI/CD failures
- Join team Slack for questions

---

**Last Updated**: 2025-11-16
