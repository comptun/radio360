export async function userExists(env, username) {
  const result = await env.radio360db.prepare(
    "SELECT user_id FROM users WHERE username = ?"
  ).bind(username).first();

  return !!result;
}

export async function getUserData(env, username, password) {
    const result = await env.radio360db.prepare(
        "SELECT * FROM users WHERE username = ? AND password = ?"
    ).bind(username, password).first();

    return result;
}