export async function onRequestGet({ env }) {
  const { results } = await env.radio360db.prepare("SELECT * FROM users").all();
  return Response.json(results);
}

export async function onRequestPost({ request, env }) {
  const body = await request.json();
  await env.radio360db.prepare("INSERT INTO users (name) VALUES (?)")
    .bind(body.name)
    .run();
  return new Response("OK", { status: 201 });
}
