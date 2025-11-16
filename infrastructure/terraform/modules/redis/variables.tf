variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "redis_version" {
  type    = string
  default = "7.0"
}

variable "node_type" {
  type = string
}

variable "num_cache_clusters" {
  type    = number
  default = 3
}

variable "automatic_failover_enabled" {
  type    = bool
  default = true
}

variable "multi_az_enabled" {
  type    = bool
  default = true
}

variable "auth_token" {
  type      = string
  sensitive = true
}

variable "subnet_ids" {
  type = list(string)
}

variable "security_group_id" {
  type = string
}

variable "snapshot_retention_days" {
  type    = number
  default = 5
}

variable "sns_topic_arn" {
  type = string
}

variable "tags" {
  type = map(string)
}
