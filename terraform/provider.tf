# =============================================================================
# Terraform Provider Configuration — terraform/provider.tf
# =============================================================================

terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary provider for most resources (S3, CloudFront, Route53)
provider "aws" {
  region = var.aws_region
}

# Secondary provider for ACM Certificate (CloudFront requires us-east-1)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}
