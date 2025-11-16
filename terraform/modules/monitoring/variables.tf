variable "environment" {
  type = string
}

variable "cluster_name" {
  type = string
}

variable "region" {
  type = string
}

variable "alert_email" {
  type    = string
  default = "devops@cantondex.com"
}
