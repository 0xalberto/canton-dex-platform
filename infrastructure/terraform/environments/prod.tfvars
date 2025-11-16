# Production Environment Variables
aws_region     = "us-east-1"
environment    = "prod"
cluster_name   = "cantondex-prod"
cluster_version = "1.28"

# VPC Configuration
vpc_cidr               = "10.0.0.0/16"
availability_zones     = ["us-east-1a", "us-east-1b", "us-east-1c"]
public_subnet_cidrs    = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs   = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
database_subnet_cidrs  = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]

# EKS Configuration - Production: Higher resource allocation
eks_node_count    = 5
eks_min_node_count = 5
eks_max_node_count = 30
eks_instance_types = ["m5.xlarge", "m5.2xlarge"]

# Spot Instances for cost optimization
enable_spot_instances = true

# Database Configuration - Production: Higher resources with Multi-AZ
rds_allocated_storage      = 200
rds_max_allocated_storage  = 1000
rds_instance_class         = "db.r6g.2xlarge"
rds_multi_az               = true

# Redis Configuration - Production: Cluster mode enabled
redis_node_type              = "cache.r6g.xlarge"
redis_num_cache_clusters     = 3
redis_automatic_failover     = true

# MSK Configuration - Production: 5 brokers for high availability
msk_broker_instance_type = "kafka.m5.xlarge"
msk_number_of_brokers    = 5
msk_ebs_volume_size      = 2000

# Enable all monitoring and security
enable_vault      = true
enable_monitoring = true
enable_logging    = true

# Tags for production
tags = {
  Environment = "production"
  CostCenter  = "engineering"
  Team        = "infrastructure"
  Compliance  = "required"
}
