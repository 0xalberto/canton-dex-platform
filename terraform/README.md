# Terraform Infrastructure as Code

This directory contains Terraform modules and configurations for deploying CantonDEX infrastructure on AWS.

## Structure

```
terraform/
├── main.tf                 # Main configuration
├── variables.tf            # Input variables
├── outputs.tf              # Output values
├── terraform.tf            # Terraform version & backend
├── environments/           # Environment-specific configurations
│   ├── dev.tfvars         # Development environment
│   ├── staging.tfvars     # Staging environment
│   └── prod.tfvars        # Production environment
└── modules/               # Reusable modules
    ├── vpc/               # VPC and networking
    ├── eks/               # EKS Kubernetes cluster
    ├── rds/               # RDS PostgreSQL database
    ├── redis/             # ElastiCache Redis cluster
    ├── alb/               # Application Load Balancer
    ├── security_groups/   # Security Groups
    ├── iam/               # IAM roles and policies
    └── monitoring/        # CloudWatch monitoring
```

## Prerequisites

1. **Terraform** >= 1.0
   ```bash
   terraform -v
   ```

2. **AWS CLI** >= 2.0
   ```bash
   aws --version
   aws configure
   ```

3. **AWS Credentials** configured with appropriate IAM permissions:
   - EC2, VPC, EKS, RDS, ElastiCache, IAM, CloudWatch

## Quick Start

### 1. Initialize Terraform

```bash
cd terraform

# Download providers and initialize working directory
terraform init -backend-config="bucket=cantondex-terraform-state" \
               -backend-config="key=prod/terraform.tfstate" \
               -backend-config="region=us-east-1" \
               -backend-config="dynamodb_table=cantondex-terraform-lock"
```

### 2. Plan Deployment

```bash
# Plan changes for development
terraform plan -var-file=environments/dev.tfvars -out=tfplan-dev

# Plan changes for staging
terraform plan -var-file=environments/staging.tfvars -out=tfplan-staging

# Plan changes for production
terraform plan -var-file=environments/prod.tfvars -out=tfplan-prod
```

### 3. Apply Changes

```bash
# Apply development infrastructure
terraform apply tfplan-dev

# Apply staging infrastructure
terraform apply tfplan-staging

# Apply production infrastructure (requires approval)
terraform apply tfplan-prod
```

### 4. Get Outputs

```bash
# List all outputs
terraform output

# Get specific output
terraform output cluster_endpoint
terraform output rds_endpoint

# Export outputs to JSON
terraform output -json > outputs.json
```

## Environment Variables

Set AWS credentials via environment variables:

```bash
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=xxx
export AWS_SECRET_ACCESS_KEY=xxx
```

Or use AWS named profiles:

```bash
export AWS_PROFILE=cantondex-prod
```

## Deploying to Kubernetes

After provisioning the infrastructure, configure kubectl:

```bash
# Get kubeconfig command from outputs
aws eks update-kubeconfig --region us-east-1 --name cantondex-prod

# Verify connection
kubectl cluster-info
kubectl get nodes
```

## Database Configuration

After RDS is created, initialize the database:

```bash
# Get RDS endpoint from outputs
RDS_ENDPOINT=$(terraform output -raw rds_database_endpoint)

# Connect to database
psql -h $RDS_ENDPOINT -U cantondex -d cantondex

# Run migrations (from API Gateway service)
docker-compose exec api-gateway alembic upgrade head
```

## Monitoring

Access CloudWatch:

```bash
# Get ALB DNS name
terraform output alb_dns_name

# Get CloudWatch log group
terraform output cloudwatch_log_group
```

## State Management

Terraform state is stored remotely in S3 with DynamoDB locking.

**Important**: Never commit `.tfstate` files to Git!

### View Remote State

```bash
# List state files in S3
aws s3 ls s3://cantondex-terraform-state/

# Download state file locally
aws s3 cp s3://cantondex-terraform-state/prod/terraform.tfstate .
```

### Lock Management

```bash
# View locks
aws dynamodb scan --table-name cantondex-terraform-lock

# Force unlock (use with caution!)
terraform force-unlock <LOCK_ID>
```

## Scaling

### Scale Kubernetes Node Group

```bash
# Update node group size in environment tfvars
# Then apply:
terraform plan -var-file=environments/prod.tfvars -out=tfplan
terraform apply tfplan
```

### Scale RDS

```bash
# Update database_allocated_storage in tfvars
# Then apply changes
terraform plan -var-file=environments/prod.tfvars -out=tfplan
terraform apply tfplan
```

## Troubleshooting

### Provider Issues

```bash
# Reinitialize providers
terraform init -upgrade

# Check provider versions
terraform providers
```

### State Lock Issues

```bash
# List locked resources
terraform show

# If state is locked after failed apply
terraform force-unlock <LOCK_ID>
```

### Common Errors

**Error: Error creating subnet**
- Ensure VPC CIDR doesn't conflict with existing VPCs
- Check availability zones in your region

**Error: Error assuming role**
- Verify IAM permissions
- Check AWS credentials

**Error: EKS cluster creation timeout**
- Check CloudWatch logs
- Verify subnet configuration

## Maintenance

### Upgrade Kubernetes Version

```bash
# Update kubernetes_version in variables
# Plan and apply

terraform plan -var-file=environments/prod.tfvars -out=tfplan
terraform apply tfplan
```

### Backup & Restore

**Database Backup**
```bash
aws rds create-db-snapshot \
  --db-instance-identifier cantondex-prod \
  --db-snapshot-identifier cantondex-prod-backup-2024-01-15
```

**Restore from Backup**
```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier cantondex-prod-restored \
  --db-snapshot-identifier cantondex-prod-backup-2024-01-15
```

## Cleanup

**Destroy everything (WARNING: Destructive operation!)**

```bash
terraform destroy -var-file=environments/dev.tfvars
```

**Destroy specific resource**

```bash
terraform destroy -target=module.rds -var-file=environments/prod.tfvars
```

## Cost Optimization

### Current Estimated Monthly Cost

- EKS: ~$73 (cluster + data transfer)
- EC2 (5x t3.large): ~$150-200
- RDS (t3.large, 200GB): ~$400-500
- ElastiCache (t3.large, 3 nodes): ~$200-300
- **Total**: ~$900-1200/month (varies by region)

### Cost Reduction Tips

1. Use dev environment for testing
2. Use spot instances for non-critical workloads
3. Enable RDS reserved instances
4. Use VPC endpoints to reduce data transfer costs
5. Monitor unused resources

## IAM Permissions Required

Minimal IAM policy for Terraform:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "eks:*",
        "rds:*",
        "elasticache:*",
        "iam:*",
        "logs:*",
        "cloudwatch:*"
      ],
      "Resource": "*"
    }
  ]
}
```

## Support

For issues or questions:
1. Check Terraform debug logs: `TF_LOG=DEBUG terraform plan`
2. Review CloudFormation events in AWS Console
3. Check application logs in CloudWatch

---

**Last Updated**: 2025-11-16
**Maintainer**: DevOps Team
