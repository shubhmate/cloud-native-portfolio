# =============================================================================
# Terraform Backend Configuration — terraform/backend.tf
# =============================================================================
# INSTRUCTIONS:
# 1. Run 'terraform apply' first to create the S3 bucket and DynamoDB table.
# 2. Once created, UNCOMMENT the block below.
# 3. Run 'terraform init' again to migrate your local state to the cloud.
# =============================================================================


terraform {
  backend "s3" {
    bucket         = "shubhammate-portfolio-terraform-state"
    key            = "global/s3/terraform.tfstate"
    region         = "us-east-1"
    # dynamodb_table = "shubhammate-portfolio-terraform-locks" # DEPRECATED: Replaced by use_lockfile in v1.10+
    use_lockfile   = true
    encrypt        = true
  }
}

