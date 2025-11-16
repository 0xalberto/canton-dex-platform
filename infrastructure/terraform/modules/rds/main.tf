locals {
  db_identifier_primary  = "${var.project_name}-${var.environment}-postgres"
  db_identifier_pqs      = "${var.project_name}-${var.environment}-pqs"
  db_identifier_timescale = "${var.project_name}-${var.environment}-timescale"
}

# Main PostgreSQL Database
resource "aws_db_instance" "primary" {
  identifier     = local.db_identifier_primary
  engine         = "postgres"
  engine_version = var.postgres_version
  instance_class = var.instance_class
  allocated_storage = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type   = "gp3"
  storage_iops   = 3000
  storage_throughput = 125

  db_name  = "cantondex"
  username = var.db_username
  password = var.db_password
  port     = 5432

  # Networking
  db_subnet_group_name   = var.db_subnet_group_name
  publicly_accessible    = false
  vpc_security_group_ids = [var.rds_security_group_id]

  # Multi-AZ for high availability
  multi_az = var.multi_az

  # Backups
  backup_retention_period = var.backup_retention_days
  backup_window           = "03:00-04:00"
  copy_tags_to_snapshot   = true
  skip_final_snapshot     = false
  final_snapshot_identifier = "${local.db_identifier_primary}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # Maintenance
  maintenance_window = "mon:04:00-mon:05:00"
  auto_minor_version_upgrade = true

  # Performance Insights
  performance_insights_enabled            = true
  performance_insights_retention_period   = 7

  # Enhanced Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql"]
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_monitoring.arn

  # Encryption
  storage_encrypted = true
  kms_key_id        = var.kms_key_id

  # Parameters
  parameter_group_name = aws_db_parameter_group.main.name

  # Options
  deletion_protection = var.environment == "prod" ? true : false

  tags = merge(
    var.tags,
    {
      Name = local.db_identifier_primary
      Type = "Primary-Database"
    }
  )

  depends_on = [aws_db_parameter_group.main]
}

# PQS (Participant Query Service) Database
resource "aws_db_instance" "pqs" {
  identifier     = local.db_identifier_pqs
  engine         = "postgres"
  engine_version = var.postgres_version
  instance_class = var.pqs_instance_class
  allocated_storage = var.pqs_allocated_storage
  max_allocated_storage = var.pqs_max_allocated_storage
  storage_type   = "gp3"

  db_name  = "cantondex_pqs"
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = var.db_subnet_group_name
  publicly_accessible    = false
  vpc_security_group_ids = [var.rds_security_group_id]
  multi_az               = var.multi_az

  backup_retention_period = var.backup_retention_days
  backup_window           = "03:00-04:00"
  copy_tags_to_snapshot   = true
  skip_final_snapshot     = false
  final_snapshot_identifier = "${local.db_identifier_pqs}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  enabled_cloudwatch_logs_exports = ["postgresql"]
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_monitoring.arn

  storage_encrypted = true
  kms_key_id        = var.kms_key_id

  parameter_group_name = aws_db_parameter_group.pqs.name
  deletion_protection  = var.environment == "prod" ? true : false

  tags = merge(
    var.tags,
    {
      Name = local.db_identifier_pqs
      Type = "PQS-Database"
    }
  )

  depends_on = [aws_db_parameter_group.pqs]
}

# TimescaleDB Database
resource "aws_db_instance" "timescale" {
  identifier     = local.db_identifier_timescale
  engine         = "postgres"
  engine_version = var.postgres_version
  instance_class = var.timescale_instance_class
  allocated_storage = var.timescale_allocated_storage
  max_allocated_storage = var.timescale_max_allocated_storage
  storage_type   = "gp3"
  storage_iops   = 5000
  storage_throughput = 250

  db_name  = "cantondex_timescale"
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = var.db_subnet_group_name
  publicly_accessible    = false
  vpc_security_group_ids = [var.rds_security_group_id]
  multi_az               = var.multi_az

  backup_retention_period = var.backup_retention_days
  enabled_cloudwatch_logs_exports = ["postgresql"]
  monitoring_interval             = 60
  monitoring_role_arn             = aws_iam_role.rds_monitoring.arn

  storage_encrypted = true
  kms_key_id        = var.kms_key_id

  parameter_group_name = aws_db_parameter_group.timescale.name
  deletion_protection  = var.environment == "prod" ? true : false

  tags = merge(
    var.tags,
    {
      Name = local.db_identifier_timescale
      Type = "TimescaleDB-Database"
    }
  )

  depends_on = [aws_db_parameter_group.timescale]
}

# Database Parameter Groups
resource "aws_db_parameter_group" "main" {
  family      = "postgres15"
  name        = "${var.project_name}-${var.environment}-main-params"
  description = "Parameter group for main PostgreSQL database"

  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory/4}"
    apply_method = "pending-reboot"
  }

  parameter {
    name  = "effective_cache_size"
    value = "{DBInstanceClassMemory*3/4}"
    apply_method = "pending-reboot"
  }

  parameter {
    name  = "maintenance_work_mem"
    value = "{DBInstanceClassMemory/16}"
    apply_method = "pending-reboot"
  }

  parameter {
    name  = "work_mem"
    value = "4194304"
    apply_method = "immediate"
  }

  parameter {
    name  = "max_connections"
    value = "500"
    apply_method = "pending-reboot"
  }

  parameter {
    name  = "log_statement"
    value = "all"
    apply_method = "immediate"
  }

  parameter {
    name  = "log_duration"
    value = "true"
    apply_method = "immediate"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"  # Log queries > 1 second
    apply_method = "immediate"
  }

  tags = var.tags
}

resource "aws_db_parameter_group" "pqs" {
  family      = "postgres15"
  name        = "${var.project_name}-${var.environment}-pqs-params"
  description = "Parameter group for PQS database (read-heavy)"

  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory/4}"
    apply_method = "pending-reboot"
  }

  parameter {
    name  = "effective_cache_size"
    value = "{DBInstanceClassMemory*3/4}"
    apply_method = "pending-reboot"
  }

  parameter {
    name  = "max_connections"
    value = "300"
    apply_method = "pending-reboot"
  }

  tags = var.tags
}

resource "aws_db_parameter_group" "timescale" {
  family      = "postgres15"
  name        = "${var.project_name}-${var.environment}-timescale-params"
  description = "Parameter group for TimescaleDB"

  parameter {
    name  = "shared_preload_libraries"
    value = "timescaledb"
    apply_method = "pending-reboot"
  }

  parameter {
    name  = "max_connections"
    value = "200"
    apply_method = "pending-reboot"
  }

  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory/4}"
    apply_method = "pending-reboot"
  }

  tags = var.tags
}

# Read Replica (same region)
resource "aws_db_instance" "read_replica" {
  count                    = var.enable_read_replica ? 1 : 0
  identifier               = "${local.db_identifier_primary}-read-replica"
  replicate_source_db      = aws_db_instance.primary.identifier
  instance_class          = var.instance_class
  publicly_accessible     = false
  vpc_security_group_ids  = [var.rds_security_group_id]
  auto_minor_version_upgrade = true

  storage_encrypted = true
  kms_key_id        = var.kms_key_id

  skip_final_snapshot = false
  final_snapshot_identifier = "${local.db_identifier_primary}-read-replica-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  tags = merge(
    var.tags,
    {
      Name = "${local.db_identifier_primary}-read-replica"
      Type = "Read-Replica"
    }
  )

  depends_on = [aws_db_instance.primary]
}

# RDS Proxy for connection pooling
resource "aws_db_proxy" "main" {
  name                   = "${var.project_name}-${var.environment}-proxy"
  engine_family          = "POSTGRESQL"
  auth {
    auth_scheme = "SECRETS"
    secret_arn  = aws_secretsmanager_secret.db_credentials.arn
  }

  role_arn               = aws_iam_role.proxy.arn
  db_proxy_protocol_version = "POSTGRES"
  max_idle_connections_percent = 50
  max_connections_percent = 100
  connection_borrow_timeout = 120
  session_pinning_filters = ["EXCLUDE_VARIABLE_SETS"]

  require_tls = true
  vpc_subnet_ids = var.db_subnet_ids

  target {
    db_instance_identifier = aws_db_instance.primary.id
  }

  tags = var.tags

  depends_on = [aws_iam_role_policy.proxy]
}

# RDS Proxy Target Group
resource "aws_db_proxy_target_group" "default" {
  db_proxy_name          = aws_db_proxy.main.name
  name                   = "default"
  db_instance_identifiers = [aws_db_instance.primary.id]

  connection_pool_config {
    max_connections              = 100
    max_idle_connections         = 50
    connection_borrow_timeout    = 120
    session_pinning_filters      = ["EXCLUDE_VARIABLE_SETS"]
  }
}

# Secrets Manager for RDS credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.project_name}/${var.environment}/rds/credentials"
  recovery_window_in_days = 7

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    engine   = "postgres"
    host     = aws_db_instance.primary.address
    port     = aws_db_instance.primary.port
    dbname   = "cantondex"
  })
}

# IAM Role for RDS Proxy
resource "aws_iam_role" "proxy" {
  name = "${var.project_name}-${var.environment}-rds-proxy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "proxy" {
  name = "${var.project_name}-${var.environment}-rds-proxy-policy"
  role = aws_iam_role.proxy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.db_credentials.arn
      }
    ]
  })
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  name = "${var.project_name}-${var.environment}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
