"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { Badge } from "@/components/ui/Badge";
import type { BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  saveTasks,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "@/lib/tasks";
import {
  createTaskViaApi,
  deleteTaskViaApi,
  loadTasksFromPrimarySource,
  updateTaskViaApi,
} from "@/lib/tasks-api";
import {
  getEntityContext,
  getLocalContextEntities,
  getRelatedContextSubtitle,
  type EntityContext,
} from "@/lib/memory/context";
import {
  getLegacyWorkspaceId,
  getWorkspaceLabel,
} from "@/lib/workspaces/workspaces";
import type { Task, TaskPriority, TaskStatus } from "@/types";

type FilterValue = "all" | TaskStatus;
const taskWorkspaceKeys = ["personal", "work"] as const;
type WorkspaceChoice = (typeof taskWorkspaceKeys)[number];

type TaskFormState = {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  workspace: WorkspaceChoice;
};

type TaskPageContext = {
  statusFilter: FilterValue;
  selectedTaskId: string | null;
};

type TaskSearchParams = Pick<URLSearchParams, "get">;

type TaskContextById = Record<string, EntityContext>;

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
  workspace: "personal",
};

function statusLabel(status: TaskStatus): string {
  if (status === "in-progress") {
    return "In Progress";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function priorityVariant(priority: TaskPriority): BadgeVariant {
  if (priority === "critical") return "danger";
  if (priority === "high") return "warning";
  return "default";
}

function statusVariant(status: TaskStatus): BadgeVariant {
  if (status === "done") return "success";
  if (status === "in-progress") return "info";
  return "default";
}

function isFilterValue(value: string | null): value is FilterValue {
  return filters.some((filter) => filter.value === value);
}

function getTaskPageContextFromSearchParams(
  params: TaskSearchParams,
): TaskPageContext {
  const filter = params.get("filter");
  const taskId = params.get("taskId");

  return {
    statusFilter: isFilterValue(filter) ? filter : "all",
    selectedTaskId: taskId && taskId.trim() ? taskId : null,
  };
}

function TasksContent() {
  const searchParams = useSearchParams();
  const { session } = useAuthSession();
  const accessToken = session?.access_token;
  const initialPageContext = useMemo(
    () => getTaskPageContextFromSearchParams(searchParams),
    [searchParams],
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskContextById, setTaskContextById] = useState<TaskContextById>({});
  const [statusFilter, setStatusFilter] = useState<FilterValue>(
    initialPageContext.statusFilter,
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    initialPageContext.selectedTaskId,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<TaskFormState>(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [taskActionError, setTaskActionError] = useState<string | null>(null);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function getNextContextById(): TaskContextById {
      const entities = getLocalContextEntities();

      return Object.fromEntries(
        entities
          .filter((entity) => entity.type === "task")
          .map((entity) => [
            entity.sourceId,
            getEntityContext(entity, entities),
          ]),
      );
    }

    async function loadTasks(): Promise<void> {
      const loadedTasks = await loadTasksFromPrimarySource({ accessToken });

      if (cancelled) {
        return;
      }

      setTasks(loadedTasks);
      setTaskContextById(getNextContextById());
    }

    void loadTasks();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    setStatusFilter(initialPageContext.statusFilter);
    setSelectedTaskId(initialPageContext.selectedTaskId);
  }, [initialPageContext]);

  useEffect(() => {
    if (!selectedTaskId || tasks.length === 0) {
      return;
    }

    window.requestAnimationFrame(() => {
      document
        .getElementById(`task-${selectedTaskId}`)
        ?.scrollIntoView({ block: "center" });
    });
  }, [selectedTaskId, tasks]);

  const filteredTasks = useMemo(() => {
    if (statusFilter === "all") {
      return tasks;
    }

    return tasks.filter((task) => task.status === statusFilter);
  }, [statusFilter, tasks]);

  function openModal(): void {
    setCreateError(null);
    setModalOpen(true);
  }

  function closeModal(): void {
    setModalOpen(false);
    setForm(emptyForm);
    setCreateError(null);
  }

  function syncTasks(nextTasks: Task[]): void {
    saveTasks(nextTasks);
    setTasks(nextTasks);

    const entities = getLocalContextEntities();
    setTaskContextById(
      Object.fromEntries(
        entities
          .filter((entity) => entity.type === "task")
          .map((entity) => [
            entity.sourceId,
            getEntityContext(entity, entities),
          ]),
      ),
    );
  }

  function createLocalTaskFromForm(title: string, workspaceId: string): Task {
    return {
      id: crypto.randomUUID(),
      title,
      description: form.description.trim() || undefined,
      status: form.status,
      priority: form.priority,
      workspaceId,
      createdAt: new Date().toISOString(),
    };
  }

  function setTaskPending(taskId: string, pending: boolean): void {
    setPendingTaskIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (pending) {
        nextIds.add(taskId);
      } else {
        nextIds.delete(taskId);
      }

      return nextIds;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (isCreatingTask) {
      return;
    }

    const title = form.title.trim();

    if (!title) {
      return;
    }

    const workspaceId = getLegacyWorkspaceId(form.workspace);

    setCreateError(null);
    setIsCreatingTask(true);

    try {
      const newTask = accessToken
        ? await createTaskViaApi(
            {
              title,
              description: form.description.trim() || undefined,
              status: form.status,
              priority: form.priority,
              workspaceId,
            },
            {
              accessToken,
            },
          )
        : createLocalTaskFromForm(title, workspaceId);

      const nextTasks = [newTask, ...tasks];

      syncTasks(nextTasks);
      closeModal();
    } catch {
      if (!accessToken) {
        setCreateError("Could not create task. Please try again.");
        return;
      }

      const localTask = createLocalTaskFromForm(title, workspaceId);
      const nextTasks = [localTask, ...tasks];

      syncTasks(nextTasks);
      closeModal();
    } finally {
      setIsCreatingTask(false);
    }
  }

  async function updateTaskStatus(
    task: Task,
    nextStatus: TaskStatus,
  ): Promise<void> {
    if (task.status === nextStatus || pendingTaskIds.has(task.id)) {
      return;
    }

    setTaskActionError(null);
    setTaskPending(task.id, true);

    try {
      const updatedTask = accessToken
        ? await updateTaskViaApi(
            task.id,
            {
              status: nextStatus,
            },
            { accessToken },
          )
        : {
            ...task,
            status: nextStatus,
          };

      const nextTasks = tasks.map((currentTask) =>
        currentTask.id === task.id ? updatedTask : currentTask,
      );

      syncTasks(nextTasks);
    } catch {
      const nextTasks = tasks.map((currentTask) =>
        currentTask.id === task.id
          ? {
              ...currentTask,
              status: nextStatus,
            }
          : currentTask,
      );

      syncTasks(nextTasks);
      setTaskActionError("Cloud update failed. Saved this change locally.");
    } finally {
      setTaskPending(task.id, false);
    }
  }

  async function deleteTask(task: Task): Promise<void> {
    if (pendingTaskIds.has(task.id)) {
      return;
    }

    const confirmed = window.confirm(`Delete "${task.title}"?`);

    if (!confirmed) {
      return;
    }

    setTaskActionError(null);
    setTaskPending(task.id, true);

    try {
      if (accessToken) {
        await deleteTaskViaApi(task.id, { accessToken });
      }

      const nextTasks = tasks.filter(
        (currentTask) => currentTask.id !== task.id,
      );

      syncTasks(nextTasks);
    } catch {
      const nextTasks = tasks.filter(
        (currentTask) => currentTask.id !== task.id,
      );

      syncTasks(nextTasks);
      setTaskActionError("Cloud delete failed. Removed this task locally.");
    } finally {
      setTaskPending(task.id, false);
    }
  }

  return (
    <AppShell>
      <div className="px-4 py-6 sm:p-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                Tasks
              </h1>

              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-500 sm:text-base">
                Prioritized work with connected local context.
              </p>
            </div>

            <Button variant="secondary" onClick={openModal}>
              + New Task
            </Button>
          </div>

          <div className="app-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            {filters.map(({ label, value }) => {
              const active = statusFilter === value;

              return (
                <Button
                  key={value}
                  variant={active ? "primary" : "secondary"}
                  onClick={() => {
                    setStatusFilter(value);
                    setSelectedTaskId(null);
                  }}
                  className="px-4 py-2"
                >
                  {label}
                </Button>
              );
            })}
          </div>

          <div className="mt-8 space-y-4">
            {taskActionError ? (
              <p
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"
                role="status"
              >
                {taskActionError}
              </p>
            ) : null}

            {filteredTasks.map((task) => {
              const selected = task.id === selectedTaskId;
              const context = taskContextById[task.id];
              const taskPending = pendingTaskIds.has(task.id);

              return (
                <Card
                  key={task.id}
                  id={`task-${task.id}`}
                  className={
                    selected
                      ? "scroll-mt-24 ring-2 ring-zinc-300 dark:ring-zinc-700"
                      : ""
                  }
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      {task.status === "in-progress" ? (
                        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          Active now
                        </div>
                      ) : null}
                      <h2 className="text-lg font-semibold text-zinc-950 dark:text-white sm:text-xl">
                        {task.title}
                      </h2>

                      {task.description ? (
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
                          {task.description}
                        </p>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant={priorityVariant(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge>{getWorkspaceLabel(task.workspaceId)}</Badge>
                        {context?.labels.slice(0, 2).map((label) => (
                          <span
                            key={label}
                            className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200/60 dark:bg-zinc-900/70 dark:text-zinc-400 dark:ring-zinc-800/70"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                      {context && context.relatedItems.length > 0 ? (
                        <div className="mt-4 rounded-xl bg-zinc-100/60 px-3 py-2.5 ring-1 ring-inset ring-zinc-200/60 dark:bg-zinc-900/35 dark:ring-zinc-800/70">
                          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                            Connected to
                          </p>
                          <div className="mt-2 space-y-1.5">
                            {context.relatedItems.slice(0, 2).map((item) => (
                              <p
                                key={item.entity.id}
                                className="truncate text-sm text-zinc-700 dark:text-zinc-300"
                              >
                                {item.entity.title}
                                <span className="text-zinc-400 dark:text-zinc-600">
                                  {" "}
                                  · {getRelatedContextSubtitle(item)}
                                </span>
                              </p>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                      <Badge
                        variant={statusVariant(task.status)}
                        className="px-3 py-1.5 sm:text-sm"
                      >
                        {statusLabel(task.status)}
                      </Badge>

                      <label className="sr-only" htmlFor={`task-status-${task.id}`}>
                        Update task status
                      </label>
                      <select
                        id={`task-status-${task.id}`}
                        value={task.status}
                        disabled={taskPending}
                        onChange={(event) => {
                          void updateTaskStatus(
                            task,
                            event.target.value as TaskStatus,
                          );
                        }}
                        className="w-full cursor-pointer rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 transition hover:border-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-zinc-700 sm:w-36"
                      >
                        {TASK_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {statusLabel(status)}
                          </option>
                        ))}
                      </select>

                      <Button
                        className="w-full px-3 py-2 sm:w-auto"
                        disabled={taskPending}
                        onClick={() => {
                          void deleteTask(task);
                        }}
                        variant="ghost"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}

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
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/70 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:bg-black/70 sm:items-center sm:p-4"
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
            className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto shadow-xl sm:max-h-[90vh]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id="new-task-title"
                className="text-lg font-semibold text-zinc-950 dark:text-white"
              >
                New task
              </h2>

              <Button
                aria-label="Close"
                className="h-8 w-8 p-0 text-zinc-700 hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white"
                onClick={closeModal}
                type="button"
                variant="ghost"
              >
                <X className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2.25} />
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
                  {taskWorkspaceKeys.map((workspaceKey) => (
                    <option key={workspaceKey} value={workspaceKey}>
                      {getWorkspaceLabel(workspaceKey)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={closeModal}>
                  Cancel
                </Button>

                <Button type="submit" disabled={isCreatingTask}>
                  Create
                </Button>
              </div>

              {createError ? (
                <p
                  className="text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {createError}
                </p>
              ) : null}
            </form>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksContent />
    </Suspense>
  );
}
