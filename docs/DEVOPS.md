# CantonDEX DevOps & CI/CD Pipeline

**Status**: EPIC-05 Implementation In Progress
**Date**: 2025-11-16
**Version**: 1.0.0

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Local Development](#local-development)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Deployment](#deployment)
6. [Monitoring & Observability](#monitoring--observability)
7. [Infrastructure as Code](#infrastructure-as-code)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This document describes the DevOps infrastructure, CI/CD pipelines, and deployment procedures for CantonDEX. The system is designed for:

- **Fast Feedback**: CI pipeline completes in <10 minutes
- **Safe Deployments**: Automated testing, linting, security scanning
- **Reliable Infrastructure**: Infrastructure as Code (IaC) with Terraform
- **Observable Systems**: Prometheus metrics, Grafana dashboards, ELK logging, Jaeger tracing

### Key Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Source Control | GitHub | Version control & pull requests |
| CI/CD | GitHub Actions | Automated testing, linting, building |
| Containerization | Docker | Consistent development & production environments |
| Orchestration | Kubernetes | Container orchestration & deployment |
| Infrastructure | Terraform | Infrastructure as Code (AWS) |
| Monitoring | Prometheus + Grafana | Metrics collection & visualization |
| Logging | ELK Stack | Centralized log aggregation |
| Tracing | Jaeger | Distributed request tracing |

---

## Architecture

### Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Load Balancer (ALB)                      │
├─────────────────────────────────────────────────────────────────┤
│                    Kubernetes Ingress Controller                 │
├─────────────────────────────────────────────────────────────────┤
│                       Kubernetes Cluster                         │
├──────────────┬──────────────┬──────────────┬──────────────┬──────┤
│   API GW     │  Matching    │ Compliance   │    Risk      │ Notif │
│ (FastAPI)    │   Engine     │  Service     │   Management │Service│
│              │   (Rust)     │   (Python)   │   (Python)   │(Pyth) │
├──────────────┴──────────────┴──────────────┴──────────────┴──────┤
│                    Shared Services                               │
├──────────────┬──────────────┬──────────────┬──────────────┬──────┤
│ PostgreSQL   │    Redis     │    Kafka     │  Vault       │Consul│
│ (Primary)    │   Cache      │  Message Q   │  Secrets     │Config│
└──────────────┴──────────────┴──────────────┴──────────────┴──────┘
```

### CI/CD Pipeline Flow

```
Push to GitHub
    ↓
[1] GitHub Actions Triggered
    ├─ Linting (Flake8, Clippy)
    ├─ Formatting Check (Black, rustfmt)
    ├─ Security Scan (Bandit, cargo-audit)
    ├─ Unit Tests (pytest, cargo test)
    └─ Coverage Report
    ↓
[2] Build Docker Images (on main/develop)
    ├─ Build & push to registry
    └─ Tag with commit SHA
    ↓
[3] Deploy to Staging (auto)
    ├─ Apply Terraform changes
    ├─ Deploy via Helm
    ├─ Run integration tests
    └─ Smoke tests
    ↓
[4] Manual Approval → Deploy to Production
    ├─ Blue-green deployment
    ├─ Canary rollout (10% → 50% → 100%)
    └─ Health checks
```

---

## Local Development

### Prerequisites

- Docker & Docker Compose
- Python 3.11+
- Rust 1.75+
- Git

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/cantondex/cantondex.git
   cd cantondex
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Update .env with your configuration
   ```

3. **Start services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL database
   - Redis cache
   - Kafka message broker
   - All backend services

4. **Verify services are running**
   ```bash
   docker-compose ps
   ```

5. **View logs**
   ```bash
   # All services
   docker-compose logs -f

   # Specific service
   docker-compose logs -f api-gateway
   ```

### Common Tasks

**Run tests locally**
```bash
# Python services
cd cantondex-backend/api-gateway
python -m pytest

# Rust services
cd cantondex-backend/matching-engine
cargo test
```

**Format code**
```bash
# Python
cd cantondex-backend/api-gateway
black .
isort .

# Rust
cd cantondex-backend/matching-engine
cargo fmt
```

**Stop services**
```bash
docker-compose down
```

**Remove volumes (reset data)**
```bash
docker-compose down -v
```

---

## CI/CD Pipeline

### GitHub Actions Workflows

#### 1. Python CI Pipeline (`.github/workflows/ci-python.yml`)

Triggers on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`
- Changes in Python service directories

**Jobs:**
1. **Linting** (parallel for each service)
   - Black formatting check
   - isort import check
   - Flake8 linting
   - Pylint static analysis

2. **Testing** (API Gateway)
   - Unit tests with pytest
   - Coverage report
   - Upload to Codecov

3. **Security Scanning**
   - Bandit security audit
   - pip-audit dependency check
   - Fail on critical vulnerabilities

4. **Docker Build** (on main/develop)
   - Build Docker image
   - Ready for registry push

#### 2. Rust CI Pipeline (`.github/workflows/ci-rust.yml`)

Triggers on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`
- Changes in Rust service directories

**Jobs:**
1. **Format Check**
   - rustfmt verification

2. **Linting**
   - Clippy with `-D warnings`

3. **Testing**
   - Unit tests
   - Benchmark compilation

4. **Security Audit**
   - cargo-audit dependency check
   - Fail on vulnerabilities

5. **Release Build** (on main/develop)
   - Release binary compilation
   - Docker image build

### Pipeline SLAs

| Step | Target | Status |
|------|--------|--------|
| Linting | <2 min | ✅ |
| Testing | <5 min | ✅ |
| Security Scan | <2 min | ✅ |
| Docker Build | <3 min | ✅ |
| **Total CI Time** | **<10 min** | ✅ |

---

## Deployment

### Environments

```yaml
Development:
  - Docker Compose on local machine
  - Fast iteration cycle
  - All services running

Staging:
  - Kubernetes cluster in AWS
  - Production-like setup
  - Auto-deployed from develop branch

Production:
  - Multi-AZ Kubernetes cluster
  - High availability setup
  - Manual approval required
```

### Deployment Methods

#### 1. Local Development
```bash
docker-compose up -d
```

#### 2. Kubernetes Deployment

**Prerequisites:**
- `kubectl` configured
- `helm` 3.x
- Docker images in registry

**Deploy via Helm:**
```bash
# Create values file
cp helm/values.example.yaml helm/values-prod.yaml

# Deploy or upgrade
helm upgrade --install cantondex ./helm/cantondex \
  -f helm/values-prod.yaml \
  --namespace cantondex \
  --create-namespace
```

**Check deployment status:**
```bash
kubectl rollout status deployment/api-gateway -n cantondex
kubectl get pods -n cantondex
```

### Rollback Procedures

**Automatic Rollback** (on deployment failure)
```bash
kubectl rollout undo deployment/api-gateway -n cantondex
```

**Manual Rollback** (if needed)
```bash
# View history
kubectl rollout history deployment/api-gateway -n cantondex

# Rollback to previous version
kubectl rollout undo deployment/api-gateway \
  --to-revision=2 \
  -n cantondex
```

---

## Monitoring & Observability

### Metrics (Prometheus)

All services expose Prometheus metrics at `/metrics` endpoint.

**Key metrics:**
- Request rate, latency, errors (RED metrics)
- Container CPU, memory, disk usage (USE metrics)
- Custom business metrics (orders processed, trades matched)

**Access Prometheus:**
```bash
kubectl port-forward -n cantondex svc/prometheus 9090:9090
# Visit: http://localhost:9090
```

### Dashboards (Grafana)

Pre-built dashboards for:
- Infrastructure metrics (nodes, pods, network)
- Application performance (latency, throughput, errors)
- Business metrics (order volume, settlement times)

**Access Grafana:**
```bash
kubectl port-forward -n cantondex svc/grafana 3000:3000
# Visit: http://localhost:3000
# Default: admin / admin
```

### Logs (ELK Stack)

Centralized logging with:
- **Elasticsearch**: Log storage
- **Logstash**: Log processing
- **Kibana**: Log search & visualization

**Access Kibana:**
```bash
kubectl port-forward -n cantondex svc/kibana 5601:5601
# Visit: http://localhost:5601
```

### Distributed Tracing (Jaeger)

Traces all requests across services.

**Access Jaeger UI:**
```bash
kubectl port-forward -n cantondex svc/jaeger 6831:6831
# Visit: http://localhost:16686
```

### Alerting

Alerts configured via Prometheus AlertManager for:
- Pod restarts
- High error rates (>1%)
- High latency (P95 >500ms)
- Resource exhaustion
- Service unavailability

**Notification channels:**
- Slack (primary)
- PagerDuty (critical)
- Email (backup)

---

## Infrastructure as Code

### Terraform

**Structure:**
```
terraform/
├── main.tf           # Provider & main config
├── variables.tf      # Input variables
├── outputs.tf        # Output values
├── modules/
│   ├── vpc/         # Network infrastructure
│   ├── eks/         # Kubernetes cluster
│   ├── rds/         # PostgreSQL database
│   ├── redis/       # Cache layer
│   ├── vault/       # Secrets management
│   └── monitoring/  # Prometheus, Grafana
└── environments/
    ├── dev.tfvars
    ├── staging.tfvars
    └── prod.tfvars
```

**Deploy infrastructure:**
```bash
cd terraform

# Initialize
terraform init

# Plan changes
terraform plan -var-file=environments/prod.tfvars -out=tfplan

# Apply changes
terraform apply tfplan
```

### State Management

- Remote state stored in S3 with DynamoDB lock
- Encrypted at rest
- Versioning enabled
- Backup policy: daily snapshots

**Access state:**
```bash
aws s3 ls s3://cantondex-terraform-state/
aws s3 cp s3://cantondex-terraform-state/prod.tfstate .
```

---

## Troubleshooting

### Common Issues

#### 1. Docker Compose Services Won't Start
```bash
# Check service logs
docker-compose logs postgres

# Common fixes
- Increase Docker memory allocation
- Check port conflicts: lsof -i :5432
- Remove orphaned containers: docker system prune -a
```

#### 2. CI Pipeline Failing
```bash
# Check GitHub Actions logs
# 1. Go to repository → Actions tab
# 2. Click on failed workflow
# 3. Expand failing job to see logs

# Common causes
- Tests failing locally: run pytest/cargo test locally
- Linting errors: run black/cargo fmt locally
- Security vulnerabilities: check pip-audit output
```

#### 3. Kubernetes Pod Not Starting
```bash
# Check pod status
kubectl describe pod <pod-name> -n cantondex

# Check logs
kubectl logs <pod-name> -n cantondex --tail=50 -f

# Common causes
- Image pull errors: check registry credentials
- Resource limits: kubectl top nodes
- Probe failures: check health check endpoints
```

#### 4. Database Migration Failures
```bash
# Check migration status
kubectl logs <pod-name> -n cantondex | grep -i migration

# Rollback migration
alembic downgrade -1  # Python

# View migration history
alembic current
alembic history
```

### Debug Commands

```bash
# Kubernetes debugging
kubectl exec -it <pod-name> -n cantondex -- /bin/bash

# Port forwarding for local access
kubectl port-forward svc/api-gateway 8000:8000 -n cantondex

# Check service endpoints
kubectl get endpoints -n cantondex

# View events
kubectl get events -n cantondex --sort-by='.lastTimestamp'

# Describe resource
kubectl describe pod <pod-name> -n cantondex
```

---

## References

- [CONTRIBUTING.md](../CONTRIBUTING.md) - Development guidelines
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/naming/)

---

## Support & Contact

For DevOps-related questions or issues:
1. Check this documentation
2. Review GitHub Actions logs
3. Check Kubernetes events and logs
4. Contact DevOps team on Slack

---

**Last Updated**: 2025-11-16
**Maintainer**: DevOps Team
