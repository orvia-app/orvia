"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Inbox,
  Plus,
  Search,
  TriangleAlert,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { useI18n } from "@/components/i18n/I18nProvider";
import { QuickCapture } from "@/components/quick-capture/QuickCapture";
import { TimelineEventCard } from "@/components/timeline/TimelineEventCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Page,
  PageHeader,
  PageSection,
  PageSectionHeader,
} from "@/components/ui/Page";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchActivitiesViaApi } from "@/lib/activities-api";
import {
  loadCapturesFromPrimarySourceWithBoundary,
  type PrimaryCaptureSource,
} from "@/lib/captures-api";
import { loadNotesFromPrimarySourceWithBoundary } from "@/lib/notes-api";
import {
  loadTasksFromPrimarySourceWithBoundary,
  type PrimaryTaskSource,
  type TaskSourceById,
} from "@/lib/tasks-api";
import {
  getPrioritizedTasks,
  type PriorityReason,
  type PrioritizedTask,
} from "@/lib/priority-engine";
import {
  createTimelineEventsFromActivities,
  type TimelineEvent,
} from "@/lib/timeline";
import type { Task, TaskPriority } from "@/types";
import type { TranslationKey } from "@/lib/i18n";

type FocusBucket = {
  description: string;
  emptyDescription: string;
  emptyTitle: string;
  icon: typeof TriangleAlert;
  tasks: PrioritizedTask[];
  title: string;
};

function getTodayDateKey(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

function getTaskDueDateKey(task: Task): string | undefined {
  return task.dueDate?.split("T")[0];
}

function isHighPriorityTask(task: Task): boolean {
  return (
    task.status !== "done" &&
    (task.priority === "critical" || task.priority === "high")
  );
}

function getTaskFilterUrl(task: Task): string {
  const params = new URLSearchParams({
    filter: task.status,
    taskId: task.id,
  });

  return `/app/tasks?${params.toString()}`;
}

function taskStatusKey(status: Task["status"]): TranslationKey {
  switch (status) {
    case "in-progress":
      return "status.inProgress";
    case "done":
      return "status.done";
    case "todo":
      return "status.todo";
  }
}

function taskPriorityKey(priority: TaskPriority): TranslationKey {
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

function taskSourceKey(source: PrimaryTaskSource): TranslationKey {
  if (source === "local-fallback") {
    return "source.savedDevice";
  }

  return "source.savedDevice";
}

function priorityReasonKey(reason: PriorityReason): TranslationKey {
  switch (reason) {
    case "Overdue":
      return "reason.overdue";
    case "Due today":
      return "reason.dueToday";
    case "Critical priority":
      return "reason.critical";
    case "High priority":
      return "reason.high";
    case "Already in progress":
      return "reason.inProgress";
    case "Recently created":
      return "reason.recent";
    case "Waiting too long":
      return "reason.waiting";
  }
}

function shouldShowTaskSource(source: PrimaryTaskSource): boolean {
  return source !== "cloud";
}

function CompactEmptyState({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: typeof CheckCircle2;
  title: string;
}) {
  return (
    <div className="border-t border-line pt-3">
      <div className="flex items-start gap-2.5">
        <Icon
          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {title}
          </p>
          <p className="mt-0.5 text-xs leading-5 text-muted">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function TaskSignalList({
  emptyDescription,
  emptyTitle,
  taskSources,
  tasks,
  t,
}: {
  emptyDescription: string;
  emptyTitle: string;
  taskSources: TaskSourceById;
  tasks: PrioritizedTask[];
  t: (key: TranslationKey) => string;
}) {
  if (tasks.length === 0) {
    return (
      <CompactEmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={CheckCircle2}
      />
    );
  }

  return (
    <ul className="space-y-2">
      {tasks.slice(0, 4).map((prioritizedTask) => {
        const { reasons, task } = prioritizedTask;
        const dueDate = getTaskDueDateKey(task);

        return (
          <li key={task.id}>
            <Link
              href={getTaskFilterUrl(task)}
              className="orvia-list-row group"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="[overflow-wrap:anywhere] text-sm font-semibold text-foreground">
                    {task.title}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-muted ring-1 ring-line">
                      {t(taskPriorityKey(task.priority))}
                    </span>
                    <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-muted ring-1 ring-line">
                      {t(taskStatusKey(task.status))}
                    </span>
                    {shouldShowTaskSource(
                      taskSources[task.id] ?? "local-only",
                    ) ? (
                      <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-muted ring-1 ring-line">
                        {t(taskSourceKey(taskSources[task.id] ?? "local-only"))}
                      </span>
                    ) : null}
                    {dueDate ? (
                      <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-muted ring-1 ring-line">
                        {dueDate}
                      </span>
                    ) : null}
                    {reasons.slice(0, 2).map((reason) => (
                      <span
                        key={reason}
                        className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 ring-1 ring-violet-200/70 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20"
                      >
                        {t(priorityReasonKey(reason))}
                      </span>
                    ))}
                  </div>
                </div>
                <ArrowRight
                  className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-700 dark:group-hover:text-zinc-200"
                  aria-hidden
                />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function Home() {
  const { loading: authLoading, session } = useAuthSession();
  const { t } = useI18n();
  const accessToken = session?.access_token;
  const ownerId = session?.user.id;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskSource, setTaskSource] = useState<PrimaryTaskSource>("local-only");
  const [taskSourcesById, setTaskSourcesById] = useState<TaskSourceById>({});
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [todayDateKey, setTodayDateKey] = useState("");
  const [inboxCount, setInboxCount] = useState(0);
  const [inboxSource, setInboxSource] =
    useState<PrimaryCaptureSource>("local-only");
  const [notesCount, setNotesCount] = useState(0);
  const [activityEvents, setActivityEvents] = useState<TimelineEvent[]>([]);
  const [activityLoaded, setActivityLoaded] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const dashboardDataLoadedRef = useRef(false);
  const dashboardActivityLoadedRef = useRef(false);
  const dashboardOwnerKeyRef = useRef<string | null>(null);

  const refreshDashboardData = useCallback(async () => {
    const ownerKey = ownerId ?? "signed-out";

    if (dashboardOwnerKeyRef.current !== ownerKey) {
      dashboardOwnerKeyRef.current = ownerKey;
      dashboardDataLoadedRef.current = false;
      dashboardActivityLoadedRef.current = false;
      setTasks([]);
      setInboxCount(0);
      setNotesCount(0);
      setActivityEvents([]);
    }

    if (!dashboardDataLoadedRef.current) {
      setTasksLoaded(false);
    }

    if (!dashboardActivityLoadedRef.current) {
      setActivityLoaded(false);
    }

    setActivityError(null);

    const [taskResult, captureResult, noteResult] = await Promise.all([
      loadTasksFromPrimarySourceWithBoundary({
        accessToken,
        ownerId,
      }),
      loadCapturesFromPrimarySourceWithBoundary({
        accessToken,
        ownerId,
      }),
      loadNotesFromPrimarySourceWithBoundary({
        accessToken,
        ownerId,
      }),
    ]);

    setTasks(taskResult.tasks);
    setTaskSource(taskResult.source);
    setTaskSourcesById(taskResult.taskSources);
    setInboxCount(captureResult.captures.length);
    setInboxSource(captureResult.source);
    setNotesCount(noteResult.notes.length);
    dashboardDataLoadedRef.current = true;
    setTasksLoaded(true);

    if (!accessToken) {
      setActivityEvents([]);
      dashboardActivityLoadedRef.current = true;
      setActivityLoaded(true);
      return;
    }

    try {
      const activities = await fetchActivitiesViaApi({ accessToken });
      setActivityEvents(
        createTimelineEventsFromActivities(activities, t).slice(0, 5),
      );
    } catch {
      setActivityEvents([]);
      setActivityError(t("dashboard.activityError"));
    } finally {
      dashboardActivityLoadedRef.current = true;
      setActivityLoaded(true);
    }
  }, [accessToken, ownerId, t]);

  useEffect(() => {
    setTodayDateKey(getTodayDateKey());
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void refreshDashboardData();

    function handleRefresh(): void {
      void refreshDashboardData();
    }

    window.addEventListener("focus", handleRefresh);
    window.addEventListener("storage", handleRefresh);

    return () => {
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
    };
  }, [authLoading, refreshDashboardData]);

  const focusBuckets = useMemo<FocusBucket[]>(() => {
    const prioritizedTasks = todayDateKey
      ? getPrioritizedTasks(tasks, { todayDateKey })
      : [];
    const overdueTasks = todayDateKey
      ? prioritizedTasks.filter(({ task }) => {
          const dueDate = getTaskDueDateKey(task);

          return dueDate ? dueDate < todayDateKey : false;
        })
      : [];
    const todayTasks = todayDateKey
      ? prioritizedTasks.filter(
          ({ task }) => getTaskDueDateKey(task) === todayDateKey,
        )
      : [];

    return [
      {
        title: t("dashboard.highPriority"),
        description: t("dashboard.highPriorityDescription"),
        emptyTitle: t("dashboard.noUrgent"),
        emptyDescription: t("dashboard.highPriorityEmpty"),
        icon: TriangleAlert,
        tasks: prioritizedTasks.filter(({ task }) => isHighPriorityTask(task)),
      },
      {
        title: t("dashboard.overdue"),
        description: t("dashboard.overdueDescription"),
        emptyTitle: t("dashboard.nothingOverdue"),
        emptyDescription: t("dashboard.overdueEmpty"),
        icon: Clock,
        tasks: overdueTasks,
      },
      {
        title: t("dashboard.dueToday"),
        description: t("dashboard.dueTodayDescription"),
        emptyTitle: t("dashboard.nothingDueToday"),
        emptyDescription: t("dashboard.dueTodayEmpty"),
        icon: CheckCircle2,
        tasks: todayTasks,
      },
    ];
  }, [tasks, t, todayDateKey]);

  function handleQuickCaptureOpenChange(open: boolean): void {
    setQuickCaptureOpen(open);

    if (!open && !authLoading) {
      void refreshDashboardData();
    }
  }

  const dashboardBoundaryMessage = accessToken
    ? taskSource === "local-fallback"
      ? t("source.tasksFallback")
      : inboxSource === "local-fallback"
        ? t("source.inboxFallback")
        : null
    : t("source.dashboardDevice");
  const showFirstRunGuidance =
    tasksLoaded && tasks.length === 0 && notesCount === 0 && inboxCount === 0;

  return (
    <AppShell>
      <Page>
        <PageHeader
          eyebrow={t("dashboard.eyebrow")}
          title={t("dashboard.title")}
          description={t("dashboard.description")}
          actions={
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setQuickCaptureOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden />
                {t("common.capture")}
              </Button>
              <Link
                href="/app/search"
                className="orvia-button orvia-button-primary"
              >
                <Search className="mr-2 h-4 w-4" aria-hidden />
                {t("dashboard.searchContext")}
              </Link>
            </>
          }
        />

          {dashboardBoundaryMessage ? (
            <Card
              variant={taskSource === "local-fallback" ? "secondary" : "ghost"}
              className="mt-5 p-3 text-sm text-muted"
            >
              {dashboardBoundaryMessage}
            </Card>
          ) : null}

          {showFirstRunGuidance ? (
            <Card variant="ghost" className="mt-5 overflow-hidden p-0">
              <div className="border-b border-line p-5 sm:p-6">
                <div>
                  <Badge>{t("dashboard.firstRun")}</Badge>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
                    {t("dashboard.firstRunTitle")}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                    {t("dashboard.firstRunDescription")}
                  </p>
                </div>
              </div>

              <div className="grid gap-0 divide-y divide-zinc-200/80 dark:divide-zinc-800/80 md:grid-cols-3 md:divide-x md:divide-y-0">
                {[
                  {
                    step: "1",
                    title: t("dashboard.firstRunStep1"),
                    description: t("dashboard.firstRunStep1Description"),
                  },
                  {
                    step: "2",
                    title: t("dashboard.firstRunStep2"),
                    description: t("dashboard.firstRunStep2Description"),
                  },
                  {
                    step: "3",
                    title: t("dashboard.firstRunStep3"),
                    description: t("dashboard.firstRunStep3Description"),
                  },
                ].map((item) => (
                  <div key={item.step} className="p-5 sm:p-6">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-200/70 bg-violet-50 text-sm font-semibold text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                      {item.step}
                    </span>
                    <h3 className="mt-4 text-sm font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 border-t border-line bg-subtle p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <p className="text-sm text-muted">
                  {t("dashboard.bestFirstStep")}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    onClick={() => setQuickCaptureOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" aria-hidden />
                    {t("dashboard.captureSomething")}
                  </Button>
                  <Link
                    href="/app/inbox"
                    className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-surface px-4 py-2.5 text-sm font-medium text-muted ring-1 ring-line transition hover:bg-hover hover:text-foreground hover:border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:shadow-none hover:bg-hover hover:text-foreground hover:border-line dark:focus-visible:ring-violet-400 dark:focus-visible:ring-offset-zinc-950"
                  >
                    {t("dashboard.goToInbox")}
                  </Link>
                </div>
              </div>
            </Card>
          ) : null}

          <PageSection>
            <PageSectionHeader
              title={t("dashboard.whatMatters")}
              description={t("dashboard.whatMattersDescription")}
            />
            {!tasksLoaded ? (
              <div className="grid gap-3 lg:grid-cols-3">
                {[0, 1, 2].map((item) => (
                  <Card key={item} className="min-h-48 p-4">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="mt-3 h-4 w-full" />
                    <Skeleton className="mt-5 h-16 w-full rounded-xl" />
                    <Skeleton className="mt-2 h-16 w-full rounded-xl" />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-3">
                {focusBuckets.map((bucket) => {
                  const Icon = bucket.icon;

                  return (
                    <Card
                      key={bucket.title}
                      variant="ghost"
                      className="flex min-h-48 flex-col border-t border-line px-0 py-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700 ring-1 ring-violet-200/75 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <div>
                          <h2 className="text-sm font-semibold text-foreground">
                            {bucket.title}
                          </h2>
                          <p className="mt-1 text-xs leading-5 text-muted">
                            {bucket.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex-1">
                        <TaskSignalList
                          tasks={bucket.tasks}
                          taskSources={taskSourcesById}
                          emptyTitle={bucket.emptyTitle}
                          emptyDescription={bucket.emptyDescription}
                          t={t}
                        />
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </PageSection>

          <div className="mt-7 grid gap-3 lg:grid-cols-2">
            <Card variant="ghost" className="border-t border-line px-0 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    {t("dashboard.inboxTitle")}
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-muted">
                    {inboxSource === "cloud"
                      ? t("source.savedAccount")
                      : inboxSource === "local-fallback"
                        ? t("source.inboxFallback")
                        : t("source.savedDevice")}
                  </p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700 ring-1 ring-violet-200/75 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20">
                  {inboxCount === 0 ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                  ) : (
                    <Inbox className="h-4 w-4" aria-hidden />
                  )}
                </span>
              </div>
              <div className="mt-4 border-t border-line pt-3">
                {inboxCount === 0 ? (
                  <>
                    <p className="text-sm font-semibold text-foreground">
                      {t("dashboard.inboxClear")}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {t("dashboard.nothingWaiting")}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-semibold tracking-tight text-foreground">
                      {inboxCount}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {t("dashboard.capturesReady")}
                    </p>
                  </>
                )}
              </div>
              <Link
                href="/app/inbox"
                className="mt-4 inline-flex w-fit cursor-pointer items-center justify-center rounded-lg bg-surface px-3 py-2 text-sm font-medium text-foreground ring-1 ring-line transition hover:bg-hover hover:text-foreground hover:border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:shadow-none hover:bg-hover hover:text-foreground hover:border-line dark:focus-visible:ring-violet-400 dark:focus-visible:ring-offset-zinc-950"
              >
                {t("common.openInbox")}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Card>

            <Card variant="ghost" className="border-t border-line px-0 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    {t("dashboard.findContext")}
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-muted">
                    {t("dashboard.findContextDescription")}
                  </p>
                </div>
                <Link
                  href="/app/search"
                  className="orvia-button orvia-button-primary w-fit"
                >
                  {t("dashboard.openSearch")}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </div>
              <div className="mt-4 border-t border-line pt-3">
                <p className="text-sm font-semibold text-foreground">
                  {t("dashboard.findHalfRemembered")}
                </p>
                <p className="mt-1 text-sm leading-5 text-muted">
                  {t("dashboard.findHalfRememberedDescription")}
                </p>
              </div>
            </Card>
          </div>

          <PageSection>
            <PageSectionHeader
              title={t("dashboard.recentActivity")}
              description={t("dashboard.recentActivityDescription")}
            />
            <Card variant="ghost" className="border-t border-line px-0 py-5">
              {!accessToken && !authLoading ? (
                <EmptyState
                  icon={Clock}
                  size="sm"
                  title={t("dashboard.activitySignInTitle")}
                  description={t("dashboard.activitySignInDescription")}
                />
              ) : !activityLoaded ? (
                <div
                  className="space-y-3"
                  aria-label={t("today.loadingRecentChanges")}
                >
                  {[0, 1, 2].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-line bg-surface px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-24 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="mt-3 h-4 w-48" />
                      <Skeleton className="mt-2 h-4 w-full max-w-md" />
                    </div>
                  ))}
                </div>
              ) : activityEvents.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  size="sm"
                  title={t("dashboard.noRecentActivity")}
                  description={
                    activityError ??
                    t("dashboard.noRecentActivityDescription")
                  }
                />
              ) : (
                <ul className="space-y-2">
                  {activityEvents.map((event) => (
                    <li key={event.id}>
                      <TimelineEventCard event={event} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </PageSection>

          <PageSection>
            <PageSectionHeader
              title={t("dashboard.nextAction")}
              description={t("dashboard.nextActionDescription")}
            />
            <Card variant="ghost" className="border-t border-line px-0 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    {t("dashboard.addContext")}
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm leading-5 text-muted">
                    {t("dashboard.addContextDescription")}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setQuickCaptureOpen(true)}
                  className="shrink-0"
                >
                  <Plus className="mr-2 h-4 w-4" aria-hidden />
                  {t("dashboard.captureNow")}
                </Button>
              </div>
            </Card>
          </PageSection>
      </Page>

      <QuickCapture
        accessToken={accessToken}
        ownerId={ownerId}
        open={quickCaptureOpen}
        onOpenChange={handleQuickCaptureOpenChange}
      />
    </AppShell>
  );
}
