import { getUserData, userExists } from "../../shared/users";
import { createSession } from "../../shared/session";

// Validates login form info to check if user exists before setting session cookie
export async function onRequestPost({ request, env }) {

    // Username and password are passed in the request
    const { username, password } = await request.json();

    // Check if user exists, returns user data if true, returns null if not
    const userData = await getUserData(env, username, password);

    // Username/Password was incorrect
    if (userData == null) {
        return new Response(
            JSON.stringify({
                success: false,
                message: "User not found",
                data: null
            }),
            { headers: { "Content-Type": "application/json" }}
        );

        console.log("User " + username + " not found");
    }

    // Create new session cookie tied to this account id
    const session = await createSession(env, userData.user_id);

    console.log("User logged in");
    console.log({user_id: userData.user_id});

    // Sets session cookie in user browser and logs them in
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