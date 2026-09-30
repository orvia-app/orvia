import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/server/api/auth";
import { getSupabaseServerClient } from "@/lib/supabase";
import { isRecord, parseTaskSchedulingPatch, UUID_PATTERN } from "@/server/api/schedule-input";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ ok: false, error: "Task not found." }, { status: 404 });
  }
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: "Request body must be valid JSON." }, { status: 400 });
  }
  const parsed = isRecord(body) ? parseTaskSchedulingPatch(body) :
    { ok: false as const, error: "Request body must be a JSON object." };
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  try {
    const { data, error } = await getSupabaseServerClient().from("tasks")
      .update(parsed.value).eq("id", id).eq("user_id", auth.userId)
      .is("deleted_at", null).select("*").maybeSingle();
    if (error) throw new Error("Task scheduling persistence failed");
    if (!data) return NextResponse.json({ ok: false, error: "Task not found." }, { status: 404 });
    return NextResponse.json({ ok: true, task: data }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to update Task schedule." }, { status: 500 });
  }
}
