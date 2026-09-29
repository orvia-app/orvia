"use client";
import { ActionPopover } from "@/components/ui/ActionPopover";
import { usePresence } from "@/components/ui/usePresence";
import { Select, Input, Textarea } from "@/components/ui/Field";


import { relatedTypeKey } from "@/lib/memory/presentation";
import { useDialogFocus } from "@/components/ui/useDialogFocus";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import { Check, ChevronDown, X } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Page, PageHeader } from "@/components/ui/Page";
import {
  recordTaskCompletedActivity,
  recordTaskCreatedActivity,
  recordTaskDeletedActivity,
  recordTaskUpdatedActivity,
} from "@/lib/activity-recording";
import {
  saveTasks,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "@/lib/tasks";
import {
  clearLocalFallbackTaskForOwner,
  createTaskViaApi,
  deleteTaskViaApi,
  loadTasksFromPrimarySourceWithBoundary,
  markHiddenTaskForOwner,
  markLocalFallbackTaskForOwner,
  saveCachedTasksForOwner,
  type PrimaryTaskSource,
  type TaskSourceById,
  updateTaskViaApi,
} from "@/lib/tasks-api";
import {
  getContextEntitiesFromRecords,
  getEntityContext,
  type EntityContext,
} from "@/lib/memory/context";
import { getLegacyWorkspaceId } from "@/lib/workspaces/workspaces";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import type { TranslationKey } from "@/lib/i18n";

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

function buildTaskContextById(tasks: readonly Task[]): TaskContextById {
  const entities = getContextEntitiesFromRecords({ tasks });

  return Object.fromEntries(
    entities
      .filter((entity) => entity.type === "task")
      .map((entity) => [
        entity.sourceId,
        getEntityContext(entity, entities),
      ]),
  );
}

const filters: { labelKey: TranslationKey; value: FilterValue }[] = [
  { labelKey: "tasks.filterAll", value: "all" },
  { labelKey: "status.todo", value: "todo" },
  { labelKey: "status.inProgress", value: "in-progress" },
  { labelKey: "status.done", value: "done" },
];

const emptyForm: TaskFormState = {
  title: "",
  description: "",
  priority: "medium",
  status: "todo",
  workspace: "personal",
};

function statusLabelKey(status: TaskStatus): TranslationKey {
  if (status === "in-progress") {
    return "status.inProgress";
  }

  if (status === "done") {
    return "status.done";
  }

  return "status.todo";
}

function priorityLabelKey(priority: TaskPriority): TranslationKey {
  switch (priority) {
    case "critical":
      return "priority.critical";
    case "high":
      return "priority.high";
    case "medium":
      return "priority.medium";
    case "low":
      return "priority.low";
  }
}

function taskSourceLabelKey(source: PrimaryTaskSource): TranslationKey {
  if (source === "cloud") {
    return "source.cloud";
  }

  if (source === "local-fallback") {
    return "source.localFallback";
  }

  return "source.localOnly";
}

function workspaceLabelKey(workspace: WorkspaceChoice): TranslationKey {
  return workspace === "work" ? "workspace.work" : "workspace.personal";
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
  const { locale, t } = useI18n();
  const accessToken = session?.access_token;
  const ownerId = session?.user.id;
  const initialPageContext = useMemo(
    () => getTaskPageContextFromSearchParams(searchParams),
    [searchParams],
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskSource, setTaskSource] = useState<PrimaryTaskSource>("local-only");
  const [taskSourcesById, setTaskSourcesById] = useState<TaskSourceById>({});
  const [taskContextById, setTaskContextById] = useState<TaskContextById>({});
  const [statusFilter, setStatusFilter] = useState<FilterValue>(
    initialPageContext.statusFilter,
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    initialPageContext.selectedTaskId,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const { present: overlayPresent, closing: overlayClosing } = usePresence(modalOpen);
  const dialogRef = useDialogFocus(modalOpen);
  useEffect(() => {
    if (!modalOpen) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [modalOpen]);
  const [form, setForm] = useState<TaskFormState>(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [taskActionError, setTaskActionError] = useState<string | null>(null);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTasks(): Promise<void> {
      const result = await loadTasksFromPrimarySourceWithBoundary({
        accessToken,
        ownerId,
      });

      if (cancelled) {
        return;
      }

      setTasks(result.tasks);
      setTaskSource(result.source);
      setTaskSourcesById(result.taskSources);
      setTaskContextById(buildTaskContextById(result.tasks));
    }

    void loadTasks();

    return () => {
      cancelled = true;
    };
  }, [accessToken, ownerId]);

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
  const hasLocalFallbackTasks = useMemo(
    () =>
      Object.values(taskSourcesById).some(
        (source) => source === "local-fallback",
      ),
    [taskSourcesById],
  );
  const taskBoundaryMessage = accessToken
    ? hasLocalFallbackTasks
      ? t("tasks.deviceOnlyWarning")
      : taskSource === "local-fallback"
      ? t("source.tasksFallback")
      : t("tasks.accountMessage")
    : t("source.tasksDevice");

  function openModal(): void {
    setCreateError(null);
    setModalOpen(true);
  }

  function closeModal(): void {
    setModalOpen(false);
    setForm(emptyForm);
    setCreateError(null);
  }

  function syncTasks(
    nextTasks: Task[],
    sourceOverrides: TaskSourceById = {},
  ): void {
    if (accessToken) {
      saveCachedTasksForOwner(ownerId, nextTasks);
    } else {
      saveTasks(nextTasks);
    }
    setTasks(nextTasks);
    setTaskSourcesById((currentSources) => {
      const nextSources: TaskSourceById = {};
      const defaultSource: PrimaryTaskSource = accessToken
        ? taskSource === "local-fallback"
          ? "local-fallback"
          : "cloud"
        : "local-only";

      for (const task of nextTasks) {
        nextSources[task.id] =
          sourceOverrides[task.id] ?? currentSources[task.id] ?? defaultSource;
      }

      return nextSources;
    });

    setTaskContextById(buildTaskContextById(nextTasks));
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
              ownerId,
            },
          )
        : createLocalTaskFromForm(title, workspaceId);

      const nextTasks = [newTask, ...tasks];

      syncTasks(nextTasks, {
        [newTask.id]: accessToken ? "cloud" : "local-only",
      });
      closeModal();

      if (accessToken) {
        void recordTaskCreatedActivity(newTask, { accessToken });
      }
    } catch {
      if (!accessToken) {
        setCreateError(t("tasks.createError"));
        return;
      }

      const localTask = createLocalTaskFromForm(title, workspaceId);
      const nextTasks = [localTask, ...tasks];

      markLocalFallbackTaskForOwner(ownerId, localTask.id);
      syncTasks(nextTasks, { [localTask.id]: "local-fallback" });
      closeModal();
      setTaskActionError(t("tasks.createFallback"));
    } finally {
      setIsCreatingTask(false);
    }
  }

  async function updateTaskDetails(
    task: Task,
    changes: { status: TaskStatus; priority?: never } | { priority: TaskPriority; status?: never },
  ): Promise<void> {
    if ((changes.status === task.status || changes.priority === task.priority) || pendingTaskIds.has(task.id)) {
      return;
    }

    setTaskActionError(null);
    setTaskPending(task.id, true);

    try {
      const updatedTask = accessToken
        ? await updateTaskViaApi(
            task.id,
            changes,
            { accessToken, ownerId },
          )
        : {
            ...task,
            ...changes,
          };

      const nextTasks = tasks.map((currentTask) =>
        currentTask.id === task.id ? updatedTask : currentTask,
      );

      if (accessToken) {
        clearLocalFallbackTaskForOwner(ownerId, task.id);
        syncTasks(nextTasks, { [task.id]: "cloud" });
      } else {
        syncTasks(nextTasks);
      }

      if (accessToken) {
        if (changes.status === "done") {
          void recordTaskCompletedActivity(
            updatedTask,
            { previousStatus: task.status },
            { accessToken },
          );
        } else {
          void recordTaskUpdatedActivity(
            updatedTask,
            { previousStatus: task.status },
            { accessToken },
          );
        }
      }
    } catch {
      const nextTasks = tasks.map((currentTask) =>
        currentTask.id === task.id
          ? {
              ...currentTask,
              ...changes,
            }
          : currentTask,
      );

      syncTasks(nextTasks, { [task.id]: "local-fallback" });
      markLocalFallbackTaskForOwner(ownerId, task.id);
      setTaskActionError(t("tasks.updateFallback"));
    } finally {
      setTaskPending(task.id, false);
    }
  }

  async function confirmDeleteTask(): Promise<void> {
    const task = taskToDelete;

    if (!task) {
      return;
    }

    if (pendingTaskIds.has(task.id)) {
      return;
    }

    setTaskActionError(null);
    setTaskPending(task.id, true);

    try {
      if (accessToken) {
        await deleteTaskViaApi(task.id, { accessToken, ownerId });
      }

      const nextTasks = tasks.filter(
        (currentTask) => currentTask.id !== task.id,
      );

      syncTasks(nextTasks);

      if (accessToken) {
        void recordTaskDeletedActivity(task, { accessToken });
      }
    } catch {
      const nextTasks = tasks.filter(
        (currentTask) => currentTask.id !== task.id,
      );

      markHiddenTaskForOwner(ownerId, task.id);
      syncTasks(nextTasks);
      setTaskActionError(t("tasks.deleteFallback"));
    } finally {
      setTaskPending(task.id, false);
      setTaskToDelete(null);
    }
  }

  return (
    <AppShell>
      <Page>
        <PageHeader
          eyebrow={t("tasks.eyebrow")}
          title={t("tasks.title")}
          description={t("tasks.description")}
          actions={
            <Button variant="secondary" onClick={openModal}>
              {t("tasks.new")}
            </Button>
          }
        />

          <Card
            variant={
              hasLocalFallbackTasks || taskSource === "local-fallback"
                ? "secondary"
                : "ghost"
            }
            className="mt-5 p-3 text-sm text-muted"
          >
            {taskBoundaryMessage}
          </Card>

          <div className="app-scrollbar -mx-4 mt-7 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            {filters.map(({ labelKey, value }) => {
              const active = statusFilter === value;

              return (
                <Button
                  key={value}
                  variant={active ? "primary" : "secondary"}
                  onClick={() => {
                    setStatusFilter(value);
                    setSelectedTaskId(null);
                  }}
                  className="shrink-0 whitespace-nowrap px-4 py-2"
                >
                  {t(labelKey)}
                </Button>
              );
            })}
          </div>

          <div className="mt-5 space-y-0">
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
                  variant="row"
                  key={task.id}
                  id={`task-${task.id}`}
                  data-pending={taskPending}
                  data-complete={task.status === "done"}
                  className={
                    selected
                      ? "orvia-item scroll-mt-24 border-l-2 border-l-accent px-3 bg-accent-soft"
                      : "orvia-item px-3"
                  }
                >
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        <button type="button" className="orvia-icon-button mt-0.5 h-6 w-6 shrink-0 rounded-full border border-line" aria-label={`${t(task.status === "done" ? "status.todo" : "status.done")}: ${task.title}`} aria-pressed={task.status === "done"} disabled={taskPending} onClick={() => void updateTaskDetails(task, { status: task.status === "done" ? "todo" : "done" })}>{task.status === "done" && <Check className="h-4 w-4 text-accent" aria-hidden />}</button>
                      <h2 className="min-w-0 [overflow-wrap:anywhere] text-base font-semibold text-foreground">
                        {task.title}
                      </h2>
                      </div>

                      {task.description ? (
                        <p className="mt-2 [overflow-wrap:anywhere] text-sm leading-6 text-muted">
                          {task.description}
                        </p>
                      ) : null}

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Select aria-label={`${t("common.priority")}: ${task.title}`} disabled={taskPending} className="min-h-8 w-auto border-0 bg-transparent px-1 py-0 text-xs" value={task.priority} onChange={(event) => void updateTaskDetails(task, { priority: event.target.value as TaskPriority })}>
                          {TASK_PRIORITIES.map(priority => <option key={priority} value={priority}>{t(priorityLabelKey(priority))}</option>)}
                        </Select>
                        <span className="text-xs text-muted">{t(taskSourceLabelKey(taskSourcesById[task.id] ?? taskSource))}</span>
                      </div>
                      {context && context.relatedItems.length > 0 ? (
                        <div className="mt-4 rounded-xl bg-subtle px-3 py-2.5 ring-1 ring-inset ring-line">
                          <p className="text-xs font-medium text-muted">
                            {t("tasks.connectedTo")}
                          </p>
                          <div className="mt-2 space-y-1.5">
                            {context.relatedItems.slice(0, 2).map((item) => (
                              <p
                                key={item.entity.id}
                                className="[overflow-wrap:anywhere] text-sm text-muted"
                              >
                                {item.entity.title}
                                <span className="text-zinc-400 dark:text-zinc-600">
                                  {" "}
                                  · {t(relatedTypeKey(item.entity.type))}
                                </span>
                              </p>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center justify-start gap-1.5 sm:justify-end">
                      <span
                        className="sr-only"
                        id={`task-status-${task.id}`}
                      >
                        {t("tasks.updateStatus")}
                      </span>
                      <div className="relative inline-flex">
                        <Select
                          aria-labelledby={`task-status-${task.id}`}
                          className="h-7 appearance-none pr-8"
                          disabled={taskPending}
                          onChange={(event) => {
                            void updateTaskDetails(task, { status: event.target.value as TaskStatus });
                          }}
                          value={task.status}
                        >
                          {TASK_STATUSES.map((status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {status === "in-progress"
                                ? t("status.progress")
                                : t(statusLabelKey(status))}
                            </option>
                          ))}
                        </Select>
                        <ChevronDown
                          className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-violet-700/70 dark:text-violet-200/70"
                          aria-hidden
                        />
                      </div>

                      <ActionPopover label={`${t("common.actions")}: ${task.title}`}>
                        {(close) => <button type="button" className="orvia-menu-action orvia-menu-danger" disabled={taskPending} onClick={() => { close(); setTaskToDelete(task); }}>{t("common.delete")}</button>}
                      </ActionPopover>
                    </div>
                  </div>
                </Card>
              );
            })}

            {filteredTasks.length === 0 ? (
              <EmptyState
                title={t("tasks.emptyTitle")}
                description={t("tasks.emptyDescription")}
              />
            ) : null}
          </div>
      </Page>

      {overlayPresent ? (
        <div
          data-presence={overlayClosing ? "exiting" : "entered"}
          inert={overlayClosing}
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
            ref={dialogRef}
            tabIndex={-1}
            aria-modal="true"
            aria-labelledby="new-task-title"
            className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto shadow-xl sm:max-h-[90vh]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id="new-task-title"
                className="min-w-0 [overflow-wrap:anywhere] text-lg font-semibold text-foreground"
              >
                {t("tasks.newTask")}
              </h2>

              <Button
                aria-label={t("common.close")}
                className="h-8 w-8 p-0 text-zinc-700 hover:text-foreground dark:hover:text-white"
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
                  className="block text-sm font-medium text-muted"
                >
                  {t("common.title")} <span className="text-red-400">*</span>
                </label>

                <Input
                  id="task-title"
                  required
                  value={form.title}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      title: event.target.value,
                    }))
                  }
                  className="mt-1.5 w-full"
                  placeholder={t("tasks.titlePlaceholder")}
                />
              </div>

              <div>
                <label
                  htmlFor="task-description"
                  className="block text-sm font-medium text-muted"
                >
                  {t("common.description")}
                </label>

                <Textarea
                  id="task-description"
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      description: event.target.value,
                    }))
                  }
                  className="mt-1.5 w-full"
                  placeholder={t("tasks.descriptionPlaceholder")}
                />
              </div>

              <div>
                <label
                  htmlFor="task-priority"
                  className="block text-sm font-medium text-muted"
                >
                  {t("common.priority")}
                </label>

                <Select
                  id="task-priority"
                  value={form.priority}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      priority: event.target.value as TaskPriority,
                    }))
                  }
                  className="mt-1.5 w-full"
                >
                  {TASK_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {t(priorityLabelKey(priority))}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label
                  htmlFor="task-status"
                  className="block text-sm font-medium text-muted"
                >
                  {t("common.status")}
                </label>

                <Select
                  id="task-status"
                  value={form.status}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      status: event.target.value as TaskStatus,
                    }))
                  }
                  className="mt-1.5 w-full"
                >
                  {TASK_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {t(statusLabelKey(status))}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label
                  htmlFor="task-workspace"
                  className="block text-sm font-medium text-muted"
                >
                  {t("common.workspace")}
                </label>

                <Select
                  id="task-workspace"
                  value={form.workspace}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      workspace: event.target.value as WorkspaceChoice,
                    }))
                  }
                  className="mt-1.5 w-full"
                >
                  {taskWorkspaceKeys.map((workspaceKey) => (
                    <option key={workspaceKey} value={workspaceKey}>
                      {t(workspaceLabelKey(workspaceKey))}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={closeModal}>
                  {t("common.cancel")}
                </Button>

                <Button type="submit" disabled={isCreatingTask}>
                  {t("common.create")}
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

      <ConfirmDialog
        cancelLabel={t("common.cancel")}
        confirmLabel={t("tasks.deleteTask")}
        confirming={taskToDelete ? pendingTaskIds.has(taskToDelete.id) : false}
        description={
          taskToDelete
            ? t("tasks.deleteDescription").replace("{title}", taskToDelete.title)
            : t("tasks.deleteFallbackDescription")
        }
        onCancel={() => {
          if (!taskToDelete || !pendingTaskIds.has(taskToDelete.id)) {
            setTaskToDelete(null);
          }
        }}
        onConfirm={confirmDeleteTask}
        open={taskToDelete !== null}
        title={t("tasks.deleteTitle")}
        tone="danger"
      />
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
