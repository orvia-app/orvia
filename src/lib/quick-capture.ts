import { type Note } from "@/lib/notes";
import { createNoteFromPrimarySource } from "@/lib/notes-api";
import { getTasks, saveTasks } from "@/lib/tasks";
import { createTaskViaApi, type TasksApiRequestOptions } from "@/lib/tasks-api";
import { getLegacyWorkspaceId } from "@/lib/workspaces/workspaces";
import type { Task } from "@/types";

export type QuickCaptureType = "task" | "note";

export type QuickCaptureTaskInput = {
  title: string;
  description?: string;
  accessToken?: string;
  priority?: Task["priority"];
  status?: Task["status"];
  workspaceId?: string;
};

export type QuickCaptureNoteInput = {
  accessToken?: string;
  title: string;
  content: string;
  type?: Note["type"];
};

export type QuickCaptureResult =
  | { type: "task"; task: Task; source: "api" | "local" }
  | { type: "note"; note: Note; source: "api" | "local" };

const DEFAULT_TASK_STATUS = "todo";
const DEFAULT_TASK_PRIORITY = "medium";
const DEFAULT_TASK_WORKSPACE = "personal";

function upsertTaskInLocalCache(task: Task): Task[] {
  const nextTasks = [
    task,
    ...getTasks().filter((existingTask) => existingTask.id !== task.id),
  ];

  saveTasks(nextTasks);

  return nextTasks;
}

function createLocalTask(input: QuickCaptureTaskInput): Task {
  return {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description,
    status: input.status ?? DEFAULT_TASK_STATUS,
    priority: input.priority ?? DEFAULT_TASK_PRIORITY,
    workspaceId:
      input.workspaceId ?? getLegacyWorkspaceId(DEFAULT_TASK_WORKSPACE),
    createdAt: new Date().toISOString(),
  };
}

export async function createQuickCaptureTask(
  input: QuickCaptureTaskInput,
): Promise<QuickCaptureResult> {
  const taskRequestOptions: TasksApiRequestOptions = {
    accessToken: input.accessToken,
  };

  try {
    const task = await createTaskViaApi(
      {
        title: input.title,
        description: input.description,
        status: input.status ?? DEFAULT_TASK_STATUS,
        priority: input.priority ?? DEFAULT_TASK_PRIORITY,
        workspaceId:
          input.workspaceId ?? getLegacyWorkspaceId(DEFAULT_TASK_WORKSPACE),
      },
      taskRequestOptions,
    );

    upsertTaskInLocalCache(task);

    return { type: "task", task, source: "api" };
  } catch {
    const task = createLocalTask(input);

    upsertTaskInLocalCache(task);

    return { type: "task", task, source: "local" };
  }
}

export async function createQuickCaptureNote(
  input: QuickCaptureNoteInput,
): Promise<QuickCaptureResult> {
  const result = await createNoteFromPrimarySource(
    {
      content: input.content,
      title: input.title,
      type: input.type ?? "note",
    },
    { accessToken: input.accessToken },
  );

  return { type: "note", note: result.note, source: result.source };
}
