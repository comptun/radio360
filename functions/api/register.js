import { userExists } from "../../shared/users";
import { createSession } from "../../shared/session";

export async function onRequestPost({ request, env }) {

    const { username, password } = await request.json();

    if (await userExists(env, username)) {
        return new Response(
            JSON.stringify({
                success: false,
                message: "Username already exists",
                data: null
            }),
            { headers: { "Content-Type": "application/json" }}
        )
    }

    let uid = crypto.randomUUID();
    // Insert into D1
    const result = await env.radio360db.prepare(
        "INSERT INTO users (user_id, username, password) VALUES (?, ?, ?)"
    ).bind(uid, username, password).run();

    const session = await createSession(env, uid);

    return new Response(
        JSON.stringify({ 
            success: true,
            message: "Account created",
            data: result
        }), 
        { 
            headers: { 
                "Content-Type": "application/json",
                "Set-Cookie": `session=${session.id}; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=604800`
            }
        }
    );
}
