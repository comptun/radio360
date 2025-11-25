resource "cloudflare_d1_database" "radio360db" {
  account_id = var.account_id
  name       = "radio360"
}
