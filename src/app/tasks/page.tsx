"use client";

import { useEffect, useState, type FormEvent } from "react";

import { AppShell } from "@/components/AppShell";
import { tasks as initialTasks } from "@/data/mock";
import type { Task, TaskPriority, TaskStatus } from "@/types";

const TASKS_STORAGE_KEY = "personal-os.tasks";

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

function parseTasksFromStorage(raw: string): Task[] | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data) || !data.every(isTaskRecord)) return null;
    return data;
  } catch {
    return null;
  }
}

type FilterValue = "all" | TaskStatus;

const filters: { label: string; value: FilterValue }[] = [
  { label: "All", value: "all" },
  { label: "Todo", value: "todo" },
  { label: "In Progress", value: "in-progress" },
  { label: "Done", value: "done" },
];

function statusLabel(status: TaskStatus) {
  if (status === "in-progress") return "In Progress";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

type WorkspaceChoice = "Personal" | "Work";

const emptyForm = {
  title: "",
  description: "",
  priority: "medium" as TaskPriority,
  status: "todo" as TaskStatus,
  workspace: "Personal" as WorkspaceChoice,
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [storageReady, setStorageReady] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FilterValue>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(TASKS_STORAGE_KEY);
      if (raw) {
        const parsed = parseTasksFromStorage(raw);
        if (parsed) setTasks(parsed);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !storageReady) return;
    try {
      window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      /* ignore quota / private mode */
    }
  }, [tasks, storageReady]);

  const filtered =
    statusFilter === "all"
      ? tasks
      : tasks.filter((t) => t.status === statusFilter);

  function openModal() {
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm(emptyForm);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) return;

    const workspaceId = form.workspace === "Personal" ? "1" : "2";

    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description: form.description.trim() || undefined,
      status: form.status,
      priority: form.priority,
      workspaceId,
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [...prev, newTask]);
    closeModal();
  }

  return (
    <AppShell>
      <div className="p-6 sm:p-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                Tasks
              </h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-500 sm:text-base">
                AI-powered task management
              </p>
            </div>
            <button
              type="button"
              onClick={openModal}
              className="shrink-0 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              + New Task
            </button>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {filters.map(({ label, value }) => {
              const active = statusFilter === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={
                    active
                      ? "rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-950"
                      : "rounded-xl bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-300 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mt-8 space-y-4">
            {filtered.map((task) => (
              <div
                key={task.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-950 dark:text-white sm:text-xl">
                      {task.title}
                    </h2>
                    {task.description ? (
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
                        {task.description}
                      </p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {task.priority}
                      </span>
                      <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        Workspace {task.workspaceId}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex w-fit shrink-0 rounded-full bg-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 sm:text-sm">
                    {statusLabel(task.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/70 p-4 dark:bg-black/70 sm:items-center"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-task-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id="new-task-title"
                className="text-lg font-semibold text-zinc-950 dark:text-white"
              >
                New task
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg px-2 py-1 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                Close
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="task-title"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  id="task-title"
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                  placeholder="What needs to be done?"
                />
              </div>

              <div>
                <label
                  htmlFor="task-description"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Description
                </label>
                <textarea
                  id="task-description"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="mt-1.5 w-full resize-y rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                  placeholder="Optional details"
                />
              </div>

              <div>
                <label
                  htmlFor="task-priority"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Priority
                </label>
                <select
                  id="task-priority"
                  value={form.priority}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      priority: e.target.value as TaskPriority,
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="critical">critical</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="task-status"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Status
                </label>
                <select
                  id="task-status"
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value as TaskStatus,
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                >
                  <option value="todo">todo</option>
                  <option value="in-progress">in-progress</option>
                  <option value="done">done</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="task-workspace"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Workspace
                </label>
                <select
                  id="task-workspace"
                  value={form.workspace}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      workspace: e.target.value as WorkspaceChoice,
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                >
                  <option value="Personal">Personal</option>
                  <option value="Work">Work</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-zinc-300 bg-transparent px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
