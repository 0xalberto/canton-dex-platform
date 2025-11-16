output "eks_cluster_role_arn" {
  description = "EKS cluster role ARN"
  value       = aws_iam_role.eks_cluster.arn
}

output "eks_cluster_role_name" {
  description = "EKS cluster role name"
  value       = aws_iam_role.eks_cluster.name
}

output "eks_node_group_role_arn" {
  description = "EKS node group role ARN"
  value       = aws_iam_role.eks_node_group.arn
}

output "eks_node_group_role_name" {
  description = "EKS node group role name"
  value       = aws_iam_role.eks_node_group.name
}

output "alb_controller_role_arn" {
  description = "ALB controller role ARN"
  value       = aws_iam_role.alb_controller.arn
}

output "cluster_autoscaler_role_arn" {
  description = "Cluster autoscaler role ARN"
  value       = aws_iam_role.cluster_autoscaler.arn
}

output "ebs_csi_driver_role_arn" {
  description = "EBS CSI driver role ARN"
  value       = aws_iam_role.ebs_csi_driver.arn
}

output "external_secrets_role_arn" {
  description = "External Secrets Operator role ARN"
  value       = aws_iam_role.external_secrets.arn
}

output "ecr_access_policy_arn" {
  description = "ECR access policy ARN"
  value       = aws_iam_policy.ecr_access.arn
}
