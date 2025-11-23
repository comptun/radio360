export default {
  async fetch(request, env ) {
    if (request.method == "POST") {
      const { username, password } = await request.json();

      // Insert into D1
      const stmt = env.DB.prepare(
          "INSERT INTO users (username, password) VALUES (?, ?)"
      ).bind(username, password);

      await stmt.run();

      return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" }
      });
    }
    else {
      const { results } = await env.radio360db.prepare("SELECT * FROM users").all();
      return Response.json(results);
    }
  }
}