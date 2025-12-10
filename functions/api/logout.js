// Logs user out by deleting session cookie
export async function onRequestPost(context) {
  // Searches for valid cookie
  const cookie = context.request.headers.get("Cookie") || "";
  const match = cookie.match(/session=([^;]+)/);
  const id = match?.[1];

  // Delete from session table if cookie exists
  if (id) {
    await context.env.radio360db
      .prepare("DELETE FROM sessions WHERE session_id = ?")
      .bind(id)
      .run();
  }

  // Deletes cookie from browser data and logs out
  return new Response(
    JSON.stringify({ 
            success: true,
            message: "Logged out",
            data: null
        }), {
    headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "session=; Path=/; HttpOnly; Max-Age=0"
    }
  });
}