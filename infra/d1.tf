resource "cloudflare_d1_database" "radio360" {
  account_id = var.account_id
  name = "radio360db"
  jurisdiction = "eu"
  primary_location_hint = "wnam"
}