# Staging Environment Variables
aws_region     = "us-east-1"
environment    = "staging"
cluster_name   = "cantondex-staging"
cluster_version = "1.28"

# VPC Configuration
vpc_cidr               = "10.0.0.0/16"
availability_zones     = ["us-east-1a", "us-east-1b", "us-east-1c"]
public_subnet_cidrs    = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs   = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
database_subnet_cidrs  = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]

# EKS Configuration - Staging: Moderate resources
eks_node_count    = 3
eks_min_node_count = 3
eks_max_node_count = 15
eks_instance_types = ["m5.large", "m5.xlarge"]

# Spot Instances for cost optimization
enable_spot_instances = true

# Database Configuration - Staging: Moderate resources with Multi-AZ
rds_allocated_storage      = 100
rds_max_allocated_storage  = 500
rds_instance_class         = "db.r6g.xlarge"
rds_multi_az               = true

# Redis Configuration - Staging: Cluster mode
redis_node_type              = "cache.r6g.large"
redis_num_cache_clusters     = 3
redis_automatic_failover     = true

# MSK Configuration - Staging: 3 brokers
msk_broker_instance_type = "kafka.m5.large"
msk_number_of_brokers    = 3
msk_ebs_volume_size      = 1000

# Enable monitoring and security
enable_vault      = true
enable_monitoring = true
enable_logging    = true

# Tags for staging
tags = {
  Environment = "staging"
  CostCenter  = "engineering"
  Team        = "infrastructure"
  Compliance  = "required"
}
