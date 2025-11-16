variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "node_type" {
  type = string
}

variable "num_cache_nodes" {
  type = number
}

variable "engine_version" {
  type = string
}

variable "auth_token" {
  type      = string
  sensitive = true
  default   = ""
}

variable "sns_topic_arn" {
  type    = string
  default = ""
}
