variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "account_id" {
  type = string
}

variable "r2_access_key_id" {
  type = string
  sensitive = true
}

variable "r2_secret_access_key" {
  type = string
  sensitive = true
}