import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/server/api/auth";
import { getSupabaseServerClient } from "@/lib/supabase";
import { eventToFields, parseEventInput } from "@/server/api/events";

export async function POST(request: Request) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = parseEventInput(body, auth.userId);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  try {
    const { data, error } = await getSupabaseServerClient().from("orvia_events")
      .insert({ id: parsed.value.id, user_id: auth.userId,
        ...eventToFields(parsed.value), lifecycle_status: "active" })
      .select("*").single();
    if (error || !data) throw new Error("Event persistence failed");
    return NextResponse.json({ ok: true, event: data }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to create Event." }, { status: 500 });
  }
}
