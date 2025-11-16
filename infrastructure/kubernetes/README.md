# Kubernetes Deployment for CantonDEX

This directory contains Kubernetes manifests for deploying CantonDEX on EKS.

## Directory Structure

```
kubernetes/
├── base/              # Base manifests for all environments
│   ├── namespace.yaml
│   ├── rbac.yaml
│   ├── configmap.yaml
│   ├── secrets-template.yaml
│   ├── deployments.yaml
│   ├── services.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   └── kustomization.yaml
├── overlays/
│   ├── prod/          # Production environment
│   │   ├── kustomization.yaml
│   │   ├── patch-resources.yaml
│   │   └── secrets.env
│   └── staging/       # Staging environment
│       ├── kustomization.yaml
│       └── secrets.env
└── README.md
```

## Prerequisites

- EKS cluster already provisioned (via Terraform)
- kubectl configured to access the cluster
- kustomize v4.0+
- AWS credentials configured for ECR access

## Deployment

### 1. Create Secrets

Before deploying, create the required secrets:

```bash
# Create cantondex namespace
kubectl create namespace cantondex

# Create secrets from template
kubectl create secret generic cantondex-secrets \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=REDIS_URL="redis://..." \
  --from-literal=JWT_SECRET_KEY="your-secret-key" \
  -n cantondex

# For AWS ECR access (if using private registry)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

kubectl create secret docker-registry ecr-secret \
  --docker-server=ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com \
  --docker-username=AWS \
  --docker-password=$(aws ecr get-login-password --region us-east-1) \
  -n cantondex
```

### 2. Deploy to Production

```bash
# View what will be deployed
kustomize build overlays/prod | kubectl diff -f -

# Apply manifests
kustomize build overlays/prod | kubectl apply -f -

# Verify deployment
kubectl get deployments -n cantondex
kubectl get pods -n cantondex
kubectl get svc -n cantondex
```

### 3. Deploy to Staging

```bash
# View what will be deployed
kustomize build overlays/staging | kubectl diff -f -

# Apply manifests
kustomize build overlays/staging | kubectl apply -f -

# Verify deployment
kubectl get deployments -n cantondex
kubectl get pods -n cantondex
```

## Manifest Details

### Namespaces
- `cantondex`: Main application namespace
- `cantondex-monitoring`: Prometheus, Grafana
- `cantondex-security`: Vault, cert-manager
- `cantondex-logging`: ELK stack

### RBAC
- Service accounts for each service with IRSA (IAM Roles for Service Accounts)
- Pod Security Policies for hardening
- Network Policies for inter-service communication

### ConfigMaps
- `cantondex-config`: Global configuration
- Service-specific configs for API Gateway, Matching Engine, etc.
- Prometheus, Fluentd configurations

### Secrets
- Database credentials
- Redis credentials
- Kafka SASL credentials
- JWT secrets
- TLS certificates
- Docker registry credentials

### Deployments
- 6 microservices with proper resource requests/limits
- Health checks (liveness and readiness probes)
- Security contexts (non-root user, read-only filesystem)
- Pod anti-affinity for distribution across nodes
- Metrics annotations for Prometheus scraping

### Services
- ClusterIP services for internal communication
- Headless service for Matching Engine (gRPC)

### Ingress
- AWS ALB Ingress for public API endpoint
- NGINX Ingress for internal services (optional)
- SSL/TLS termination
- Health check configuration

### HorizontalPodAutoscalers
- CPU and memory-based autoscaling
- Min/max replicas for each service
- Scale-up and scale-down policies

## Verifying Deployment

### Check pod status

```bash
# All pods in cantondex namespace
kubectl get pods -n cantondex

# Detailed pod information
kubectl describe pod api-gateway-xxxx -n cantondex

# Pod logs
kubectl logs -f deployment/api-gateway -n cantondex

# Previous logs (if pod crashed)
kubectl logs -f deployment/api-gateway -n cantondex --previous
```

### Check service connectivity

```bash
# Port forward to test locally
kubectl port-forward svc/api-gateway 8000:8000 -n cantondex

# Test health endpoint
curl http://localhost:8000/health
```

### Check ingress

```bash
# Get ingress status
kubectl get ingress -n cantondex

# Describe ingress
kubectl describe ingress api-gateway-ingress -n cantondex

# Check ALB load balancer DNS
kubectl get ingress -n cantondex -o wide
```

## Scaling

### Manual scaling

```bash
# Scale deployment to 5 replicas
kubectl scale deployment api-gateway --replicas=5 -n cantondex

# Scale multiple services
kubectl scale deployment api-gateway matching-engine settlement-coordinator --replicas=5 -n cantondex
```

### Check HPA status

```bash
# Get HPA status
kubectl get hpa -n cantondex

# Watch HPA scaling decisions
kubectl get hpa api-gateway-hpa -n cantondex -w

# Detailed HPA information
kubectl describe hpa api-gateway-hpa -n cantondex
```

## Troubleshooting

### Pods not starting

```bash
# Check pod events
kubectl describe pod api-gateway-xxxx -n cantondex

# Check logs
kubectl logs api-gateway-xxxx -n cantondex

# Common issues:
# - Missing secrets: kubectl get secrets -n cantondex
# - Image pull errors: kubectl get events -n cantondex
# - Resource constraints: kubectl describe nodes
```

### High memory/CPU usage

```bash
# Check resource requests vs actual usage
kubectl top pods -n cantondex

# Check node resources
kubectl top nodes

# Update resource limits in overlays/prod/patch-resources.yaml
# Then reapply: kustomize build overlays/prod | kubectl apply -f -
```

### Network connectivity issues

```bash
# Test DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup api-gateway

# Test connectivity between pods
kubectl run -it --rm debug --image=busybox --restart=Never -- wget -O- http://api-gateway:8000/health

# Check network policies
kubectl get networkpolicies -n cantondex
kubectl describe networkpolicy cantondex-network-policy -n cantondex
```

### Ingress not working

```bash
# Check ingress controller (ALB)
kubectl get ingress -n cantondex

# Check target groups in AWS Console
aws elbv2 describe-target-groups --region us-east-1

# Check service endpoints
kubectl get endpoints -n cantondex
```

## Updating Deployments

### Rolling update

```bash
# Update image for single service
kubectl set image deployment/api-gateway api-gateway=ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/cantondex/api-gateway:v1.0.1 -n cantondex

# Check rollout status
kubectl rollout status deployment/api-gateway -n cantondex

# View rollout history
kubectl rollout history deployment/api-gateway -n cantondex

# Rollback to previous version
kubectl rollout undo deployment/api-gateway -n cantondex
```

### Using kustomize for updates

```bash
# Update image in overlays/prod/kustomization.yaml
# Edit images section with new tag

# Apply updated manifests
kustomize build overlays/prod | kubectl apply -f -

# Verify rollout
kubectl rollout status deployment/api-gateway -n cantondex
```

## Monitoring and Logging

### Prometheus metrics

```bash
# Port forward to Prometheus
kubectl port-forward -n cantondex-monitoring svc/prometheus 9090:9090

# Access at http://localhost:9090
```

### Grafana dashboards

```bash
# Port forward to Grafana
kubectl port-forward -n cantondex-monitoring svc/grafana 3000:3000

# Access at http://localhost:3000
```

### Centralized logging (ELK)

```bash
# Port forward to Kibana
kubectl port-forward -n cantondex-logging svc/kibana 5601:5601

# Access at http://localhost:5601
# Search logs for application events
```

## Best Practices

1. **Always use namespace isolation**: Keep cantondex in its own namespace
2. **Use resource requests/limits**: Help Kubernetes schedule properly
3. **Enable health checks**: Kubernetes will auto-restart unhealthy pods
4. **Use RBAC**: Service accounts with minimal required permissions
5. **Network policies**: Restrict pod-to-pod communication
6. **Security context**: Run as non-root, read-only filesystem
7. **Pod disruption budgets**: Maintain availability during maintenance
8. **Resource quotas**: Prevent runaway resource consumption
9. **Horizontal Pod Autoscaling**: Scale based on demand
10. **Regular backups**: Backup persistent data regularly

## Advanced Topics

### Custom Metrics Autoscaling

To scale based on custom metrics (Kafka lag, business metrics):

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-custom-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Pods
    pods:
      metric:
        name: kafka_consumer_lag
      target:
        type: AverageValue
        averageValue: "100"
```

### Pod Disruption Budgets

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-gateway-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: api-gateway
```

### Resource Quotas

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: cantondex-quota
spec:
  hard:
    requests.cpu: "50"
    requests.memory: "100Gi"
    limits.cpu: "100"
    limits.memory: "200Gi"
    pods: "50"
```

## Cleanup

### Remove all resources

```bash
# Delete everything in cantondex namespace
kubectl delete namespace cantondex

# Or specific resources
kubectl delete -f overlays/prod -n cantondex
```

## References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [Kustomize Documentation](https://kustomize.io/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
