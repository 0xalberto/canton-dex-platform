variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cluster_version" {
  description = "Kubernetes cluster version"
  type        = string
  default     = "1.28"
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "eks_cluster_role_arn" {
  description = "EKS cluster role ARN"
  type        = string
}

variable "eks_node_group_role_arn" {
  description = "EKS node group role ARN"
  type        = string
}

variable "eks_control_plane_security_group_id" {
  description = "EKS control plane security group ID"
  type        = string
}

variable "ebs_csi_driver_role_arn" {
  description = "EBS CSI driver role ARN"
  type        = string
}

variable "iam_role_policy_attachments" {
  description = "IAM role policy attachments (for depends_on)"
  type        = list(string)
  default     = []
}

variable "iam_node_policy_attachments" {
  description = "IAM node policy attachments (for depends_on)"
  type        = list(string)
  default     = []
}

variable "desired_size" {
  description = "Desired number of on-demand nodes"
  type        = number
  default     = 3
}

variable "min_size" {
  description = "Minimum number of on-demand nodes"
  type        = number
  default     = 3
}

variable "max_size" {
  description = "Maximum number of on-demand nodes"
  type        = number
  default     = 20
}

variable "instance_types" {
  description = "List of instance types for on-demand nodes"
  type        = list(string)
  default     = ["m5.large"]
}

variable "enable_spot_instances" {
  description = "Enable spot instances"
  type        = bool
  default     = true
}

variable "spot_desired_size" {
  description = "Desired number of spot nodes"
  type        = number
  default     = 2
}

variable "spot_min_size" {
  description = "Minimum number of spot nodes"
  type        = number
  default     = 0
}

variable "spot_max_size" {
  description = "Maximum number of spot nodes"
  type        = number
  default     = 10
}

variable "spot_instance_types" {
  description = "List of instance types for spot nodes"
  type        = list(string)
  default     = ["m5.large", "m5.xlarge", "t3.large", "t3.xlarge"]
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
