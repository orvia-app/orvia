import { NextResponse } from "next/server";
import {
  getSupabaseServerClient,
  type SupabaseTaskInsert,
  type SupabaseTaskRow,
} from "@/lib/supabase";

const TASK_TITLE_MAX_LENGTH = 240;
const TASK_DESCRIPTION_MAX_LENGTH = 5000;
const TASK_STATUSES = ["todo", "in-progress", "done"] as const;
const TASK_PRIORITIES = ["low", "medium", "high", "critical"] as const;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type TaskStatus = (typeof TASK_STATUSES)[number];
type TaskPriority = (typeof TASK_PRIORITIES)[number];

type CreateTaskBody = {
  title?: unknown;
  description?: unknown;
  status?: unknown;
  priority?: unknown;
  workspaceId?: unknown;
  dueDate?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type ParsedTaskPayload =
  | { ok: true; payload: SupabaseTaskInsert }
  | { ok: false; error: string };

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

function parseTaskDescription(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const description = value.trim();

  if (description.length === 0) {
    return null;
  }

  if (description.length > TASK_DESCRIPTION_MAX_LENGTH) {
    return undefined;
  }

  return description;
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === "string" &&
    TASK_STATUSES.includes(value as TaskStatus)
  );
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return (
    typeof value === "string" &&
    TASK_PRIORITIES.includes(value as TaskPriority)
  );
}

function parseWorkspaceId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const workspaceId = value.trim();

  return UUID_PATTERN.test(workspaceId) ? workspaceId : null;
}

function parseDueDate(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const dueDate = value.trim();
  const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(dueDate);

  if (dateOnlyMatch) {
    return dueDate;
  }

  const timestamp = Date.parse(dueDate);

  if (Number.isNaN(timestamp)) {
    return undefined;
  }

  return new Date(timestamp).toISOString().slice(0, 10);
}

function parseCreateTaskPayload(body: CreateTaskBody): ParsedTaskPayload {
  const title = parseTaskTitle(body);

  if (!title) {
    return {
      ok: false,
      error: `Title is required and must be ${TASK_TITLE_MAX_LENGTH} characters or fewer.`,
    };
  }

  const description = parseTaskDescription(body.description);

  if (description === undefined && body.description !== undefined) {
    return {
      ok: false,
      error: `Description must be a string, null, or ${TASK_DESCRIPTION_MAX_LENGTH} characters or fewer.`,
    };
  }

  if (body.status !== undefined && !isTaskStatus(body.status)) {
    return {
      ok: false,
      error: "Status must be one of: todo, in-progress, done.",
    };
  }

  if (body.priority !== undefined && !isTaskPriority(body.priority)) {
    return {
      ok: false,
      error: "Priority must be one of: low, medium, high, critical.",
    };
  }

  const dueDate = parseDueDate(body.dueDate);

  if (dueDate === undefined && body.dueDate !== undefined) {
    return {
      ok: false,
      error: "Due date must be a valid ISO/date string or null.",
    };
  }

  const payload: SupabaseTaskInsert = {
    title,
    description: description ?? null,
    status: isTaskStatus(body.status) ? body.status : "todo",
    priority: isTaskPriority(body.priority) ? body.priority : "medium",
    workspace_id: parseWorkspaceId(body.workspaceId),
    due_date: dueDate ?? null,
  };

  return { ok: true, payload };
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

  const parsedPayload = parseCreateTaskPayload(body);

  if (!parsedPayload.ok) {
    return NextResponse.json(
      { ok: false, error: parsedPayload.error },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert(parsedPayload.payload)
    .select("*")
    .returns<SupabaseTaskRow>()
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
