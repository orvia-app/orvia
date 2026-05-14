"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Sparkles } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { tasks as mockTasks } from "@/data/mock";
import type { Task, TaskPriority, TaskStatus } from "@/types";

const TASKS_STORAGE_KEY = "personal-os.tasks";
const QUICK_CAPTURES_KEY = "personal-os.quick-captures";

const TASK_STATUSES: TaskStatus[] = ["todo", "in-progress", "done"];
const TASK_PRIORITIES: TaskPriority[] = [
  "low",
  "medium",
  "high",
  "critical",
];

function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === "string" &&
    (TASK_STATUSES as readonly string[]).includes(value)
  );
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return (
    typeof value === "string" &&
    (TASK_PRIORITIES as readonly string[]).includes(value)
  );
}

function isTaskRecord(value: unknown): value is Task {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.title !== "string") return false;
  if (!isTaskStatus(o.status) || !isTaskPriority(o.priority)) return false;
  if (typeof o.workspaceId !== "string" || typeof o.createdAt !== "string") {
    return false;
  }
  if (
    o.description !== undefined &&
    typeof o.description !== "string"
  ) {
    return false;
  }
  if (o.dueDate !== undefined && typeof o.dueDate !== "string") {
    return false;
  }
  return true;
}

function readTasksFromLocalStorage(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(isTaskRecord);
  } catch {
    return [];
  }
}

function tasksForToday(): Task[] {
  const stored = readTasksFromLocalStorage();
  if (stored.length > 0) return stored;
  return mockTasks;
}

const PRIORITY_RANK: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function sortByPriorityDesc(a: Task, b: Task): number {
  return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
}

type QuickCapture = {
  id: string;
  text: string;
  createdAt: string;
};

function isQuickCapture(value: unknown): value is QuickCapture {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.text === "string" &&
    typeof o.createdAt === "string"
  );
}

function readQuickCaptures(): QuickCapture[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUICK_CAPTURES_KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(isQuickCapture);
  } catch {
    return [];
  }
}

const AI_SUGGESTIONS = [
  "Start with the highest-priority work item.",
  "Clear small admin tasks after deep work.",
  "Review finance and car reminders once per day.",
] as const;

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [hydrated, setHydrated] = useState(false);
  const [captureText, setCaptureText] = useState("");
  const [captureSuccess, setCaptureSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setTasks(tasksForToday());
    setHydrated(true);
  }, []);

  const nonDone = useMemo(
    () => tasks.filter((t) => t.status !== "done"),
    [tasks],
  );

  const focusPlan = useMemo(() => {
    return [...nonDone].sort(sortByPriorityDesc).slice(0, 3);
  }, [nonDone]);

  function sendToInbox() {
    const text = captureText.trim();
    if (typeof window === "undefined" || !text) return;
    try {
      const list = readQuickCaptures();
      list.push({
        id: Date.now().toString(),
        text,
        createdAt: new Date().toISOString(),
      });
      window.localStorage.setItem(QUICK_CAPTURES_KEY, JSON.stringify(list));
      setCaptureText("");
      setCaptureSuccess(true);
      window.setTimeout(() => setCaptureSuccess(false), 3200);
    } catch {
      /* ignore */
    }
  }

  return (
    <AppShell>
      <div className="p-6 sm:p-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-300/40 bg-violet-100 dark:border-violet-500/20 dark:bg-violet-500/10">
              <CalendarDays className="h-6 w-6 text-violet-700 dark:text-violet-300" aria-hidden />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                Today
              </h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-500 sm:text-base">
                Your daily command center.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            <section className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
                  Focus Plan
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-500">
                  Top three open items by priority.
                </p>
                <div className="mt-4 space-y-3">
                  {focusPlan.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-100/80 px-5 py-10 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-500">
                      {hydrated
                        ? "Nothing urgent in the queue. Add tasks or clear done work."
                        : "Loading…"}
                    </div>
                  ) : (
                    focusPlan.map((task, i) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-zinc-950 dark:text-white">
                            {task.title}
                          </p>
                          {task.description ? (
                            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                              {task.description}
                            </p>
                          ) : null}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                              {task.priority}
                            </span>
                            <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                              {task.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
                  Overdue / Active
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-500">
                  Everything still in motion.
                </p>
                <div className="mt-4 space-y-2">
                  {nonDone.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-100/80 px-5 py-10 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-500">
                      All caught up — no active tasks.
                    </div>
                  ) : (
                    nonDone.map((task) => (
                      <div
                        key={task.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/80"
                      >
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {task.title}
                        </span>
                        <span className="text-xs text-zinc-600 dark:text-zinc-500">
                          {task.priority} · {task.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <div className="space-y-8">
              <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/80">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-950 dark:text-white">
                  <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" aria-hidden />
                  AI Suggestions
                </h2>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {AI_SUGGESTIONS.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="text-violet-600/80 dark:text-violet-500/80">
                        —
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950/80">
                <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
                  Quick Capture
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-500">
                  Stash a thought; process it later from{" "}
                  <Link
                    href="/inbox"
                    className="text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
                  >
                    Inbox
                  </Link>
                  .
                </p>
                <textarea
                  value={captureText}
                  onChange={(e) => setCaptureText(e.target.value)}
                  rows={4}
                  placeholder="Quick thought, reminder, or link…"
                  className="mt-4 w-full resize-y rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:border-zinc-800 dark:bg-black dark:text-white dark:placeholder:text-zinc-600 dark:focus:border-violet-500/35 dark:focus:ring-violet-500/15"
                />
                <button
                  type="button"
                  onClick={sendToInbox}
                  disabled={!captureText.trim()}
                  className="mt-3 w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                >
                  Send to Inbox
                </button>
                {captureSuccess ? (
                  <p
                    className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400"
                    role="status"
                  >
                    Saved successfully.
                  </p>
                ) : null}
              </section>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
