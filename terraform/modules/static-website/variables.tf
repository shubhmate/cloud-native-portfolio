# =============================================================================
# Module: Static Website — modules/static-website/variables.tf
# =============================================================================

variable "project_name" {
  type = string
}

variable "bucket_name" {
  type = string
}

variable "domain_aliases" {
  type = list(string)
}

variable "acm_certificate_arn" {
  type = string
}

variable "tags" {
  type = map(string)
}
