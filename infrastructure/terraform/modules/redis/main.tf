resource "aws_elasticache_subnet_group" "main" {
  name           = "${var.project_name}-${var.environment}-redis-subnet"
  subnet_ids     = var.subnet_ids
  tags           = var.tags
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_description = "CantonDEX Redis cluster"
  replication_group_id          = "${var.project_name}-${var.environment}-redis"
  engine                        = "redis"
  engine_version                = var.redis_version
  node_type                     = var.node_type
  parameter_group_name          = aws_elasticache_parameter_group.main.name
  port                          = 6379
  num_cache_clusters            = var.num_cache_clusters
  automatic_failover_enabled    = var.automatic_failover_enabled
  multi_az_enabled              = var.multi_az_enabled
  at_rest_encryption_enabled    = true
  transit_encryption_enabled    = true
  auth_token                    = var.auth_token
  subnet_group_name             = aws_elasticache_subnet_group.main.name
  security_group_ids            = [var.security_group_id]

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow_log.name
    destination_type = "cloudwatch-logs"
    enabled          = true
    log_format       = "json"
    log_type         = "slow-log"
  }

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_engine_log.name
    destination_type = "cloudwatch-logs"
    enabled          = true
    log_format       = "json"
    log_type         = "engine-log"
  }

  snapshot_retention_limit = var.snapshot_retention_days
  snapshot_window         = "03:00-05:00"
  maintenance_window      = "mon:05:00-mon:06:00"

  automatic_minor_version_upgrade = true
  notification_topic_arn          = var.sns_topic_arn

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-redis"
    }
  )

  depends_on = [aws_elasticache_parameter_group.main]
}

resource "aws_elasticache_parameter_group" "main" {
  family      = "redis7"
  name        = "${var.project_name}-${var.environment}-redis-params"
  description = "Parameter group for CantonDEX Redis"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "timeout"
    value = "300"
  }

  parameter {
    name  = "tcp-keepalive"
    value = "60"
  }

  parameter {
    name  = "notify-keyspace-events"
    value = "KEA"
  }

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "redis_slow_log" {
  name              = "/aws/elasticache/redis/${var.project_name}/${var.environment}/slow-log"
  retention_in_days = 7

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "redis_engine_log" {
  name              = "/aws/elasticache/redis/${var.project_name}/${var.environment}/engine-log"
  retention_in_days = 7

  tags = var.tags
}
