import { tasks as initialTasks } from "@/data/mock";
import { createLocalEntityRepository } from "@/core/repositories/local-json-repository";
import type { Task } from "@/types/index";
import {
  hasCompletedLocalDataReset,
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

export const taskRepository = createLocalEntityRepository<Task>({
  key: STORAGE_KEYS.tasks,
  validate: isTask,
});

export function getTasks(): Task[] {
  const validTasks = taskRepository.list();

  if (hasCompletedLocalDataReset()) {
    return validTasks;
  }

  return validTasks.length > 0 ? validTasks : initialTasks;
}

export function getStoredTasks(): Task[] {
  return taskRepository.list();
}

export function saveTasks(tasks: Task[]): void {
  taskRepository.save(tasks);
}

export function createTask(task: Task): Task[] {
  const tasks = getTasks();
  const nextTasks = [task, ...tasks];

  saveTasks(nextTasks);

  return nextTasks;
}
