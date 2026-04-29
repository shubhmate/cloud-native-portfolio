# =============================================================================
# Root Configuration — terraform/main.tf
# =============================================================================
# This is the "Entry Point" of your infrastructure.
# It calls the modules and handles domain-specific logic.
# =============================================================================

# 1. Call the Static Website Module
module "website" {
  source = "./modules/static-website"

  project_name        = var.project_name
  bucket_name         = var.project_name # Using project name as bucket name
  domain_aliases      = [var.domain_name, "www.${var.domain_name}"]
  acm_certificate_arn = aws_acm_certificate_validation.cert.certificate_arn
  tags                = var.tags
}
