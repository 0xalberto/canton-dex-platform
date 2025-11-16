# IAM Module

# EKS Service Account Role
resource "aws_iam_role" "eks_service_account" {
  name = "${var.environment}-eks-service-account-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "${var.environment}-eks-service-account-role"
  }
}

# ECR Access Policy for EKS
resource "aws_iam_policy" "ecr_access" {
  name        = "${var.environment}-ecr-access"
  description = "Policy for EKS nodes to access ECR"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:GetAuthorizationToken"
      ]
      Effect   = "Allow"
      Resource = "*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecr_access" {
  role       = aws_iam_role.eks_service_account.name
  policy_arn = aws_iam_policy.ecr_access.arn
}

# CloudWatch Logs Policy
resource "aws_iam_policy" "cloudwatch_logs" {
  name        = "${var.environment}-cloudwatch-logs"
  description = "Policy for CloudWatch Logs access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Effect   = "Allow"
      Resource = "arn:aws:logs:*:*:*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "cloudwatch_logs" {
  role       = aws_iam_role.eks_service_account.name
  policy_arn = aws_iam_policy.cloudwatch_logs.arn
}

# S3 Access Policy (for backups)
resource "aws_iam_policy" "s3_access" {
  name        = "${var.environment}-s3-access"
  description = "Policy for S3 backup access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ]
      Effect   = "Allow"
      Resource = "arn:aws:s3:::cantondex-*/*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "s3_access" {
  role       = aws_iam_role.eks_service_account.name
  policy_arn = aws_iam_policy.s3_access.arn
}

output "eks_role_arn" {
  value = aws_iam_role.eks_service_account.arn
}
