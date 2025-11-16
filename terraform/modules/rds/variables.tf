variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "database_name" {
  type = string
}

variable "database_user" {
  type      = string
  sensitive = true
}

variable "database_password" {
  type      = string
  sensitive = true
}

variable "allocated_storage" {
  type = number
}

variable "instance_class" {
  type = string
}

variable "multi_az" {
  type    = bool
  default = true
}
