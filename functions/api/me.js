// Returns user data when page is loaded when logged in
export async function onRequestGet(context) {
  const userId = context.data.userId;

  // User is logged out
  if (!userId) {
    return new Response(JSON.stringify({
        success: false,
        message: "Not logged in",
        data: null
    }), {
    headers: { "Content-Type": "application/json" }
  });
  }

  // Get user data from db
  const user = await context.env.radio360db.prepare(
    "SELECT user_id, username FROM users WHERE user_id = ?"
  ).bind(userId).first();
  
  // Return user data in response
  return new Response(JSON.stringify({
        success: true,
        message: "Success",
        data: user
    }), {
    headers: { "Content-Type": "application/json" }
  });
}