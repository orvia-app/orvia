import { getStoredNotes, type Note } from "@/lib/notes";
import {
  getQuickCaptures,
  type QuickCapture,
} from "@/lib/quick-captures";
import { getTasks } from "@/lib/tasks";
import type { Task } from "@/types";

export type DailyBriefing = {
  overdueTasks: Task[];
  todayTasks: Task[];
  recentNotes: Note[];
  recentCaptures: QuickCapture[];
};

function parseDateOnly(value: string): Date | null {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function sortByCreatedAtDesc<T extends { createdAt?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    return bTime - aTime;
  });
}

export function getOverdueTasks(
  tasks: readonly Task[],
  referenceDate = new Date(),
): Task[] {
  const today = startOfDay(referenceDate);

  return tasks.filter((task) => {
    if (task.status === "done" || !task.dueDate) {
      return false;
    }

    const dueDate = parseDateOnly(task.dueDate);

    return Boolean(dueDate && dueDate < today);
  });
}

export function getTodayTasks(
  tasks: readonly Task[],
  referenceDate = new Date(),
): Task[] {
  return tasks.filter((task) => {
    if (task.status === "done" || !task.dueDate) {
      return false;
    }

    const dueDate = parseDateOnly(task.dueDate);

    return Boolean(dueDate && isSameDay(dueDate, referenceDate));
  });
}

export function getRecentNotes(
  notes: readonly Note[],
  limit = 5,
): Note[] {
  return notes.slice(0, limit);
}

export function getRecentCaptures(
  captures: readonly QuickCapture[],
  limit = 5,
): QuickCapture[] {
  return sortByCreatedAtDesc([...captures]).slice(0, limit);
}

export function getDailyBriefing(
  referenceDate = new Date(),
): DailyBriefing {
  const tasks = getTasks();
  const notes = getStoredNotes();
  const captures = getQuickCaptures();

  return {
    overdueTasks: getOverdueTasks(tasks, referenceDate),
    todayTasks: getTodayTasks(tasks, referenceDate),
    recentNotes: getRecentNotes(notes),
    recentCaptures: getRecentCaptures(captures),
  };
}
