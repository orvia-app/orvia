"use client";

import { useMemo, useState, type FormEvent } from "react";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getTasks,
  saveTasks,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "@/lib/tasks";
import type { Task, TaskPriority, TaskStatus } from "@/types";

type FilterValue = "all" | TaskStatus;
type WorkspaceChoice = "Personal" | "Work";

type TaskFormState = {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  workspace: WorkspaceChoice;
};

const filters: { label: string; value: FilterValue }[] = [
  { label: "All", value: "all" },
  { label: "Todo", value: "todo" },
  { label: "In Progress", value: "in-progress" },
  { label: "Done", value: "done" },
];

const emptyForm: TaskFormState = {
  title: "",
  description: "",
  priority: "medium",
  status: "todo",
  workspace: "Personal",
};

function statusLabel(status: TaskStatus): string {
  if (status === "in-progress") {
    return "In Progress";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(() => getTasks());
  const [statusFilter, setStatusFilter] = useState<FilterValue>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<TaskFormState>(emptyForm);

  const filteredTasks = useMemo(() => {
    if (statusFilter === "all") {
      return tasks;
    }

    return tasks.filter((task) => task.status === statusFilter);
  }, [statusFilter, tasks]);

  function openModal(): void {
    setModalOpen(true);
  }

  function closeModal(): void {
    setModalOpen(false);
    setForm(emptyForm);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const title = form.title.trim();

    if (!title) {
      return;
    }

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

    const nextTasks = [newTask, ...tasks];

    setTasks(nextTasks);
    saveTasks(nextTasks);
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

            <Button variant="secondary" onClick={openModal}>
              + New Task
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {filters.map(({ label, value }) => {
              const active = statusFilter === value;

              return (
                <Button
                  key={value}
                  variant={active ? "primary" : "secondary"}
                  onClick={() => setStatusFilter(value)}
                  className="px-4 py-2"
                >
                  {label}
                </Button>
              );
            })}
          </div>

          <div className="mt-8 space-y-4">
            {filteredTasks.map((task) => (
              <Card key={task.id}>
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
                      <Badge>{task.priority}</Badge>
                      <Badge>Workspace {task.workspaceId}</Badge>
                    </div>
                  </div>

                  <Badge className="shrink-0 px-3 py-1.5 sm:text-sm">
                    {statusLabel(task.status)}
                  </Badge>
                </div>
              </Card>
            ))}

            {filteredTasks.length === 0 ? (
              <EmptyState
                title="No tasks here"
                description="Create a task or switch filters to review another queue."
              />
            ) : null}
          </div>
        </div>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/70 p-4 dark:bg-black/70 sm:items-center"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <Card
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-task-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id="new-task-title"
                className="text-lg font-semibold text-zinc-950 dark:text-white"
              >
                New task
              </h2>

              <Button variant="ghost" onClick={closeModal} className="px-2 py-1">
                Close
              </Button>
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
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      title: event.target.value,
                    }))
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
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      description: event.target.value,
                    }))
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
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      priority: event.target.value as TaskPriority,
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                >
                  {TASK_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
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
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      status: event.target.value as TaskStatus,
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                >
                  {TASK_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
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
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      workspace: event.target.value as WorkspaceChoice,
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                >
                  <option value="Personal">Personal</option>
                  <option value="Work">Work</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={closeModal}>
                  Cancel
                </Button>

                <Button type="submit">Create</Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}
