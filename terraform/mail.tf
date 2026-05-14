# =============================================================================
# Email Infrastructure — terraform/mail.tf
# =============================================================================
# Managing Zoho (Human Inbox) and Brevo (Application Sending Engine)
# =============================================================================

# 1. Root TXT Records (Verification & SPF)
# Keeping original resource name to prevent Route53 "Already Exists" errors
resource "aws_route53_record" "zoho_verification" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "" # Root domain
  type    = "TXT"
  ttl     = 3600
  records = [
    "zoho-verification=zb84283837.zmverify.zoho.in",
    "brevo-code:4f443ac069d083bdaee639edf35245f8",
    "v=spf1 include:zoho.in include:spf.brevo.com ~all"
  ]
}

# 2. MX Records (Inbound Mail to Zoho)
resource "aws_route53_record" "zoho_mx" {
  zone_id = aws_route53_zone.main.zone_id
  name    = ""
  type    = "MX"
  ttl     = 3600
  records = [
    "10 mx.zoho.in",
    "20 mx2.zoho.in",
    "50 mx3.zoho.in"
  ]
}

# 3. Zoho DKIM Record
resource "aws_route53_record" "zoho_dkim" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "zmail._domainkey"
  type    = "TXT"
  ttl     = 3600
  records = ["v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC36SnErNixEfxfR375uRVyANwDIOpr5G5YXf8+upf9/tOqCJDDEqdODGRfJdgytV3pBDiajTxBSzEb4WqCs+UjYfrFBdJ6huSMZ9GlYJ/50ZoMHVrovgM63FRcGkntt7IC06WfuA9aNgOJ3qcO3v6w2ro2eemr8NHaojSWPVmewQIDAQAB"]
}

# 4. Brevo DKIM Records (CNAME)
resource "aws_route53_record" "brevo_dkim_1" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "brevo1._domainkey"
  type    = "CNAME"
  ttl     = 3600
  records = ["b1.shubhammate-com.dkim.brevo.com"]
}

resource "aws_route53_record" "brevo_dkim_2" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "brevo2._domainkey"
  type    = "CNAME"
  ttl     = 3600
  records = ["b2.shubhammate-com.dkim.brevo.com"]
}

# 5. Global DMARC Policy (Security Hardening)
resource "aws_route53_record" "zoho_dmarc" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "_dmarc"
  type    = "TXT"
  ttl     = 3600
  # p=quarantine protects your domain from spoofing. 
  # rua= reporting goes to both you (via admin) and Brevo's monitoring.
  records = ["v=DMARC1; p=quarantine; rua=mailto:admin@shubhammate.com,mailto:rua@dmarc.brevo.com"]
}
