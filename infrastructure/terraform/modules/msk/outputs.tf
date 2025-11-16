output "cluster_arn" {
  value = aws_msk_cluster.main.arn
}

output "cluster_id" {
  value = aws_msk_cluster.main.id
}

output "bootstrap_brokers" {
  value = aws_msk_cluster.main.bootstrap_brokers
}

output "bootstrap_brokers_tls" {
  value = aws_msk_cluster.main.bootstrap_brokers_tls
}

output "broker_node_group_info" {
  value = aws_msk_cluster.main.broker_node_group_info
}

output "zookeeper_connect_string" {
  value = aws_msk_cluster.main.zookeeper_connect_string
}
