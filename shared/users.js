export async function userExists(env, username) {
  const result = await env.radio360db.prepare(
    "SELECT user_id FROM users WHERE username = ?"
  ).bind(username).first();

  return !!result;
}