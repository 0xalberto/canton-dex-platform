variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "kafka_version" {
  type    = string
  default = "3.5.1"
}

variable "number_of_brokers" {
  type    = number
  default = 3
}

variable "broker_instance_type" {
  type = string
}

variable "ebs_volume_size" {
  type    = number
  default = 1000
}

variable "subnet_ids" {
  type = list(string)
}

variable "security_group_id" {
  type = string
}

variable "kms_key_arn" {
  type = string
}

variable "enable_scram_auth" {
  type    = bool
  default = true
}

variable "kafka_username" {
  type      = string
  sensitive = true
}

variable "kafka_password" {
  type      = string
  sensitive = true
}

variable "tags" {
  type = map(string)
}
