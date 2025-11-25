resource "cloudflare_r2_bucket" "radio360_r2_bucket" {
  account_id = var.account_id
  name = "radio360_bucket"
  location = "apac"
  storage_class = "Standard"
}