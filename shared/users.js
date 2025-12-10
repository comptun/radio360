// Checks if username exists already in table.
export async function userExists(env, username) {
  // Query for rows with username
  const result = await env.radio360db.prepare(
    "SELECT user_id FROM users WHERE username = ?"
  ).bind(username).first();
  // At least one row was found
  return !!result;
}

// Get user data row from matching username and password
export async function getUserData(env, username, password) {
  // Returns first row found to match the username and password, there should only be one
  const result = await env.radio360db.prepare(
      "SELECT * FROM users WHERE username = ? AND password = ?"
  ).bind(username, password).first();
  // Return row if found, null if not
  return result;
}