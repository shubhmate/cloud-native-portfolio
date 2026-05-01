# =============================================================================
# Route53 DNS Configuration — terraform/route53.tf
# =============================================================================

# Create the Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.domain_name
  tags = merge(var.tags, { Name = "${var.domain_name}-zone" })
}

# A record for the root domain (shubhammate.com)
resource "aws_route53_record" "root_a" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = module.website.cloudfront_domain_name
    zone_id                = module.website.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

# AAAA record for IPv6 support
resource "aws_route53_record" "root_aaaa" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "AAAA"

  alias {
    name                   = module.website.cloudfront_domain_name
    zone_id                = module.website.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

# CNAME record for the blog subdomain (blog.shubhammate.com) pointing to Render
resource "aws_route53_record" "blog" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "blog.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = [var.blog_render_url]
}

