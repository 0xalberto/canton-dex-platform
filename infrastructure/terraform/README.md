# CantonDEX Infrastructure as Code (Terraform)

This directory contains the Terraform configurations for provisioning CantonDEX production infrastructure on AWS.

## Overview

The infrastructure is organized into modular Terraform configurations:

- **VPC Module**: Creates VPC, subnets, Internet Gateway, NAT Gateways, and VPC endpoints
- **Security Groups Module**: Creates security groups for ALB, EKS nodes, RDS, Redis, and MSK
- **IAM Module**: Creates IAM roles and policies for EKS service accounts
- **EKS Module**: Creates EKS cluster, node groups (on-demand and spot), and add-ons

## Prerequisites

1. **AWS Account**: You need an AWS account with appropriate permissions
2. **Terraform**: Version 1.5.0 or higher
3. **AWS CLI**: Configured with credentials
4. **kubectl**: For Kubernetes interactions
5. **helm**: For Kubernetes package management

## Directory Structure

```
terraform/
├── main.tf              # Main configuration calling modules
├── providers.tf         # Provider configuration
├── variables.tf         # Global variables
├── outputs.tf          # Output definitions
├── environments/
│   ├── prod.tfvars     # Production environment variables
│   └── staging.tfvars  # Staging environment variables
├── modules/
│   ├── vpc/            # VPC module
│   ├── security_groups/# Security groups module
│   ├── iam/           # IAM roles and policies
│   └── eks/           # EKS cluster module
└── README.md          # This file
```

## Usage

### 1. Initialize Terraform

```bash
cd infrastructure/terraform
terraform init
```

### 2. Select Environment

For **production**:
```bash
terraform plan -var-file=environments/prod.tfvars -out=tfplan
terraform apply tfplan
```

For **staging**:
```bash
terraform plan -var-file=environments/staging.tfvars -out=tfplan
terraform apply tfplan
```

### 3. Configure kubectl

After the cluster is created:

```bash
aws eks update-kubeconfig --name cantondex-prod --region us-east-1
# or
aws eks update-kubeconfig --name cantondex-staging --region us-east-1
```

### 4. Verify Cluster

```bash
kubectl cluster-info
kubectl get nodes
```

## Remote State Management

To use remote state (recommended for production):

1. Create S3 bucket and DynamoDB table:
```bash
aws s3api create-bucket --bucket cantondex-terraform-state --region us-east-1
aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1
```

2. Uncomment the `backend` block in `providers.tf`:
```hcl
backend "s3" {
  bucket         = "cantondex-terraform-state"
  key            = "prod/terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "terraform-locks"
}
```

3. Re-initialize Terraform:
```bash
terraform init
```

## Key Features

### VPC Configuration
- Multi-AZ setup across 3 availability zones
- Public subnets for ALB and NAT Gateways
- Private subnets for EKS nodes
- Database subnets for RDS
- VPC Flow Logs for network monitoring
- VPC endpoints for S3, ECR, and CloudWatch Logs

### EKS Cluster
- Kubernetes 1.28+ with latest security patches
- On-demand node group for stable workloads
- Spot instance node group for cost optimization
- Cluster autoscaler with Karpenter-compatible tagging
- CoreDNS, VPC CNI, kube-proxy, and EBS CSI driver add-ons
- OIDC provider for IRSA (IAM Roles for Service Accounts)
- EKS audit logging enabled

### Security
- Security groups with least privilege access
- IAM roles with minimal required permissions
- Network policies ready for implementation
- Encryption in transit and at rest support
- VPC endpoints to avoid internet exposure

## Outputs

After applying Terraform, you can retrieve outputs:

```bash
terraform output eks_cluster_name
terraform output eks_cluster_endpoint
terraform output vpc_id
```

To retrieve all outputs:
```bash
terraform output
```

## Cost Optimization

The configuration includes several cost optimization features:

1. **Spot Instances**: Enable cost savings on non-critical workloads
2. **Right-sizing**: Instance types can be adjusted in tfvars
3. **Auto-scaling**: Cluster autoscaler automatically adjusts capacity
4. **Resource tagging**: Enables cost allocation and chargeback

To disable spot instances:
```bash
terraform apply -var="enable_spot_instances=false"
```

## Monitoring and Logging

The infrastructure includes:

- **EKS Control Plane Logs**: API, audit, authenticator, controller manager, scheduler
- **VPC Flow Logs**: Network traffic monitoring
- **CloudWatch Integration**: Ready for Prometheus integration

## Next Steps

After infrastructure provisioning:

1. **Install add-ons**: Helm charts for Prometheus, Grafana, ELK stack
2. **Configure DNS**: Setup Route53 and certificate management
3. **Deploy applications**: Use Kubernetes manifests or Helm charts
4. **Setup monitoring**: Deploy observability stack
5. **Enable logging**: Configure centralized logging
6. **Backup and DR**: Setup backup policies and DR procedures

## Troubleshooting

### Cluster creation takes too long
- Normal EKS cluster creation takes 10-15 minutes
- Monitor progress in AWS Console > EKS > Clusters

### Nodes not joining cluster
- Check node security group allows access to cluster endpoint
- Review IAM permissions for node role
- Check VPC configuration for subnet routing

### kubectl commands fail
- Verify kubeconfig is updated: `aws eks update-kubeconfig`
- Check AWS credentials: `aws sts get-caller-identity`
- Verify cluster endpoint is accessible

### Out of capacity errors
- Check max_size in tfvars
- Verify instance type availability in AZs
- Consider adjusting instance types

## Cleanup

To destroy all infrastructure:

```bash
terraform destroy -var-file=environments/prod.tfvars
# or
terraform destroy -var-file=environments/staging.tfvars
```

**Warning**: This will delete all resources including databases. Ensure backups are taken first.

## Best Practices

1. **Use tfvars files** for environment-specific configurations
2. **Enable remote state** for team collaboration
3. **Use workspaces** for multiple environment management
4. **Review plans** before applying: `terraform plan -out=tfplan`
5. **Tag resources** for cost tracking and governance
6. **Enable logging** for audit and troubleshooting
7. **Regular backups** for production databases
8. **Version control** all Terraform configurations

## Support

For issues or questions:
1. Check CloudFormation events in AWS Console
2. Review EKS documentation: https://docs.aws.amazon.com/eks/
3. Check Terraform AWS provider docs: https://registry.terraform.io/providers/hashicorp/aws

## References

- [AWS EKS Best Practices Guide](https://aws.github.io/aws-eks-best-practices/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Kubernetes Official Documentation](https://kubernetes.io/docs/)
