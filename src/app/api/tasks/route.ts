import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

const TASK_TITLE_MAX_LENGTH = 240;

type CreateTaskBody = {
  title?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTaskTitle(body: CreateTaskBody): string | null {
  if (typeof body.title !== "string") {
    return null;
  }

  const title = body.title.trim();

  if (title.length === 0 || title.length > TASK_TITLE_MAX_LENGTH) {
    return null;
  }

  return title;
}

export async function GET() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch tasks from Supabase.", error.message);

    return NextResponse.json(
      { ok: false, error: "Failed to fetch tasks." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, tasks: data ?? [] }, { status: 200 });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      { ok: false, error: "Request body must be a JSON object." },
      { status: 400 },
    );
  }

  const title = parseTaskTitle(body);

  if (!title) {
    return NextResponse.json(
      {
        ok: false,
        error: `Title is required and must be ${TASK_TITLE_MAX_LENGTH} characters or fewer.`,
      },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({ title })
    .select("*")
    .single();

  if (error) {
    console.error("Failed to create task in Supabase.", error.message);

    return NextResponse.json(
      { ok: false, error: "Failed to create task." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, task: data }, { status: 201 });
}
