resource "cloudflare_pages_project" "radio360" {
  account_id        = var.account_id
  name              = "radio360"
  production_branch = "main"

  build_config = {
    build_command   = "npm ci && npm run build"
    destination_dir = "dist"
  }

  deployment_configs = {
    production = {
      d1_databases = {
        D1_BINDING = {
          id = cloudflare_d1_database.radio360.id
        }
      }
    }
  }

  source = {
    type = "github"
    config = {
      deployments_enabled = true
      owner    = "comptun"
      production_branch = "main"
      production_deployments_enabled = true
      repo_name     = "radio360"
    }
  }
}
