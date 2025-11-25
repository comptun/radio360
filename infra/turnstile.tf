resource "cloudflare_turnstile_widget" "login_radio360_turnstile_widget" {
  account_id = var.account_id
  domains = ["radio360-bjp.pages.dev"]
  mode = "managed"
  name = "login-radio360-turnstile"
  bot_fight_mode = false
  clearance_level = "interactive"
  ephemeral_id = false
  offlabel = false
  region = "world"
}


resource "cloudflare_turnstile_widget" "register_radio360_turnstile_widget" {
  account_id = var.account_id
  domains = ["radio360-bjp.pages.dev"]
  mode = "managed"
  name = "register-radio360-turnstile"
  bot_fight_mode = false
  clearance_level = "interactive"
  ephemeral_id = false
  offlabel = false
  region = "world"
}