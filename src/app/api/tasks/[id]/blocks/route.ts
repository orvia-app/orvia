import { NextResponse } from "next/server";

import {
  getSupabaseServerClient,
  type SupabaseTaskPlanBlockRow,
} from "@/lib/supabase";
import { authenticateApiRequest } from "@/server/api/auth";
import { UUID_PATTERN } from "@/server/api/schedule-input";
import {
  parseTaskPlanBlockCreate,
  taskPlanBlockFromRow,
} from "@/server/api/task-plan-blocks";

type Context = { params: Promise<{ id: string }> };

const missing = () => NextResponse.json(
  { ok: false, error: "Task not found." },
  { status: 404 },
);
const failure = () => NextResponse.json(
  { ok: false, error: "Task plan block persistence failed." },
  { status: 500 },
);
const duplicate = () => NextResponse.json(
  { ok: false, error: "An identical Task plan block already exists." },
  { status: 409 },
);

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

export async function GET(request: Request, context: Context) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;
  const { id: taskId } = await context.params;
  if (!UUID_PATTERN.test(taskId)) return missing();

  try {
    if (!await ownedActiveTask(taskId, auth.userId)) return missing();
    const { data, error } = await getSupabaseServerClient()
      .from("task_plan_blocks")
      .select("*")
      .eq("task_id", taskId)
      .eq("user_id", auth.userId)
      .order("start_at", { ascending: true });
    if (error) return failure();
    return NextResponse.json({
      ok: true,
      blocks: (data as SupabaseTaskPlanBlockRow[] | null)?.map(taskPlanBlockFromRow) ?? [],
    });
  } catch {
    return failure();
  }
}

export async function POST(request: Request, context: Context) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;
  const { id: taskId } = await context.params;
  if (!UUID_PATTERN.test(taskId)) return missing();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
  const parsed = parseTaskPlanBlockCreate(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  try {
    if (!await ownedActiveTask(taskId, auth.userId)) return missing();
    const { data, error } = await getSupabaseServerClient()
      .from("task_plan_blocks")
      .insert({
        id: crypto.randomUUID(),
        user_id: auth.userId,
        task_id: taskId,
        start_at: parsed.startAt,
        end_at: parsed.endAt,
      })
      .select("*")
      .single<SupabaseTaskPlanBlockRow>();
    if (error && error.code === "23505") return duplicate();
    if (error || !data) return failure();
    return NextResponse.json(
      { ok: true, block: taskPlanBlockFromRow(data) },
      { status: 201 },
    );
  } catch {
    return failure();
  }
}
