import { getSession } from "../shared/session";
import * as Sentry from "@sentry/cloudflare";

async function authentication(context) {
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

async function sentry(context) {
  Sentry.sentryPagesPlugin((context) => ({
    dsn: "https://3ccfbeecf594a0e536c62609fcaa70bd@o4510460009709573.ingest.us.sentry.io/4510460016852992",

    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
  }))
}

export const onRequest = [sentry, authentication];