import { NextResponse } from "next/server";

import {
  getSupabaseServerClient,
  type SupabaseTaskInsert,
  type SupabaseTaskRow,
} from "@/lib/supabase";
import { authenticateApiRequest } from "@/server/api/auth";

const TASK_TITLE_MAX_LENGTH = 240;
const TASK_DESCRIPTION_MAX_LENGTH = 5000;
const TASK_STATUSES = ["todo", "in-progress", "done"] as const;
const TASK_PRIORITIES = ["low", "medium", "high", "critical"] as const;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type TaskStatus = (typeof TASK_STATUSES)[number];
type TaskPriority = (typeof TASK_PRIORITIES)[number];

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UpdateTaskBody = {
  title?: unknown;
  description?: unknown;
  status?: unknown;
  priority?: unknown;
  workspaceId?: unknown;
  dueDate?: unknown;
};

type ParsedTaskUpdate =
  | { ok: true; payload: Partial<SupabaseTaskInsert> }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function parseTaskTitle(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const title = value.trim();

  if (title.length === 0 || title.length > TASK_TITLE_MAX_LENGTH) {
    return undefined;
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

function parseWorkspaceId(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
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

  if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return dueDate;
  }

  const timestamp = Date.parse(dueDate);

  if (Number.isNaN(timestamp)) {
    return undefined;
  }

  return new Date(timestamp).toISOString().slice(0, 10);
}

function parseUpdateTaskPayload(body: UpdateTaskBody): ParsedTaskUpdate {
  const payload: Partial<SupabaseTaskInsert> = {};

  if (body.title !== undefined) {
    const title = parseTaskTitle(body.title);

    if (!title) {
      return {
        ok: false,
        error: `Title must be a non-empty string up to ${TASK_TITLE_MAX_LENGTH} characters.`,
      };
    }

    payload.title = title;
  }

  if (body.description !== undefined) {
    const description = parseTaskDescription(body.description);

    if (description === undefined) {
      return {
        ok: false,
        error: `Description must be a string, null, or ${TASK_DESCRIPTION_MAX_LENGTH} characters or fewer.`,
      };
    }

    payload.description = description;
  }

  if (body.status !== undefined) {
    if (!isTaskStatus(body.status)) {
      return {
        ok: false,
        error: "Status must be one of: todo, in-progress, done.",
      };
    }

    payload.status = body.status;
  }

  if (body.priority !== undefined) {
    if (!isTaskPriority(body.priority)) {
      return {
        ok: false,
        error: "Priority must be one of: low, medium, high, critical.",
      };
    }

    payload.priority = body.priority;
  }

  if (body.workspaceId !== undefined) {
    const workspaceId = parseWorkspaceId(body.workspaceId);

    if (workspaceId === undefined) {
      return {
        ok: false,
        error: "Workspace id must be a string, null, or empty.",
      };
    }

    payload.workspace_id = workspaceId;
  }

  if (body.dueDate !== undefined) {
    const dueDate = parseDueDate(body.dueDate);

    if (dueDate === undefined) {
      return {
        ok: false,
        error: "Due date must be a valid ISO/date string or null.",
      };
    }

    payload.due_date = dueDate;
  }

  if (Object.keys(payload).length === 0) {
    return { ok: false, error: "At least one field is required." };
  }

  return { ok: true, payload };
}

async function getTaskId(context: RouteContext): Promise<string | null> {
  const { id } = await context.params;

  return UUID_PATTERN.test(id) ? id : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const taskId = await getTaskId(context);

  if (!taskId) {
    return NextResponse.json(
      { ok: false, error: "Task not found." },
      { status: 404 },
    );
  }

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

  const parsedPayload = parseUpdateTaskPayload(body);

  if (!parsedPayload.ok) {
    return NextResponse.json(
      { ok: false, error: parsedPayload.error },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .update(parsedPayload.payload)
    .eq("id", taskId)
    .eq("user_id", auth.userId)
    .is("deleted_at", null)
    .select("*")
    .returns<SupabaseTaskRow>()
    .maybeSingle();

  if (error) {
    console.error("Failed to update task in Supabase.", error.message);

    return NextResponse.json(
      { ok: false, error: "Failed to update task." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "Task not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, task: data }, { status: 200 });
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const taskId = await getTaskId(context);

  if (!taskId) {
    return NextResponse.json(
      { ok: false, error: "Task not found." },
      { status: 404 },
    );
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("user_id", auth.userId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to soft delete task in Supabase.", error.message);

    return NextResponse.json(
      { ok: false, error: "Failed to delete task." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "Task not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
