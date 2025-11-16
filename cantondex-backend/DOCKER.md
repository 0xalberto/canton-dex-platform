# Docker Setup for CantonDEX

This guide explains how to build and run CantonDEX services using Docker.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 4GB+ RAM available for containers
- 20GB+ disk space

## Quick Start

### 1. Start All Services

```bash
cd cantondex-backend
docker-compose up -d
```

This will start all services:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Kafka/Zookeeper (ports 2181, 9092)
- API Gateway (port 8000)
- Matching Engine (port 50051)
- Settlement Coordinator (port 8001)
- Risk Management (port 8002)
- Notification Service (port 8003)
- Compliance Service (port 8004)

### 2. Verify Services

```bash
# Check running containers
docker-compose ps

# View logs
docker-compose logs -f api-gateway

# Test API Gateway health
curl http://localhost:8000/health
```

### 3. Stop Services

```bash
docker-compose down

# Remove all data (volumes)
docker-compose down -v
```

## Building Individual Services

### Build a single service image

```bash
# Build API Gateway
docker build -t cantondex/api-gateway:latest -f api-gateway/Dockerfile .

# Build Matching Engine
docker build -t cantondex/matching-engine:latest -f matching-engine/Dockerfile .

# Build all services
docker-compose build
```

### Push to Registry

```bash
# Tag images
docker tag cantondex/api-gateway:latest your-registry/cantondex/api-gateway:latest

# Push to registry
docker push your-registry/cantondex/api-gateway:latest

# For ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag cantondex/api-gateway:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/cantondex/api-gateway:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/cantondex/api-gateway:latest
```

## Environment Configuration

### Copy .env file

```bash
cp .env.example .env
```

Edit `.env` with your configuration values.

### Override compose environment

```bash
docker-compose -f docker-compose.yml --env-file .env up -d
```

## Service Details

### API Gateway (Python/FastAPI)
- **Port**: 8000
- **Health Check**: GET /health
- **Image**: Multi-stage build using Python 3.11 slim
- **Base Image Size**: ~200MB

### Matching Engine (Rust)
- **Port**: 50051 (gRPC)
- **Health Check**: gRPC health check
- **Image**: Multi-stage build using Rust 1.74
- **Base Image Size**: ~100MB

### Settlement Coordinator (Python)
- **Port**: 8001
- **Health Check**: GET /health
- **Image**: Python 3.11 slim
- **Base Image Size**: ~200MB

### Risk Management (Python)
- **Port**: 8002
- **Health Check**: GET /health
- **Image**: Python 3.11 slim
- **Base Image Size**: ~200MB

### Notification Service (Python)
- **Port**: 8003
- **Health Check**: GET /health
- **Image**: Python 3.11 slim
- **Base Image Size**: ~200MB

### Compliance Service (Python)
- **Port**: 8004
- **Health Check**: GET /health
- **Image**: Python 3.11 slim
- **Base Image Size**: ~200MB

## Docker Best Practices Used

1. **Multi-stage Builds**: Reduces image sizes
2. **Non-root User**: Runs containers as `cantondex` user (UID 1000)
3. **Health Checks**: All services have health checks
4. **Minimal Base Images**: Using `slim` variants for Python and Debian for Rust
5. **Security**: No secrets in images, uses environment variables
6. **Logging**: PYTHONUNBUFFERED=1 for real-time logs
7. **.dockerignore**: Excludes unnecessary files

## Network Configuration

All services are on the `cantondex-network` bridge network:
- Services can communicate via service names (e.g., `postgres:5432`)
- Only exposed ports are accessible from host

## Volume Management

### Data Volumes

```bash
# List volumes
docker volume ls | grep cantondex

# Inspect volume
docker volume inspect cantondex-backend_postgres_data

# Manual backup
docker run --rm -v cantondex-backend_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

### Remove volumes

```bash
docker-compose down -v
```

## Networking

### Access services from host

- API Gateway: http://localhost:8000
- Matching Engine: localhost:50051 (gRPC)
- Settlement Coordinator: http://localhost:8001
- Risk Management: http://localhost:8002
- Notification Service: http://localhost:8003
- Compliance Service: http://localhost:8004
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Kafka: localhost:9092

### Access between services

Services use Docker DNS (service name):
- `postgres:5432`
- `redis:6379`
- `kafka:29092` (internal) or `kafka:9092` (external)

## Development Workflow

### Hot Reloading

Volumes are configured for development:

```bash
# Changes to source code are reflected immediately
docker-compose up -d
# Edit source file
# Service will restart automatically (if configured)
```

### Running Commands in Container

```bash
# Run command in running container
docker-compose exec api-gateway python -m pytest

# Run one-off container
docker-compose run --rm api-gateway python -c "import sys; print(sys.version)"
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api-gateway

# Last 100 lines
docker-compose logs --tail=100 api-gateway

# Timestamps
docker-compose logs -f --timestamps api-gateway
```

## Troubleshooting

### Service fails to start

```bash
# Check logs
docker-compose logs service-name

# Verify health
docker-compose ps

# Recreate service
docker-compose up -d --force-recreate service-name
```

### Database connection errors

```bash
# Verify PostgreSQL is running
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U cantondex -d cantondex -c "SELECT 1"
```

### Port conflicts

```bash
# Change port in docker-compose.yml
# Example: "8000:8000" → "8001:8000"

# Or kill process using port
lsof -i :8000
kill -9 <PID>
```

### Out of disk space

```bash
# Clean up
docker system prune -a --volumes

# Remove specific images
docker rmi cantondex/api-gateway:latest
```

## Production Considerations

### Security

1. **Use secrets management**: HashiCorp Vault, AWS Secrets Manager
2. **Don't use docker-compose in production**: Use Kubernetes or ECS
3. **Image scanning**: Use Trivy or ECR scanning
4. **Private registries**: Don't push to public Docker Hub
5. **Base image updates**: Regularly update base images

### Performance

1. **Resource limits**: Set CPU and memory limits
2. **Health checks**: Already configured
3. **Logging**: Configure log rotation
4. **Network**: Use overlay networks in production

### Example for Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api-gateway
        image: your-registry/cantondex/api-gateway:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: cantondex-secrets
              key: database-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v4
  with:
    context: .
    file: ./api-gateway/Dockerfile
    push: true
    tags: ${{ env.REGISTRY }}/${{ env.IMAGE }}:${{ env.TAG }}
```

## References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Best Practices for Python Docker Images](https://docs.docker.com/language/python/)
- [Best Practices for Rust Docker Images](https://docs.docker.com/language/rust/)
