import { getSession } from "../shared/session";

// Sets context user_id from the session cookie on page load
export async function onRequest(context) {
  const cookie = context.request.headers.get("Cookie") || "";
  const match = cookie.match(/session=([^;]+)/);
  const sessionId = match?.[1];

  if (sessionId) {
    const session = await getSession(context.env, sessionId);
    if (session) {
      context.data.userId = session.user_id;
    }
  }

  return context.next();
}