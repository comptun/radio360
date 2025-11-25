resource "cloudflare_pages_project" "radio360" {
  account_id        = var.account_id
  name              = "radio360"
  production_branch = "main"

  build_config {
    build_command   = "npm ci && npm run build"
    destination_dir = "dist"
  }

  source {
    type = "github"
    config {
      owner    = "comptun"
      repo     = "radio360"
      production_branch = "main"
    }
  }
}
