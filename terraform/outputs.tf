# =============================================================================
# Terraform Outputs — terraform/outputs.tf
# =============================================================================

output "route53_nameservers" {
  description = "The Name Servers for your Route53 Hosted Zone. Add these to your domain registrar."
  value       = aws_route53_zone.main.name_servers
}

output "cloudfront_domain_name" {
  description = "The CloudFront distribution domain name"
  value       = module.website.cloudfront_domain_name
}

output "s3_bucket_name" {
  description = "The S3 bucket name"
  value       = module.website.s3_bucket_name
}

output "cloudfront_distribution_id" {
  description = "The CloudFront Distribution ID (used for invalidations)"
  value       = module.website.cloudfront_distribution_id
}

output "website_url" {
  description = "The final website URL"
  value       = "https://${var.domain_name}"
}

output "contact_api_url" {
  description = "The branded contact form API URL"
  value       = "https://api.shubhammate.com/contact"
}
