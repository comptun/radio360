#
# D1 Database Output
#
output "d1_database_id" {
  description = "ID of the D1 database"
  value       = cloudflare_d1_database.db.id
}

output "d1_database_uuid" {
  description = "UUID of the D1 database (used for bindings)"
  value       = cloudflare_d1_database.db.uuid
}

#
# Cloudflare Pages Project Output
#
output "pages_project_name" {
  description = "The name of the Cloudflare Pages project"
  value       = cloudflare_pages_project.radio360.name
}

output "pages_preview_url" {
  description = "The Cloudflare Pages preview URL"
  value       = cloudflare_pages_project.radio360.subdomain
}

#
# Worker Output (if using worker.tf)
#
output "worker_name" {
  description = "Name of the deployed Worker"
  value       = try(cloudflare_worker_script.api_worker.name, "")
}

#
# Useful Info
#
output "dashboard_url" {
  description = "Quick link to the Cloudflare dashboard for this project"
  value       = "https://dash.cloudflare.com/?to=/:account/pages/view/${cloudflare_pages_project.radio360.name}"
}
