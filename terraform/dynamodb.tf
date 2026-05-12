/* =========================================================================
   DYNAMODB LEADS REGISTRY (CLOUD CORE)
   =========================================================================
   This file provisions the high-availability NoSQL table required to 
   persistently store contact form submissions as an "Elite" technical registry.
   ========================================================================= */

resource "aws_dynamodb_table" "portfolio_leads" {
  name         = "portfolio-leads"
  billing_mode = "PAY_PER_REQUEST" # Serverless on-demand scaling
  hash_key     = "lead_id"         # Unique Partition Key

  attribute {
    name = "lead_id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  # Global Secondary Index for efficient querying by email
  global_secondary_index {
    name            = "EmailIndex"
    projection_type = "ALL"

    key_schema {
      attribute_name = "email"
      key_type       = "HASH"
    }
  }

  # TTL (Time to Live) - Optional: Automatically delete old leads after 1 year
  # ttl {
  #   attribute_name = "expires_at"
  #   enabled        = true
  # }

  tags = merge(var.tags, {
    Name = "portfolio-leads-table"
  })
}
