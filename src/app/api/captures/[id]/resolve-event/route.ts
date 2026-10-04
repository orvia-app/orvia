import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/server/api/auth";
import { getSupabaseServerClient } from "@/lib/supabase";
import { eventToFields, parseEventInput } from "@/server/api/events";
import { UUID_PATTERN } from "@/server/api/schedule-input";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ ok: false, error: "Capture not found." }, { status: 404 });
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = parseEventInput(body, auth.userId);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  const fields = eventToFields(parsed.value);
  try {
    const { data, error } = await getSupabaseServerClient().rpc("resolve_claimed_capture_to_event", {
      p_capture_id: id,
      p_user_id: auth.userId,
      p_title: fields.title,
      p_description: fields.description,
      p_timezone: fields.timezone,
      p_busy: fields.busy,
      p_all_day: fields.all_day,
      p_start_at: fields.start_at,
      p_end_at: fields.end_at,
      p_start_date: fields.start_date,
      p_end_date_exclusive: fields.end_date_exclusive,
    });
    if (error) return NextResponse.json({ ok: false, error: "Failed to resolve capture." }, { status: 500 });
    if (data?.status === "created" && data.item) return NextResponse.json({ ok: true, event: data.item }, { status: 201 });
    if (data?.status === "existing" && data.item) return NextResponse.json({ ok: true, event: data.item }, { status: 200 });
    return NextResponse.json({ ok: false, error: "Capture is unavailable or already resolved." }, { status: 409 });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to resolve capture." }, { status: 500 });
  }
}
