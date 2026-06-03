import {
  getTasks,
  saveTasks,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "@/lib/tasks";
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

type DeleteTaskApiResponse = {
  ok?: unknown;
  error?: unknown;
};

type ListTasksApiResponse = {
  ok?: unknown;
  tasks?: unknown;
  error?: unknown;
};

type TaskMappingFallback = {
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  workspaceId: string;
  dueDate?: string;
};

export type CreateTaskApiInput = {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  workspaceId: string;
  dueDate?: string;
};

export type UpdateTaskApiInput = Partial<CreateTaskApiInput>;

export type TasksApiRequestOptions = {
  accessToken?: string;
};

export type PrimaryTaskSource = "cloud" | "local-fallback" | "local-only";

export type TaskSourceById = Record<string, PrimaryTaskSource>;

export type LoadTasksResult = {
  source: PrimaryTaskSource;
  taskSources: TaskSourceById;
  tasks: Task[];
};

const DEFAULT_TASK_MAPPING_FALLBACK: TaskMappingFallback = {
  status: "todo",
  priority: "medium",
  workspaceId: "1",
};

export function mergeApiTasksWithLocalTasks(
  apiTasks: Task[],
  localTasks: Task[],
): Task[] {
  const apiTaskIds = new Set(apiTasks.map((task) => task.id));
  const localOnlyTasks = localTasks.filter((task) => !apiTaskIds.has(task.id));

  return [...apiTasks, ...localOnlyTasks];
}

function createTaskSourceMap(
  tasks: readonly Task[],
  source: PrimaryTaskSource,
): TaskSourceById {
  const sources: TaskSourceById = {};

  for (const task of tasks) {
    sources[task.id] = source;
  }

  return sources;
}

function createMergedTaskSourceMap(
  apiTasks: readonly Task[],
  mergedTasks: readonly Task[],
): TaskSourceById {
  const apiTaskIds = new Set(apiTasks.map((task) => task.id));
  const sources: TaskSourceById = {};

  for (const task of mergedTasks) {
    sources[task.id] = apiTaskIds.has(task.id) ? "cloud" : "local-only";
  }

  return sources;
}

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

function getAuthorizationHeaders(
  options: TasksApiRequestOptions = {},
): HeadersInit | undefined {
  const accessToken = options.accessToken?.trim();

  if (!accessToken) {
    return undefined;
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

function mapApiTaskToTask(
  row: ApiTaskRow,
  fallback: TaskMappingFallback,
): Task | null {
  const id = optionalString(row.id);
  const title = optionalString(row.title);
  const createdAt = optionalString(row.created_at);

  if (!id || !title || !createdAt) {
    return null;
  }

  const description = optionalString(row.description) ?? fallback.description;
  const dueDate = optionalString(row.due_date) ?? fallback.dueDate;
  const workspaceId = optionalString(row.workspace_id) ?? fallback.workspaceId;

  return {
    id,
    title,
    description,
    status: isTaskStatus(row.status) ? row.status : fallback.status,
    priority: isTaskPriority(row.priority) ? row.priority : fallback.priority,
    workspaceId,
    dueDate,
    createdAt,
  };
}

function parseTaskResponse(
  value: unknown,
  fallback: TaskMappingFallback,
): Task | null {
  if (!isRecord(value)) {
    return null;
  }

  const response: CreateTaskApiResponse = value;

  if (response.ok !== true || !isRecord(response.task)) {
    return null;
  }

  return mapApiTaskToTask(response.task, fallback);
}

function parseDeleteTaskResponse(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  const response: DeleteTaskApiResponse = value;

  return response.ok === true;
}

function parseListTasksResponse(value: unknown): Task[] | null {
  if (!isRecord(value)) {
    return null;
  }

  const response: ListTasksApiResponse = value;

  if (response.ok !== true || !Array.isArray(response.tasks)) {
    return null;
  }

  const mappedTasks = response.tasks.map((task) =>
    isRecord(task)
      ? mapApiTaskToTask(task, DEFAULT_TASK_MAPPING_FALLBACK)
      : null,
  );

  if (mappedTasks.some((task) => task === null)) {
    return null;
  }

  const tasksById = new Map<string, Task>();

  for (const task of mappedTasks) {
    if (task && !tasksById.has(task.id)) {
      tasksById.set(task.id, task);
    }
  }

  return Array.from(tasksById.values());
}

export async function fetchTasksViaApi(
  options: TasksApiRequestOptions = {},
): Promise<Task[]> {
  const response = await fetch("/api/tasks", {
    method: "GET",
    cache: "no-store",
    headers: getAuthorizationHeaders(options),
  });

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch {
    throw new Error("Tasks response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error("Tasks request failed.");
  }

  const tasks = parseListTasksResponse(responseBody);

  if (!tasks) {
    throw new Error("Tasks response shape was invalid.");
  }

  return tasks;
}

export async function loadTasksFromPrimarySource(
  options: TasksApiRequestOptions = {},
): Promise<Task[]> {
  const result = await loadTasksFromPrimarySourceWithBoundary(options);

  return result.tasks;
}

export async function loadTasksFromPrimarySourceWithBoundary(
  options: TasksApiRequestOptions = {},
): Promise<LoadTasksResult> {
  if (!options.accessToken?.trim()) {
    const tasks = getTasks();

    return {
      source: "local-only",
      taskSources: createTaskSourceMap(tasks, "local-only"),
      tasks,
    };
  }

  try {
    const apiTasks = await fetchTasksViaApi(options);
    const mergedTasks = mergeApiTasksWithLocalTasks(apiTasks, getTasks());

    saveTasks(mergedTasks);

    return {
      source: "cloud",
      taskSources: createMergedTaskSourceMap(apiTasks, mergedTasks),
      tasks: mergedTasks,
    };
  } catch {
    const tasks = getTasks();

    return {
      source: "local-fallback",
      taskSources: createTaskSourceMap(tasks, "local-fallback"),
      tasks,
    };
  }
}

export async function createTaskViaApi(
  input: CreateTaskApiInput,
  options: TasksApiRequestOptions = {},
): Promise<Task> {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthorizationHeaders(options),
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

  const task = parseTaskResponse(responseBody, input);

  if (!task) {
    throw new Error("Task create response shape was invalid.");
  }

  return task;
}

export async function updateTaskViaApi(
  taskId: string,
  input: UpdateTaskApiInput,
  options: TasksApiRequestOptions = {},
): Promise<Task> {
  const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthorizationHeaders(options),
    },
    body: JSON.stringify(input),
  });

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch {
    throw new Error("Task update response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error("Task update request failed.");
  }

  const task = parseTaskResponse(responseBody, DEFAULT_TASK_MAPPING_FALLBACK);

  if (!task) {
    throw new Error("Task update response shape was invalid.");
  }

  return task;
}

export async function deleteTaskViaApi(
  taskId: string,
  options: TasksApiRequestOptions = {},
): Promise<void> {
  const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: "DELETE",
    headers: getAuthorizationHeaders(options),
  });

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch {
    throw new Error("Task delete response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error("Task delete request failed.");
  }

  if (!parseDeleteTaskResponse(responseBody)) {
    throw new Error("Task delete response shape was invalid.");
  }
}
