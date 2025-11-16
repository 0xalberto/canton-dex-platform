output "endpoint" {
  value = aws_elasticache_replication_group.main.configuration_endpoint_address
}

output "cluster_id" {
  value = aws_elasticache_replication_group.main.id
}

output "port" {
  value = aws_elasticache_replication_group.main.port
}

output "primary_endpoint" {
  value = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "reader_endpoint" {
  value = aws_elasticache_replication_group.main.reader_endpoint_address
}
