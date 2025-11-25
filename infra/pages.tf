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
        radio360db = {
          id = cloudflare_d1_database.radio360db.id
        }
      }
      fail_open = true
    }
    preview = {
      d1_databases = {
        radio360db = {
          id = cloudflare_d1_database.radio360db.id
        }
      }
      fail_open = true
    }
  }

  source = {
    type = "github"
    config = {
      deployments_enabled = true
      owner    = "comptun"
      
      production_deployments_enabled = true
      repo_name     = "radio360"
    }
  }
}
