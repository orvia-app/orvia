import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/tasks";
import type { Task, TaskPriority, TaskStatus } from "@/types";

type ApiTaskRow = {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  status?: unknown;
  priority?: unknown;
  workspace_id?: unknown;
  due_date?: unknown;
  created_at?: unknown;
};

type CreateTaskApiResponse = {
  ok?: unknown;
  task?: unknown;
  error?: unknown;
};

export type CreateTaskApiInput = {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  workspaceId: string;
  dueDate?: string;
};

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

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function mapApiTaskToTask(
  row: ApiTaskRow,
  input: CreateTaskApiInput,
): Task | null {
  const id = optionalString(row.id);
  const title = optionalString(row.title);
  const createdAt = optionalString(row.created_at);

  if (!id || !title || !createdAt) {
    return null;
  }

  const description = optionalString(row.description) ?? input.description;
  const dueDate = optionalString(row.due_date) ?? input.dueDate;
  const workspaceId = optionalString(row.workspace_id) ?? input.workspaceId;

  return {
    id,
    title,
    description,
    status: isTaskStatus(row.status) ? row.status : input.status,
    priority: isTaskPriority(row.priority) ? row.priority : input.priority,
    workspaceId,
    dueDate,
    createdAt,
  };
}

function parseCreateTaskResponse(
  value: unknown,
  input: CreateTaskApiInput,
): Task | null {
  if (!isRecord(value)) {
    return null;
  }

  const response: CreateTaskApiResponse = value;

  if (response.ok !== true || !isRecord(response.task)) {
    return null;
  }

  return mapApiTaskToTask(response.task, input);
}

export async function createTaskViaApi(
  input: CreateTaskApiInput,
): Promise<Task> {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch {
    throw new Error("Task create response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error("Task create request failed.");
  }

  const task = parseCreateTaskResponse(responseBody, input);

  if (!task) {
    throw new Error("Task create response shape was invalid.");
  }

  return task;
}
