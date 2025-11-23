import { userExists } from "../../shared/users";

export async function onRequestPost({ request, env }) {

    const { username, password } = await request.json();

    if (await userExists(env, username)) {
        return new Response(
            JSON.stringify({
                success: false,
                message: "Username already exists"
            }),
            { headers: { "Content-Type": "application/json" }}
        )
    }


    // Insert into D1
    await env.radio360db.prepare(
        "INSERT INTO users (user_id, username, password) VALUES (?, ?, ?)"
    ).bind(crypto.randomUUID(), username, password).run();

    return new Response(
        JSON.stringify({ 
            success: true,
            message: "Account created"
        }), 
        { headers: { "Content-Type": "application/json" }}
    );
}
