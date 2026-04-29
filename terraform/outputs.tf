# =============================================================================
# Terraform Outputs — terraform/outputs.tf
# =============================================================================

output "route53_nameservers" {
  description = "The Name Servers for your Route53 Hosted Zone. Add these to your domain registrar."
  value       = aws_route53_zone.main.name_servers
}

output "cloudfront_domain_name" {
  description = "The CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.s3_distribution.domain_name
}

output "s3_bucket_name" {
  description = "The S3 bucket name"
  value       = aws_s3_bucket.portfolio.bucket
}

output "cloudfront_distribution_id" {
  description = "The CloudFront Distribution ID (used for invalidations)"
  value       = aws_cloudfront_distribution.s3_distribution.id
}

output "website_url" {
  description = "The final website URL"
  value       = "https://${var.domain_name}"
}
