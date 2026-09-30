import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/server/api/auth";
import { getSupabaseServerClient, type SupabaseEventRow } from "@/lib/supabase";
import { eventToFields, parseEventInput, rowToEvent } from "@/server/api/events";
import { UUID_PATTERN } from "@/server/api/schedule-input";

type Context = { params: Promise<{ id: string }> };
const missing = () => NextResponse.json({ ok: false, error: "Event not found." }, { status: 404 });
const failure = () => NextResponse.json({ ok: false, error: "Event persistence failed." }, { status: 500 });

async function ownedActive(id: string, ownerId: string): Promise<SupabaseEventRow | null> {
  const { data, error } = await getSupabaseServerClient().from("orvia_events")
    .select("*").eq("id", id).eq("user_id", ownerId)
    .eq("lifecycle_status", "active").maybeSingle();
  if (error) throw new Error("Event lookup failed");
  return data;
}

export async function GET(request: Request, context: Context) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) return missing();
  try {
    const event = await ownedActive(id, auth.userId);
    return event ? NextResponse.json({ ok: true, event }) : missing();
  } catch { return failure(); }
}

export async function PATCH(request: Request, context: Context) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) return missing();
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: "Request body must be valid JSON." }, { status: 400 });
  }
  try {
    const current = await ownedActive(id, auth.userId);
    if (!current) return missing();
    const parsed = parseEventInput(body, auth.userId, rowToEvent(current));
    if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    const { data, error } = await getSupabaseServerClient().from("orvia_events")
      .update(eventToFields(parsed.value)).eq("id", id).eq("user_id", auth.userId)
      .eq("lifecycle_status", "active").select("*").maybeSingle();
    if (error) return failure();
    return data ? NextResponse.json({ ok: true, event: data }) : missing();
  } catch { return failure(); }
}

async function transition(request: Request, context: Context, status: "archived" | "deleted") {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) return missing();
  try {
    const { data, error } = await getSupabaseServerClient().from("orvia_events")
      .update({ lifecycle_status: status }).eq("id", id).eq("user_id", auth.userId)
      .eq("lifecycle_status", "active").select("id").maybeSingle();
    if (error) return failure();
    return data ? NextResponse.json({ ok: true, lifecycleStatus: status }) : missing();
  } catch { return failure(); }
}

export const POST = (request: Request, context: Context) => transition(request, context, "archived");
/** DELETE is a lifecycle transition; retention and hard purge remain undecided. */
export const DELETE = (request: Request, context: Context) => transition(request, context, "deleted");
