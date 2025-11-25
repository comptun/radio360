terraform {
  required_version = ">= 1.5"

  backend "s3" {
    bucket = cloudflare_r2_bucket.radio360_r2_bucket.name
    key    = "prod/terraform.tfstate"
    region                      = "auto"
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
    use_path_style              = true
    access_key = var.r2_access_key_id
    secret_key = var.r2_secret_access_key
    endpoints = { s3 = "https://${var.account_id}.r2.cloudflarestorage.com" }
  }
}

locals {
  project_name = "radio360"
}

# Optional: store common tags or metadata here
locals {
  common_tags = {
    project = local.project_name
    managed_by = "terraform"
  }
}