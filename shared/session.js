// Creates new session cookie and inserts it into sessions table
export async function createSession(env, userId) {
  // Random unique id
  const id = crypto.randomUUID();
  // Expires in 7 days for added security
  const expires = Date.now() + 1000 * 60 * 60 * 24 * 7;

  // Insert session id and associated user id into sessions table
  await env.radio360db.prepare(
    "INSERT INTO sessions (session_id, user_id, expires_at) VALUES (?, ?, ?)"
  ).bind(id, userId, expires).run();

  // Returns newly created session token
  return { id, expires };
}

// Get session info from its id
export async function getSession(env, sessionId) {
  // Query sessions table for that session id
  const row = await env.radio360db.prepare(
    "SELECT user_id, expires_at FROM sessions WHERE session_id = ?"
  ).bind(sessionId).first();

  // Id had no associated session cookie
  if (!row) return null;
  // Session expired
  if (row.expires_at < Date.now()) return null;
  // Return valid session data
  return row;
}