import { NextResponse } from "next/server";
import { parseBrowserAnalyticsEvent } from "@/lib/analytics-contract";
import { getSupabaseServerClient } from "@/lib/supabase";
import { authenticateApiRequest } from "@/server/api/auth";
import { readAnalyticsBody } from "@/server/api/analytics-body";
function reply(status: number) {
  return NextResponse.json({ ok: status === 202 }, { status, headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  // First-party browser endpoint, no CORS. No IPs or headers are persisted.
  if (request.headers.get("origin") !== new URL(request.url).origin || request.headers.get("sec-fetch-site") === "cross-site")
    return reply(403);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json")
    return reply(415);
  let body: unknown;
  try {
    body = await readAnalyticsBody(request);
  }
  catch {
    return reply(400);
  }
  const event = parseBrowserAnalyticsEvent(body);
  if (!event)
    return reply(400);
  try {
    let userId: string | null = null;
    if (request.headers.has("authorization")) {
      const auth = await authenticateApiRequest(request);
      if (!auth.ok)
        return reply(401);
      userId = auth.userId;
      if (event.event_name === "email_confirmed" && !auth.emailConfirmedAt)
        return reply(400);
    }
    if ((event.event_name === "email_confirmed" || event.event_name === "login_completed") && !userId)
      return reply(401);
    const { data, error } = await getSupabaseServerClient().rpc("ingest_beta_analytics", {
      p_id: event.id, p_event_name: event.event_name, p_anonymous_id: event.anonymous_id,
      p_session_id: event.session_id, p_locale: event.locale, p_user_id: userId,
    });
    if (error) {
      console.warn("Analytics ingestion unavailable.");
      return reply(503);
    }
    return reply(data === false ? 429 : 202);
  }
  catch {
    // Never log request bodies, tokens or raw provider errors.
    console.warn("Analytics ingestion unavailable.");
    return reply(503);
  }
}
