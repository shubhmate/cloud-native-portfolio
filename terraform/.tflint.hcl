# =============================================================================
# TFLint Configuration — terraform/.tflint.hcl
# =============================================================================

config {
  call_module_type = "all"
  force  = false
}

plugin "aws" {
  enabled = true
  version = "0.32.0"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}

# Add custom rules if needed
rule "aws_resource_missing_tags" {
  enabled = true
  tags    = ["Name", "Environment", "Project"]
}
