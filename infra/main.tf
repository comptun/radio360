terraform {
  required_version = ">= 1.5"

  backend "s3" {
    bucket = "radio360_bucket"
    key    = "prod/terraform.tfstate"
    region                      = "auto"
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
    use_path_style              = true
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