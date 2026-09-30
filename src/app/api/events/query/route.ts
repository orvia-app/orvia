import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/server/api/auth";
import { parseRange, isRecord } from "@/server/api/schedule-input";
import { fetchOwnedEvents } from "@/server/api/schedule-source";

/** POST body keeps exact schedule times out of browser URLs. */
export async function POST(request: Request) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: "Request body must be valid JSON." }, { status: 400 });
  }
  const range = parseRange(isRecord(body) ? body.range : undefined);
  if (!range.ok) return NextResponse.json({ ok: false, error: range.error }, { status: 400 });
  try {
    const events = await fetchOwnedEvents(auth.userId, range.value);
    if (!events) throw new Error("Event source unavailable");
    return NextResponse.json({ ok: true, events }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to list Events." }, { status: 500 });
  }
}
