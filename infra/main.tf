terraform {
  required_version = ">= 1.5"

  backend "local" {
    path = "terraform.tfstate"
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

# Nothing else is needed — resources live in
# pages.tf, worker.tf, d1.tf, env.tf, etc.
