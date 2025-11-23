import { getSession } from "../shared/session";

export async function onRequest(context, next) {
  const cookie = context.request.headers.get("Cookie") || "";
  const match = cookie.match(/session=([^;]+)/);
  const sessionId = match?.[1];

  if (sessionId) {
    const session = await getSession(context.env, sessionId);
    if (session) {
      context.data.userId = session.user_id;
    }
  }

  return next();
}