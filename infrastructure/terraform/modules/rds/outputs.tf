output "primary_endpoint" {
  value = aws_db_instance.primary.endpoint
}

output "primary_address" {
  value = aws_db_instance.primary.address
}

output "primary_port" {
  value = aws_db_instance.primary.port
}

output "primary_id" {
  value = aws_db_instance.primary.id
}

output "pqs_endpoint" {
  value = aws_db_instance.pqs.endpoint
}

output "timescale_endpoint" {
  value = aws_db_instance.timescale.endpoint
}

output "read_replica_endpoint" {
  value = var.enable_read_replica ? aws_db_instance.read_replica[0].endpoint : null
}

output "proxy_endpoint" {
  value = aws_db_proxy.main.endpoint
}

output "secrets_arn" {
  value = aws_secretsmanager_secret.db_credentials.arn
}
