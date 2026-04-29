# =============================================================================
# Module: Static Website — modules/static-website/outputs.tf
# =============================================================================

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.s3_distribution.domain_name
}

output "cloudfront_hosted_zone_id" {
  value = aws_cloudfront_distribution.s3_distribution.hosted_zone_id
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.s3_distribution.id
}

output "s3_bucket_name" {
  value = aws_s3_bucket.portfolio.bucket
}
