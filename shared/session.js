export async function createSession(env, userId) {
  const id = crypto.randomUUID();     // session token
  const expires = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days

  await env.radio360db.prepare(
    "INSERT INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)"
  ).bind(id, userId, expires).run();

  return { id, expires };
}

export async function getSession(env, sessionId) {
  const row = await env.radio360db.prepare(
    "SELECT user_id, expires_at FROM sessions WHERE user_id = ?"
  ).bind(sessionId).first();

  if (!row) return null;
  if (row.expires_at < Date.now()) return null;

  return row;
}