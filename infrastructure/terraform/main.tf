# VPC Module
module "vpc" {
  source = "./modules/vpc"

  project_name           = var.project_name
  vpc_cidr               = var.vpc_cidr
  availability_zones     = var.availability_zones
  public_subnet_cidrs    = var.public_subnet_cidrs
  private_subnet_cidrs   = var.private_subnet_cidrs
  database_subnet_cidrs  = var.database_subnet_cidrs

  tags = var.tags
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security_groups"

  project_name = var.project_name
  vpc_id       = module.vpc.vpc_id
  vpc_cidr     = var.vpc_cidr

  tags = var.tags
}

# IAM Module
module "iam" {
  source = "./modules/iam"

  project_name       = var.project_name
  oidc_provider_arn  = module.eks.oidc_provider_arn
  oidc_provider_url  = module.eks.oidc_provider_url

  tags = var.tags

  depends_on = [module.eks]
}

# EKS Module
module "eks" {
  source = "./modules/eks"

  project_name                      = var.project_name
  environment                       = var.environment
  cluster_version                   = var.cluster_version
  vpc_id                           = module.vpc.vpc_id
  private_subnet_ids               = module.vpc.private_subnet_ids
  public_subnet_ids                = module.vpc.public_subnet_ids
  eks_cluster_role_arn             = aws_iam_role.eks_cluster.arn
  eks_node_group_role_arn          = aws_iam_role.eks_node_group.arn
  eks_control_plane_security_group_id = module.security_groups.eks_control_plane_security_group_id
  ebs_csi_driver_role_arn          = aws_iam_role.ebs_csi_driver.arn

  desired_size           = var.eks_node_count
  min_size              = var.eks_min_node_count
  max_size              = var.eks_max_node_count
  instance_types        = var.eks_instance_types
  enable_spot_instances = var.enable_spot_instances

  iam_role_policy_attachments = [
    aws_iam_role_policy_attachment.eks_cluster_policy.id,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller.id
  ]

  iam_node_policy_attachments = [
    aws_iam_role_policy_attachment.eks_worker_node_policy.id,
    aws_iam_role_policy_attachment.eks_cni_policy.id,
    aws_iam_role_policy_attachment.eks_container_registry_policy.id
  ]

  tags = var.tags

  depends_on = [
    module.security_groups
  ]
}

# IAM Roles for EKS (created here to avoid circular dependency)
resource "aws_iam_role" "eks_cluster" {
  name               = "${var.project_name}-${var.environment}-eks-cluster-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role_policy_attachment" "eks_vpc_resource_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role" "eks_node_group" {
  name               = "${var.project_name}-${var.environment}-eks-node-group-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role_policy_attachment" "eks_container_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_group.name
}

resource "aws_iam_role" "ebs_csi_driver" {
  name               = "${var.project_name}-${var.environment}-ebs-csi-driver-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "ebs_csi_driver" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
  role       = aws_iam_role.ebs_csi_driver.name
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  project_name = var.project_name
  environment  = var.environment

  postgres_version = "15.3"
  instance_class   = var.rds_instance_class
  allocated_storage = var.rds_allocated_storage
  max_allocated_storage = var.rds_max_allocated_storage

  db_username = var.db_username
  db_password = var.db_password

  db_subnet_group_name = module.vpc.database_subnet_group_name
  db_subnet_ids        = module.vpc.database_subnet_ids
  rds_security_group_id = module.security_groups.rds_security_group_id

  multi_az              = var.rds_multi_az
  backup_retention_days = 30
  kms_key_id           = aws_kms_key.rds.arn

  enable_read_replica = true

  pqs_instance_class         = var.rds_instance_class
  pqs_allocated_storage      = var.rds_allocated_storage
  pqs_max_allocated_storage  = var.rds_max_allocated_storage

  timescale_instance_class      = var.rds_instance_class
  timescale_allocated_storage   = var.rds_allocated_storage
  timescale_max_allocated_storage = var.rds_max_allocated_storage

  tags = var.tags
}

# ElastiCache Redis Module
module "redis" {
  source = "./modules/redis"

  project_name = var.project_name
  environment  = var.environment

  redis_version = "7.0"
  node_type     = var.redis_node_type
  num_cache_clusters = var.redis_num_cache_clusters
  automatic_failover_enabled = var.redis_automatic_failover
  multi_az_enabled = true

  auth_token = random_password.redis_auth_token.result

  subnet_ids        = module.vpc.database_subnet_ids
  security_group_id = module.security_groups.redis_security_group_id
  snapshot_retention_days = 7
  sns_topic_arn     = aws_sns_topic.alerts.arn

  tags = var.tags
}

# MSK Kafka Module
module "msk" {
  source = "./modules/msk"

  project_name = var.project_name
  environment  = var.environment

  kafka_version = "3.5.1"
  number_of_brokers = var.msk_number_of_brokers
  broker_instance_type = var.msk_broker_instance_type
  ebs_volume_size = var.msk_ebs_volume_size

  subnet_ids        = module.vpc.private_subnet_ids
  security_group_id = module.security_groups.msk_security_group_id

  kms_key_arn = aws_kms_key.kafka.arn

  enable_scram_auth = true
  kafka_username = var.kafka_username
  kafka_password = var.kafka_password

  tags = var.tags
}

# KMS Keys for encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = var.tags
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${var.project_name}-${var.environment}-rds"
  target_key_id = aws_kms_key.rds.key_id
}

resource "aws_kms_key" "kafka" {
  description             = "KMS key for Kafka encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = var.tags
}

resource "aws_kms_alias" "kafka" {
  name          = "alias/${var.project_name}-${var.environment}-kafka"
  target_key_id = aws_kms_key.kafka.key_id
}

# Random password for Redis
resource "random_password" "redis_auth_token" {
  length  = 32
  special = true
}

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment}-alerts"

  tags = var.tags
}
