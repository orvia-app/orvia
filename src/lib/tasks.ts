import { tasks as initialTasks } from "@/data/mock";
import type { Task } from "@/types/index";
import {
  hasCompletedLocalDataReset,
  safeReadStorage,
  safeWriteStorage,
  STORAGE_KEYS,
} from "@/lib/storage";

export const TASK_STATUSES: readonly Task["status"][] = [
  "todo",
  "in-progress",
  "done",
];

export const TASK_PRIORITIES: readonly Task["priority"][] = [
  "low",
  "medium",
  "high",
  "critical",
];

export function isTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") {
    return false;
  }

  const task = value as Partial<Task>;

  return (
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    task.title.trim().length > 0 &&
    (task.description === undefined || typeof task.description === "string") &&
    typeof task.workspaceId === "string" &&
    typeof task.createdAt === "string" &&
    (task.dueDate === undefined || typeof task.dueDate === "string") &&
    TASK_STATUSES.includes(task.status as Task["status"]) &&
    TASK_PRIORITIES.includes(task.priority as Task["priority"])
  );
}

export function getTasks(): Task[] {
  const storedTasks = safeReadStorage<unknown[]>(
    STORAGE_KEYS.tasks,
    [],
  );

  const validTasks = Array.isArray(storedTasks)
    ? storedTasks.filter(isTask)
    : [];

  if (hasCompletedLocalDataReset()) {
    return validTasks;
  }

  return validTasks.length > 0 ? validTasks : initialTasks;
}

export function getStoredTasks(): Task[] {
  const storedTasks = safeReadStorage<unknown[]>(
    STORAGE_KEYS.tasks,
    [],
  );

  return Array.isArray(storedTasks) ? storedTasks.filter(isTask) : [];
}

export function saveTasks(tasks: Task[]): void {
  safeWriteStorage(STORAGE_KEYS.tasks, tasks);
}

export function createTask(task: Task): Task[] {
  const tasks = getTasks();
  const nextTasks = [task, ...tasks];

  saveTasks(nextTasks);

  return nextTasks;
}
