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
      env_vars = {
        login_turnstile_secret = {
          type = "secret_text"
          value = cloudflare_turnstile_widget.login_radio360_turnstile_widget.secret
        }
        register_turnstile_secret = {
          type = "secret_text"
          value = cloudflare_turnstile_widget.register_radio360_turnstile_widget.secret
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
      env_vars = {
        login_turnstile_secret = {
          type = "secret_text"
          value = cloudflare_turnstile_widget.login_radio360_turnstile_widget.secret
        }
        register_turnstile_secret = {
          type = "secret_text"
          value = cloudflare_turnstile_widget.register_radio360_turnstile_widget.secret
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
      path_excludes = ["string"]
      path_includes = ["string"]
      pr_comments_enabled = true
      preview_branch_excludes = ["string"]
      preview_branch_includes = ["string"]
      preview_deployment_setting = "all"
      production_branch = "main"
      production_deployments_enabled = true
      repo_name     = "radio360"
    }
  }
}
