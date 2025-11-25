resource "cloudflare_d1_database" "radio360db" {
  account_id = var.account_id
  name = "radio360-d1-db"
  jurisdiction = "eu"
  primary_location_hint = "wnam"
  read_replication = {
    mode = "disabled"
  }
}