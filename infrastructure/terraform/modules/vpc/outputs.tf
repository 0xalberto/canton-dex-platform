output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of database subnets"
  value       = aws_subnet.database[*].id
}

output "database_subnet_group_name" {
  description = "Name of database subnet group"
  value       = aws_db_subnet_group.database.name
}

output "nat_gateway_ids" {
  description = "IDs of NAT gateways"
  value       = aws_nat_gateway.main[*].id
}

output "internet_gateway_id" {
  description = "ID of internet gateway"
  value       = aws_internet_gateway.main.id
}

output "vpc_endpoints" {
  description = "VPC endpoints"
  value = {
    s3_gateway_endpoint = aws_vpc_endpoint.s3.id
    ecr_api_endpoint    = aws_vpc_endpoint.ecr_api.id
    ecr_dkr_endpoint    = aws_vpc_endpoint.ecr_dkr.id
    logs_endpoint       = aws_vpc_endpoint.logs.id
  }
}

output "vpc_endpoint_security_group_id" {
  description = "Security group ID for VPC endpoints"
  value       = aws_security_group.vpc_endpoints.id
}

output "availability_zones" {
  description = "Availability zones used"
  value       = local.azs
}
