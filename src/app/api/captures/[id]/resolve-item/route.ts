import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/server/api/auth";
import { getSupabaseServerClient } from "@/lib/supabase";
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
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).length !== 1 || !("target" in body) ||
      (body.target !== "task" && body.target !== "note")) {
    return NextResponse.json({ ok: false, error: "Target must be task or note." }, { status: 400 });
  }
  const target = body.target;
  const supabase = getSupabaseServerClient();
  try {
    const { data, error } = await supabase.rpc("resolve_claimed_capture_to_item", {
      p_capture_id: id, p_user_id: auth.userId, p_target: target,
    });
    if (error) return NextResponse.json({ ok: false, error: "Failed to resolve capture." }, { status: 500 });
    if (data?.status === "created" && data.item) return NextResponse.json({ ok: true, [target]: data.item }, { status: 201 });
    if (data?.status === "existing" && data.item) return NextResponse.json({ ok: true, [target]: data.item }, { status: 200 });
    return NextResponse.json({ ok: false, error: "Capture is unavailable or already resolved." }, { status: 409 });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to resolve capture." }, { status: 500 });
  }
}
