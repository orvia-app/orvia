import { NextResponse } from "next/server";

import {
  getSupabaseServerClient,
  type SupabaseTaskPlanBlockRow,
} from "@/lib/supabase";
import { authenticateApiRequest } from "@/server/api/auth";
import { taskPlanBlockFromRow } from "@/server/api/task-plan-blocks";

export async function GET(request: Request) {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const { data, error } = await getSupabaseServerClient()
      .from("task_plan_blocks")
      .select("id,task_id,start_at,end_at,version,user_id")
      .eq("user_id", auth.userId)
      .order("start_at", { ascending: true });
    if (error) throw new Error("Task plan block lookup failed");
    const blocks = (data as SupabaseTaskPlanBlockRow[] | null)?.map((row) => {
      const block = taskPlanBlockFromRow(row);
      return {
        id: block.id,
        taskId: block.taskId,
        startAt: block.interval.start,
        endAt: block.interval.end,
        version: block.version,
      };
    }) ?? [];
    return NextResponse.json({ ok: true, blocks });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Task plan blocks are unavailable." },
      { status: 500 },
    );
  }
}
