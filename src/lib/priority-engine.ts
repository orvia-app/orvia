import type { Task, TaskPriority } from "@/types";

export type PriorityReason =
  | "Overdue"
  | "Due today"
  | "Critical priority"
  | "High priority"
  | "Already in progress"
  | "Recently created"
  | "Waiting too long";

export type PriorityEngineContext = {
  todayDateKey: string;
};

export type PrioritizedTask = {
  reasons: PriorityReason[];
  score: number;
  task: Task;
};

const PRIORITY_SCORE: Record<TaskPriority, number> = {
  critical: 45,
  high: 32,
  medium: 16,
  low: 6,
};

const RECENT_TASK_DAYS = 2;
const STALE_TASK_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getTaskDateKey(value: string | undefined): string | undefined {
  return value?.split("T")[0];
}

function getDaysBetween(startDateKey: string, endDateKey: string): number {
  const start = Date.parse(`${startDateKey}T00:00:00.000Z`);
  const end = Date.parse(`${endDateKey}T00:00:00.000Z`);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return 0;
  }

  return Math.floor((end - start) / MS_PER_DAY);
}

function addReason(
  reasons: PriorityReason[],
  reason: PriorityReason,
): void {
  if (!reasons.includes(reason)) {
    reasons.push(reason);
  }
}

export function calculateTaskPriorityScore(
  task: Task,
  context: PriorityEngineContext,
): number {
  if (task.status === "done") {
    return 0;
  }

  let score = PRIORITY_SCORE[task.priority];
  const dueDateKey = getTaskDateKey(task.dueDate);
  const createdDateKey = getTaskDateKey(task.createdAt);

  if (dueDateKey && dueDateKey < context.todayDateKey) {
    score += 70;
  } else if (dueDateKey === context.todayDateKey) {
    score += 55;
  }

  if (task.status === "in-progress") {
    score += 20;
  }

  if (createdDateKey) {
    const ageInDays = getDaysBetween(createdDateKey, context.todayDateKey);

    if (ageInDays <= RECENT_TASK_DAYS) {
      score += 5;
    } else if (ageInDays >= STALE_TASK_DAYS) {
      score += 8;
    }
  }

  return score;
}

export function getPriorityReason(
  task: Task,
  context: PriorityEngineContext,
): PriorityReason[] {
  const reasons: PriorityReason[] = [];

  if (task.status === "done") {
    return reasons;
  }

  const dueDateKey = getTaskDateKey(task.dueDate);
  const createdDateKey = getTaskDateKey(task.createdAt);

  if (dueDateKey && dueDateKey < context.todayDateKey) {
    addReason(reasons, "Overdue");
  } else if (dueDateKey === context.todayDateKey) {
    addReason(reasons, "Due today");
  }

  if (task.priority === "critical") {
    addReason(reasons, "Critical priority");
  } else if (task.priority === "high") {
    addReason(reasons, "High priority");
  }

  if (task.status === "in-progress") {
    addReason(reasons, "Already in progress");
  }

  if (createdDateKey) {
    const ageInDays = getDaysBetween(createdDateKey, context.todayDateKey);

    if (ageInDays <= RECENT_TASK_DAYS) {
      addReason(reasons, "Recently created");
    } else if (ageInDays >= STALE_TASK_DAYS) {
      addReason(reasons, "Waiting too long");
    }
  }

  return reasons;
}

export function getPrioritizedTasks(
  tasks: readonly Task[],
  context: PriorityEngineContext,
): PrioritizedTask[] {
  return tasks
    .filter((task) => task.status !== "done")
    .map((task) => ({
      task,
      score: calculateTaskPriorityScore(task, context),
      reasons: getPriorityReason(task, context),
    }))
    .sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }

      const aDueDate = getTaskDateKey(a.task.dueDate) ?? "9999-12-31";
      const bDueDate = getTaskDateKey(b.task.dueDate) ?? "9999-12-31";

      if (aDueDate !== bDueDate) {
        return aDueDate.localeCompare(bDueDate);
      }

      return b.task.createdAt.localeCompare(a.task.createdAt);
    });
}
