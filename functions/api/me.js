export async function onRequestGet(context) {
  const userId = context.data.userId;

  if (!userId) {
    return new Response("Not logged in", { status: 401 });
  }

  const user = await context.env.radio360db.prepare(
    "SELECT user_id, username FROM users WHERE user_id = ?"
  ).bind(userId).first();

  return new Response(JSON.stringify(user), {
    headers: { "Content-Type": "application/json" }
  });
}