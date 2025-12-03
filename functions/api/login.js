import { getUserData, userExists } from "../../shared/users";
import { createSession } from "../../shared/session";

export async function onRequestPost({ request, env }) {

    const { username, password } = await request.json();

    const userData = await getUserData(env, username, password);

    if (userData == null) {
        return new Response(
            JSON.stringify({
                success: false,
                message: "User not found",
                data: null
            }),
            { headers: { "Content-Type": "application/json" }}
        );
    }


    const session = await createSession(env, userData.user_id);

    console.log({user_id: userData.user_id});

    return new Response(
        
        JSON.stringify({
            success: true,
            message: "Logged in",
            data: userData
        }), 
        {
            headers: {
                "Content-Type": "application/json",
                "Set-Cookie": `session=${session.id}; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=604800`
            }
        }
    );
}