import { userExists } from "../../shared/users";
import { createSession } from "../../shared/session";

// Create new user when register form is submitted if user doesn't exist

export async function onRequestPost({ request, env }) {

    // Username and password passed through the form
    const { username, password } = await request.json();

    // Check if user exists from the username
    if (await userExists(env, username)) {
        return new Response(
            JSON.stringify({
                success: false,
                message: "Username already exists",
                data: null
            }),
            { headers: { "Content-Type": "application/json" }}
        )

        console.log("Username " + username + " already exists");
    }

    // Generate random unique id to use as user_id
    let uid = crypto.randomUUID();

    // Insert username and password into users table
    const result = await env.radio360db.prepare(
        "INSERT INTO users (user_id, username, password) VALUES (?, ?, ?)"
    ).bind(uid, username, password).run();

    // Create new session cookie to be stored in browser
    const session = await createSession(env, uid);

    console.log("Account created");
    console.log({user_id: userData.user_id});

    return new Response(
        JSON.stringify({ 
            success: true,
            message: "Account created",
            data: {
                userid: uid,
                username: username
            }
        }), 
        { 
            headers: { 
                "Content-Type": "application/json",
                "Set-Cookie": `session=${session.id}; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=604800`
            }
        }
    );
}
