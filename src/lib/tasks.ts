import { createLocalEntityRepository } from "@/core/repositories/local-json-repository";
import type { Task } from "@/types/index";
import { STORAGE_KEYS } from "@/lib/storage";

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

const LEGACY_DEMO_TASKS: readonly Task[] = [
  {
    id: "1",
    title: "Finish Orvia MVP",
    description: "Build dashboard and task architecture",
    status: "in-progress",
    priority: "high",
    workspaceId: "2",
    dueDate: "2026-05-20",
    createdAt: "2026-05-14",
  },
  {
    id: "2",
    title: "Plan Rehab Center",
    description: "Prepare finance and launch roadmap",
    status: "todo",
    priority: "critical",
    workspaceId: "1",
    dueDate: "2026-05-30",
    createdAt: "2026-05-14",
  },
  {
    id: "3",
    title: "Prepare DevOps Roadmap",
    description: "Learning and infrastructure planning",
    status: "done",
    priority: "medium",
    workspaceId: "2",
    createdAt: "2026-05-14",
  },
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

function isLegacyDemoTask(task: Task): boolean {
  return LEGACY_DEMO_TASKS.some((demoTask) => {
    return (
      task.id === demoTask.id &&
      task.title === demoTask.title &&
      task.description === demoTask.description &&
      task.status === demoTask.status &&
      task.priority === demoTask.priority &&
      task.workspaceId === demoTask.workspaceId &&
      task.dueDate === demoTask.dueDate &&
      task.createdAt === demoTask.createdAt
    );
  });
}

function removeLegacyDemoTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => !isLegacyDemoTask(task));
}

export function getTasks(): Task[] {
  return removeLegacyDemoTasks(taskRepository.list());
}

export function getStoredTasks(): Task[] {
  return removeLegacyDemoTasks(taskRepository.list());
}

export function saveTasks(tasks: Task[]): void {
  taskRepository.save(removeLegacyDemoTasks(tasks));
}

export function createTask(task: Task): Task[] {
  const tasks = getTasks();
  const nextTasks = [task, ...tasks];

  saveTasks(nextTasks);

  return nextTasks;
}
