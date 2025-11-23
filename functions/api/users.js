export async function onRequestGet({ env }) {
  const { results } = await env.radio360db.prepare("SELECT * FROM users").all();
  return Response.json(results);
}
