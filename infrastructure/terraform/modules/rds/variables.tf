variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "postgres_version" {
  type    = string
  default = "15.3"
}

variable "instance_class" {
  type = string
}

variable "allocated_storage" {
  type = number
}

variable "max_allocated_storage" {
  type = number
}

variable "db_username" {
  type      = string
  sensitive = true
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "db_subnet_group_name" {
  type = string
}

variable "db_subnet_ids" {
  type = list(string)
}

variable "rds_security_group_id" {
  type = string
}

variable "multi_az" {
  type    = bool
  default = true
}

variable "backup_retention_days" {
  type    = number
  default = 30
}

variable "kms_key_id" {
  type = string
}

variable "enable_read_replica" {
  type    = bool
  default = true
}

variable "pqs_instance_class" {
  type = string
}

variable "pqs_allocated_storage" {
  type = number
}

variable "pqs_max_allocated_storage" {
  type = number
}

variable "timescale_instance_class" {
  type = string
}

variable "timescale_allocated_storage" {
  type = number
}

variable "timescale_max_allocated_storage" {
  type = number
}

variable "tags" {
  type = map(string)
}
