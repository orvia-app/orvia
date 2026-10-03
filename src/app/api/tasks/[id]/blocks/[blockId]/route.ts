import { NextResponse } from "next/server";

import {
  getSupabaseServerClient,
  type SupabaseTaskPlanBlockRow,
} from "@/lib/supabase";
import { authenticateApiRequest } from "@/server/api/auth";
import { UUID_PATTERN } from "@/server/api/schedule-input";
import {
  parseTaskPlanBlockPatch,
  taskPlanBlockFromRow,
} from "@/server/api/task-plan-blocks";

type Context = { params: Promise<{ id: string; blockId: string }> };

const missing = () => NextResponse.json(
  { ok: false, error: "Task plan block not found." },
  { status: 404 },
);
const failure = () => NextResponse.json(
  { ok: false, error: "Task plan block persistence failed." },
  { status: 500 },
);

async function ownedBlock(
  taskId: string,
  blockId: string,
  ownerId: string,
): Promise<SupabaseTaskPlanBlockRow | null> {
  const { data, error } = await getSupabaseServerClient()
    .from("task_plan_blocks")
    .select("*")
    .eq("id", blockId)
    .eq("task_id", taskId)
    .eq("user_id", ownerId)
    .maybeSingle<SupabaseTaskPlanBlockRow>();
  if (error) throw new Error("Task plan block lookup failed");
  return data;
}

async function ownedActiveTask(taskId: string, ownerId: string): Promise<boolean> {
  const { data, error } = await getSupabaseServerClient()
    .from("tasks")
    .select("id")
    .eq("id", taskId)
    .eq("user_id", ownerId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error("Task lookup failed");
  return data !== null;
}

async function ids(context: Context) {
  const values = await context.params;
  return UUID_PATTERN.test(values.id) && UUID_PATTERN.test(values.blockId) ? values : null;
}

export async function PATCH(request: Request, context: Context) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;
  const identifiers = await ids(context);
  if (!identifiers) return missing();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  try {
    if (!await ownedActiveTask(identifiers.id, auth.userId)) return missing();
    const current = await ownedBlock(identifiers.id, identifiers.blockId, auth.userId);
    if (!current) return missing();
    const parsed = parseTaskPlanBlockPatch(body, current);
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }
    if (parsed.expectedVersion !== current.version) {
      return NextResponse.json(
        { ok: false, error: "Task plan block changed. Reload and try again." },
        { status: 409 },
      );
    }
    const { data, error } = await getSupabaseServerClient()
      .from("task_plan_blocks")
      .update({
        start_at: parsed.startAt,
        end_at: parsed.endAt,
        version: current.version + 1,
      })
      .eq("id", identifiers.blockId)
      .eq("task_id", identifiers.id)
      .eq("user_id", auth.userId)
      .eq("version", current.version)
      .select("*")
      .maybeSingle<SupabaseTaskPlanBlockRow>();
    if (error && error.code === "23505") {
      return NextResponse.json(
        { ok: false, error: "An identical Task plan block already exists." },
        { status: 409 },
      );
    }
    if (error) return failure();
    if (!data) {
      return NextResponse.json(
        { ok: false, error: "Task plan block changed. Reload and try again." },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true, block: taskPlanBlockFromRow(data) });
  } catch {
    return failure();
  }
}

export async function DELETE(request: Request, context: Context) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;
  const identifiers = await ids(context);
  if (!identifiers) return missing();

  try {
    if (!await ownedActiveTask(identifiers.id, auth.userId)) return missing();
    const current = await ownedBlock(identifiers.id, identifiers.blockId, auth.userId);
    if (!current) return missing();
    const { data, error } = await getSupabaseServerClient()
      .from("task_plan_blocks")
      .delete()
      .eq("id", identifiers.blockId)
      .eq("task_id", identifiers.id)
      .eq("user_id", auth.userId)
      .eq("version", current.version)
      .select("id")
      .maybeSingle();
    if (error) return failure();
    if (!data) {
      return NextResponse.json(
        { ok: false, error: "Task plan block changed. Reload and try again." },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return failure();
  }
}
