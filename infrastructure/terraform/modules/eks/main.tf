locals {
  cluster_name = "${var.project_name}-${var.environment}-eks"
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = local.cluster_name
  role_arn = var.eks_cluster_role_arn
  version  = var.cluster_version

  vpc_config {
    subnet_ids              = concat(var.private_subnet_ids, var.public_subnet_ids)
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = ["0.0.0.0/0"] # Restrict this in production
    security_group_ids      = [var.eks_control_plane_security_group_id]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  depends_on = [var.iam_role_policy_attachments]

  tags = merge(
    var.tags,
    {
      Name = local.cluster_name
    }
  )
}

# OIDC Provider
data "tls_certificate" "cluster" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "cluster" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.cluster.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-eks-oidc"
    }
  )
}

# On-Demand Node Group
resource "aws_eks_node_group" "on_demand" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${local.cluster_name}-on-demand"
  node_role_arn   = var.eks_node_group_role_arn
  subnet_ids      = var.private_subnet_ids

  scaling_config {
    desired_size = var.desired_size
    max_size     = var.max_size
    min_size     = var.min_size
  }

  instance_types = var.instance_types

  labels = {
    Environment = var.environment
    NodeType    = "on-demand"
  }

  tags = merge(
    var.tags,
    {
      Name = "${local.cluster_name}-on-demand"
    }
  )

  depends_on = [
    var.iam_node_policy_attachments,
  ]
}

# Spot Instance Node Group (optional, for cost optimization)
resource "aws_eks_node_group" "spot" {
  count           = var.enable_spot_instances ? 1 : 0
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${local.cluster_name}-spot"
  node_role_arn   = var.eks_node_group_role_arn
  subnet_ids      = var.private_subnet_ids

  capacity_type = "SPOT"

  scaling_config {
    desired_size = var.spot_desired_size
    max_size     = var.spot_max_size
    min_size     = var.spot_min_size
  }

  instance_types = var.spot_instance_types

  labels = {
    Environment = var.environment
    NodeType    = "spot"
  }

  taints {
    key    = "spot"
    value  = "true"
    effect = "NO_SCHEDULE"
  }

  tags = merge(
    var.tags,
    {
      Name = "${local.cluster_name}-spot"
    }
  )

  depends_on = [
    var.iam_node_policy_attachments,
  ]
}

# Cluster Autoscaler
resource "aws_autoscaling_group_tag" "cluster_autoscaler_on_demand" {
  for_each = toset(data.aws_autoscaling_groups.on_demand.names)

  autoscaling_group_name = each.value

  tag {
    key                 = "k8s.io/cluster-autoscaler/${local.cluster_name}"
    value               = "owned"
    propagate_at_launch = false
  }
}

resource "aws_autoscaling_group_tag" "cluster_autoscaler_spot" {
  for_each = var.enable_spot_instances ? toset(data.aws_autoscaling_groups.spot[0].names) : toset([])

  autoscaling_group_name = each.value

  tag {
    key                 = "k8s.io/cluster-autoscaler/${local.cluster_name}"
    value               = "owned"
    propagate_at_launch = false
  }
}

data "aws_autoscaling_groups" "on_demand" {
  filter {
    name   = "tag:eks:nodegroup-name"
    values = [aws_eks_node_group.on_demand.node_group_name]
  }
}

data "aws_autoscaling_groups" "spot" {
  count = var.enable_spot_instances ? 1 : 0
  filter {
    name   = "tag:eks:nodegroup-name"
    values = [aws_eks_node_group.spot[0].node_group_name]
  }
}

# EKS Add-ons
resource "aws_eks_addon" "vpc_cni" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "vpc-cni"
  addon_version            = data.aws_eks_addon_version.vpc_cni.version
  resolve_conflicts        = "OVERWRITE"
  service_account_role_arn = var.eks_node_group_role_arn

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-vpc-cni"
    }
  )
}

resource "aws_eks_addon" "coredns" {
  cluster_name      = aws_eks_cluster.main.name
  addon_name        = "coredns"
  addon_version     = data.aws_eks_addon_version.coredns.version
  resolve_conflicts = "OVERWRITE"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-coredns"
    }
  )

  depends_on = [aws_eks_node_group.on_demand]
}

resource "aws_eks_addon" "kube_proxy" {
  cluster_name      = aws_eks_cluster.main.name
  addon_name        = "kube-proxy"
  addon_version     = data.aws_eks_addon_version.kube_proxy.version
  resolve_conflicts = "OVERWRITE"

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-kube-proxy"
    }
  )

  depends_on = [aws_eks_node_group.on_demand]
}

resource "aws_eks_addon" "ebs_csi_driver" {
  cluster_name             = aws_eks_cluster.main.name
  addon_name               = "ebs-csi-driver"
  addon_version            = data.aws_eks_addon_version.ebs_csi_driver.version
  resolve_conflicts        = "OVERWRITE"
  service_account_role_arn = var.ebs_csi_driver_role_arn

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-ebs-csi-driver"
    }
  )

  depends_on = [aws_eks_node_group.on_demand]
}

# Get latest addon versions
data "aws_eks_addon_version" "vpc_cni" {
  addon_name             = "vpc-cni"
  kubernetes_version     = aws_eks_cluster.main.version
  most_recent            = true
}

data "aws_eks_addon_version" "coredns" {
  addon_name             = "coredns"
  kubernetes_version     = aws_eks_cluster.main.version
  most_recent            = true
}

data "aws_eks_addon_version" "kube_proxy" {
  addon_name             = "kube-proxy"
  kubernetes_version     = aws_eks_cluster.main.version
  most_recent            = true
}

data "aws_eks_addon_version" "ebs_csi_driver" {
  addon_name             = "ebs-csi-driver"
  kubernetes_version     = aws_eks_cluster.main.version
  most_recent            = true
}
