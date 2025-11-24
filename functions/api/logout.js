export async function onRequestPost(context) {
  const cookie = context.request.headers.get("Cookie") || "";
  const match = cookie.match(/session=([^;]+)/);
  const id = match?.[1];

  if (id) {
    await context.env.DB
      .prepare("DELETE FROM sessions WHERE session_id = ?")
      .bind(id)
      .run();
  }

  return new Response(
    JSON.stringify({ 
            success: true,
            message: "Logged out",
            data: null
        }), {
    headers: {
      "Set-Cookie": "session=; Path=/; HttpOnly; Max-Age=0"
    }
  });
}