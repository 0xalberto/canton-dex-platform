# Monitoring Module - CloudWatch

resource "aws_cloudwatch_log_group" "eks" {
  name              = "/aws/eks/${var.cluster_name}"
  retention_in_days = 30

  tags = {
    Name = "${var.environment}-eks-logs"
  }
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/app/${var.environment}"
  retention_in_days = 30

  tags = {
    Name = "${var.environment}-app-logs"
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.environment}-alerts"

  tags = {
    Name = "${var.environment}-alerts"
  }
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email

  depends_on = [aws_sns_topic.alerts]
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.environment}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/EKS", "node_cpu_utilization", { stat = "Average" }],
            [".", "node_memory_utilization", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "Node Resource Utilization"
        }
      }
    ]
  })
}

output "log_group_name" {
  value = aws_cloudwatch_log_group.app.name
}

output "sns_topic_arn" {
  value = aws_sns_topic.alerts.arn
}
