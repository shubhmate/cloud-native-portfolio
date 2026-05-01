# =============================================================================
# Terraform Variables — terraform/variables.tf
# =============================================================================

variable "aws_region" {
  description = "Primary region for resources"
  type        = string
  default     = "us-east-1" # Keeping it us-east-1 for simplicity, can be changed
}

variable "domain_name" {
  description = "The primary domain name for the portfolio"
  type        = string
  default     = "shubhammate.com"
}

variable "project_name" {
  description = "Project name for resource naming and tagging"
  type        = string
  default     = "shubhammate-portfolio"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "Portfolio"
    Owner       = "Shubham Mate"
    ManagedBy   = "Terraform"
    Environment = "Production"
  }
}
