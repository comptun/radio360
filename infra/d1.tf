resource "cloudflare_d1_database" "radio360db" {
  account_id = var.account_id
  name = "radio360"
  jurisdiction = "eu"
  primary_location_hint = "wnam"
}