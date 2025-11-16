resource "aws_msk_configuration" "main" {
  name              = "${var.project_name}-${var.environment}-config"
  kafka_versions    = [var.kafka_version]
  server_properties = <<PROPERTIES
auto.create.topics.enable=true
default.replication.factor=3
min.insync.replicas=2
log.retention.hours=168
log.retention.bytes=1073741824
num.io.threads=8
num.network.threads=5
num.replica.fetchers=4
replica.lag.time.max.ms=10000
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600
unclean.leader.election.enable=false
zookeeper.session.timeout.ms=18000
PROPERTIES

  tags = var.tags
}

resource "aws_msk_cluster" "main" {
  cluster_name           = "${var.project_name}-${var.environment}-kafka"
  kafka_version          = var.kafka_version
  number_of_broker_nodes = var.number_of_brokers

  broker_node_group_info {
    instance_type   = var.broker_instance_type
    ebs_volume_size = var.ebs_volume_size
    client_subnets  = var.subnet_ids
    security_groups = [var.security_group_id]

    storage_info {
      ebs_storage_info {
        volume_size            = var.ebs_volume_size
        provisioned_throughput {
          enabled           = true
          volume_throughput = 250
        }
      }
    }

    connectivity_info {
      public_access {
        type = "DISABLED"
      }
    }
  }

  encryption_info {
    encryption_at_rest {
      enabled  = true
      kms_key_arn = var.kms_key_arn
    }

    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
  }

  client_authentication {
    sasl {
      enabled = true
      iam    = true
    }
  }

  logging_info {
    broker_logs {
      cloudwatch_logs {
        enabled   = true
        log_group = aws_cloudwatch_log_group.kafka.name
      }
      firehose {
        enabled         = false
      }
      s3 {
        enabled = false
      }
    }
  }

  open_monitoring {
    prometheus {
      jmx_exporter {
        enabled_in_broker = true
        level             = "ALL"
      }
      node_exporter {
        enabled_in_broker = true
        level             = "ALL"
      }
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-kafka"
    }
  )

  depends_on = [aws_msk_configuration.main]
}

# CloudWatch Log Group for Kafka
resource "aws_cloudwatch_log_group" "kafka" {
  name              = "/aws/msk/${var.project_name}/${var.environment}"
  retention_in_days = 7

  tags = var.tags
}

# Create Kafka topics
resource "aws_msk_scram_secret_association" "scram_secret" {
  count           = var.enable_scram_auth ? 1 : 0
  cluster_arn     = aws_msk_cluster.main.arn
  secret_arn_list = [aws_secretsmanager_secret.kafka_credentials[0].arn]
}

resource "aws_secretsmanager_secret" "kafka_credentials" {
  count                   = var.enable_scram_auth ? 1 : 0
  name                    = "${var.project_name}/${var.environment}/kafka/credentials"
  recovery_window_in_days = 7

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "kafka_credentials" {
  count      = var.enable_scram_auth ? 1 : 0
  secret_id  = aws_secretsmanager_secret.kafka_credentials[0].id
  secret_string = jsonencode({
    username = var.kafka_username
    password = var.kafka_password
  })
}

# SNS Topic for Kafka Alerts
resource "aws_sns_topic" "kafka_alerts" {
  name = "${var.project_name}-${var.environment}-kafka-alerts"

  tags = var.tags
}

# Create Kafka topic configurations
locals {
  kafka_topics = {
    trades = {
      partitions      = 10
      replication_factor = 3
      retention_ms    = 604800000  # 7 days
    }
    orders = {
      partitions      = 10
      replication_factor = 3
      retention_ms    = 604800000
    }
    settlements = {
      partitions      = 10
      replication_factor = 3
      retention_ms    = 604800000
    }
    alerts = {
      partitions      = 5
      replication_factor = 3
      retention_ms    = 86400000  # 1 day
    }
    compliance-events = {
      partitions      = 5
      replication_factor = 3
      retention_ms    = 31536000000  # 1 year for audit
    }
  }
}
