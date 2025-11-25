# Bind the D1 database into the Pages project as `DB`
resource "cloudflare_pages_project_d1_binding" "radio360_db_binding" {
  account_id     = var.account_id
  project_name   = cloudflare_pages_project.radio360.name
  name           = "radio360db"
  d1_database_id = cloudflare_d1_database.radio360db.id
}

# Example environment variable (production)
resource "cloudflare_pages_project_env_var" "radio360_api_base" {
  account_id   = var.account_id
  project_name = cloudflare_pages_project.radio360.name

  name        = "API_BASE_URL"
  value       = "https://radio360-bjp.pages.dev"
  environment = "production"
}
