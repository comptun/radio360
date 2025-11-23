export async function onRequestPost(context) {
    const { request, env } = context;

    // Get JSON from body
    const data = await request.json();
    const { username, password } = data;

    // Insert into D1
    await env.DB.prepare(
        "INSERT INTO users (username, password) VALUES (?, ?)"
    ).bind(username, password).run();

    return new Response(
        JSON.stringify({ success: true }), 
        { headers: { "Content-Type": "application/json" }}
    );
}
