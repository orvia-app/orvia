"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { completeOnboarding, hasCompletedOnboarding } from "@/lib/onboarding";
import { getQuickCaptures } from "@/lib/quick-captures";
import {
  loadTasksFromPrimarySourceWithBoundary,
  type PrimaryTaskSource,
  type TaskSourceById,
} from "@/lib/tasks-api";
import {
  createTimelineEventsFromActivities,
  type TimelineEvent,
} from "@/lib/timeline";
import type { Task, TaskPriority } from "@/types";

type FocusBucket = {
  description: string;
  emptyDescription: string;
  emptyTitle: string;
  icon: typeof TriangleAlert;
  tasks: Task[];
  title: string;
};

const priorityRank: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
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

function isActiveTask(task: Task): boolean {
  return task.status !== "done";
}

function isHighPriorityTask(task: Task): boolean {
  return (
    isActiveTask(task) &&
    (task.priority === "critical" || task.priority === "high")
  );
}

function sortByPriorityAndDate(tasks: readonly Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const priorityDifference =
      priorityRank[b.priority] - priorityRank[a.priority];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    const aDueDate = getTaskDueDateKey(a) ?? "9999-12-31";
    const bDueDate = getTaskDueDateKey(b) ?? "9999-12-31";

    if (aDueDate !== bDueDate) {
      return aDueDate.localeCompare(bDueDate);
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

function getTaskFilterUrl(task: Task): string {
  const params = new URLSearchParams({
    filter: task.status,
    taskId: task.id,
  });

  return `/tasks?${params.toString()}`;
}

function formatTaskStatus(status: Task["status"]): string {
  switch (status) {
    case "in-progress":
      return "In progress";
    case "done":
      return "Done";
    case "todo":
      return "Todo";
  }
}

function formatTaskPriority(priority: TaskPriority): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function taskSourceLabel(source: PrimaryTaskSource): string {
  if (source === "cloud") {
    return "Cloud";
  }

  if (source === "local-fallback") {
    return "Local fallback";
  }

  return "Local only";
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
    <div className="border-t border-zinc-200/70 pt-3 dark:border-zinc-800/70">
      <div className="flex items-start gap-2.5">
        <Icon
          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {title}
          </p>
          <p className="mt-0.5 text-xs leading-5 text-zinc-500 dark:text-zinc-500">
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
}: {
  emptyDescription: string;
  emptyTitle: string;
  taskSources: TaskSourceById;
  tasks: Task[];
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
      {tasks.slice(0, 4).map((task) => {
        const dueDate = getTaskDueDateKey(task);

        return (
          <li key={task.id}>
            <Link
              href={getTaskFilterUrl(task)}
              className="group block cursor-pointer rounded-xl bg-zinc-50/85 px-3.5 py-3 ring-1 ring-zinc-200/70 transition hover:bg-white hover:ring-zinc-300 dark:bg-zinc-900/45 dark:ring-zinc-800/70 dark:hover:bg-zinc-900 dark:hover:ring-zinc-700"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-950 dark:text-white">
                    {task.title}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-500 ring-1 ring-zinc-200/70 dark:bg-zinc-950 dark:text-zinc-400 dark:ring-zinc-800">
                      {formatTaskPriority(task.priority)}
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-500 ring-1 ring-zinc-200/70 dark:bg-zinc-950 dark:text-zinc-400 dark:ring-zinc-800">
                      {formatTaskStatus(task.status)}
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-500 ring-1 ring-zinc-200/70 dark:bg-zinc-950 dark:text-zinc-400 dark:ring-zinc-800">
                      {taskSourceLabel(taskSources[task.id] ?? "local-only")}
                    </span>
                    {dueDate ? (
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-500 ring-1 ring-zinc-200/70 dark:bg-zinc-950 dark:text-zinc-400 dark:ring-zinc-800">
                        {dueDate}
                      </span>
                    ) : null}
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
  const accessToken = session?.access_token;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskSource, setTaskSource] = useState<PrimaryTaskSource>("local-only");
  const [taskSourcesById, setTaskSourcesById] = useState<TaskSourceById>({});
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [todayDateKey, setTodayDateKey] = useState("");
  const [inboxCount, setInboxCount] = useState(0);
  const [activityEvents, setActivityEvents] = useState<TimelineEvent[]>([]);
  const [activityLoaded, setActivityLoaded] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const refreshDashboardData = useCallback(async () => {
    setTasksLoaded(false);
    setActivityLoaded(false);
    setActivityError(null);

    const taskResult = await loadTasksFromPrimarySourceWithBoundary({
      accessToken,
    });

    setTasks(taskResult.tasks);
    setTaskSource(taskResult.source);
    setTaskSourcesById(taskResult.taskSources);
    setInboxCount(getQuickCaptures().length);
    setTasksLoaded(true);

    if (!accessToken) {
      setActivityEvents([]);
      setActivityLoaded(true);
      return;
    }

    try {
      const activities = await fetchActivitiesViaApi({ accessToken });
      setActivityEvents(
        createTimelineEventsFromActivities(activities).slice(0, 5),
      );
    } catch {
      setActivityEvents([]);
      setActivityError("Recent activity could not be loaded.");
    } finally {
      setActivityLoaded(true);
    }
  }, [accessToken]);

  useEffect(() => {
    setTodayDateKey(getTodayDateKey());
    setShowOnboarding(!hasCompletedOnboarding());
    setOnboardingLoaded(true);
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
    const activeTasks = tasks.filter(isActiveTask);
    const overdueTasks = todayDateKey
      ? activeTasks.filter((task) => {
          const dueDate = getTaskDueDateKey(task);

          return dueDate ? dueDate < todayDateKey : false;
        })
      : [];
    const todayTasks = todayDateKey
      ? activeTasks.filter((task) => getTaskDueDateKey(task) === todayDateKey)
      : [];

    return [
      {
        title: "High priority",
        description: "Open high-priority tasks.",
        emptyTitle: "No urgent tasks today.",
        emptyDescription: "High-priority work will appear here.",
        icon: TriangleAlert,
        tasks: sortByPriorityAndDate(activeTasks.filter(isHighPriorityTask)),
      },
      {
        title: "Overdue",
        description: "Tasks with past due dates.",
        emptyTitle: "Nothing overdue.",
        emptyDescription: "No past-due work needs attention.",
        icon: Clock,
        tasks: sortByPriorityAndDate(overdueTasks),
      },
      {
        title: "Due today",
        description: "Tasks scheduled for today.",
        emptyTitle: "Nothing due today.",
        emptyDescription: "Your dated task lane is clear.",
        icon: CheckCircle2,
        tasks: sortByPriorityAndDate(todayTasks),
      },
    ];
  }, [tasks, todayDateKey]);

  function dismissOnboarding(): void {
    completeOnboarding();
    setShowOnboarding(false);
  }

  function handleQuickCaptureOpenChange(open: boolean): void {
    setQuickCaptureOpen(open);

    if (!open && !authLoading) {
      void refreshDashboardData();
    }
  }

  const dashboardBoundaryMessage = accessToken
    ? taskSource === "local-fallback"
      ? "Cloud tasks could not load, so Dashboard is showing local fallback data from this browser."
      : "Tasks are cloud-primary. Inbox count is still local-only on this browser."
    : "Local-only mode. Dashboard uses browser data until you sign in.";

  return (
    <AppShell>
      <Page>
        <PageHeader
          eyebrow="Daily focus"
          title="Priorities, context, and what changed."
          description="See what needs attention, clear captured context, and decide the next action."
          actions={
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setQuickCaptureOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden />
                Capture
              </Button>
              <Link
                href="/search"
                className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-violet-800 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-violet-950/15 transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:bg-violet-600/85 dark:text-white dark:shadow-none dark:hover:bg-violet-600 dark:focus-visible:ring-violet-400 dark:focus-visible:ring-offset-zinc-950"
              >
                <Search className="mr-2 h-4 w-4" aria-hidden />
                Search context
              </Link>
            </>
          }
        />

          <Card
            variant={taskSource === "local-fallback" ? "secondary" : "ghost"}
            className="mt-5 p-3 text-sm text-zinc-600 dark:text-zinc-400"
          >
            {dashboardBoundaryMessage}
          </Card>

          {onboardingLoaded && showOnboarding ? (
            <Card className="mt-5 overflow-hidden p-0">
              <div className="border-b border-zinc-200/80 p-5 dark:border-zinc-800/80 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Badge>Start here</Badge>
                    <h2 className="mt-3 text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                      Drop anything into Orvia.
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      Capture scattered thoughts, turn them into tasks or
                      notes, then find the context later through Search and
                      Timeline.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={dismissOnboarding}
                    className="self-start"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>

              <div className="grid gap-0 divide-y divide-zinc-200/80 dark:divide-zinc-800/80 md:grid-cols-3 md:divide-x md:divide-y-0">
                {[
                  {
                    step: "1",
                    title: "Capture anything",
                    description:
                      "Send a thought, reminder, idea, or research lead into Inbox.",
                  },
                  {
                    step: "2",
                    title: "Organize into action",
                    description:
                      "Convert captures into tasks or notes when you are ready.",
                  },
                  {
                    step: "3",
                    title: "Recall the context",
                    description:
                      "Use Search and Timeline to understand what changed.",
                  },
                ].map((item) => (
                  <div key={item.step} className="p-5 sm:p-6">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-200/70 bg-violet-50 text-sm font-semibold text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                      {item.step}
                    </span>
                    <h3 className="mt-4 text-sm font-semibold text-zinc-950 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 border-t border-zinc-200/80 bg-zinc-50/80 p-5 dark:border-zinc-800/80 dark:bg-zinc-950/35 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Local-first onboarding. Cloud sync only runs when explicitly
                  supported by signed-in workflows.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={dismissOnboarding}
                  >
                    Dismiss
                  </Button>
                  <Link
                    href="/inbox"
                    className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-violet-800 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-violet-950/15 transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:bg-violet-600/85 dark:text-white dark:shadow-none dark:hover:bg-violet-600 dark:focus-visible:ring-violet-400 dark:focus-visible:ring-offset-zinc-950"
                  >
                    Go to Inbox
                  </Link>
                </div>
              </div>
            </Card>
          ) : null}

          <PageSection>
            <PageSectionHeader
              title="What matters today"
              description="Priority, overdue, and due-today work."
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
                      className="flex min-h-48 flex-col p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700 ring-1 ring-violet-200/75 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <div>
                          <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">
                            {bucket.title}
                          </h2>
                          <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-500">
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
                        />
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </PageSection>

          <div className="mt-7 grid gap-3 lg:grid-cols-2">
            <Card className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
                    Inbox
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-zinc-500 dark:text-zinc-500">
                    Local-only captures waiting for review.
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
              <div className="mt-4 border-t border-zinc-200/70 pt-3 dark:border-zinc-800/70">
                {inboxCount === 0 ? (
                  <>
                    <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                      Inbox clear
                    </p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                      Nothing waiting for review.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                      {inboxCount}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                      Captures ready for review.
                    </p>
                  </>
                )}
              </div>
              <Link
                href="/inbox"
                className="mt-4 inline-flex w-fit cursor-pointer items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm shadow-zinc-950/[0.03] ring-1 ring-zinc-200/80 transition hover:bg-violet-50 hover:text-violet-800 hover:ring-violet-200/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:bg-zinc-950/60 dark:text-zinc-200 dark:shadow-none dark:ring-zinc-800 dark:hover:bg-violet-500/10 dark:hover:text-violet-200 dark:hover:ring-violet-500/25 dark:focus-visible:ring-violet-400 dark:focus-visible:ring-offset-zinc-950"
              >
                Open Inbox
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Card>

            <Card className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
                    Find context
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-zinc-500 dark:text-zinc-500">
                    Search cloud tasks/activity plus local notes and captures.
                  </p>
                </div>
                <Link
                  href="/search"
                  className="inline-flex w-fit shrink-0 cursor-pointer items-center justify-center rounded-lg bg-violet-800 px-3 py-2 text-sm font-medium text-white shadow-sm shadow-violet-950/15 transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:bg-violet-600/85 dark:text-white dark:shadow-none dark:hover:bg-violet-600 dark:focus-visible:ring-violet-400 dark:focus-visible:ring-offset-zinc-950"
                >
                  Open Search
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </div>
              <div className="mt-4 border-t border-zinc-200/70 pt-3 dark:border-zinc-800/70">
                <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                  Find the thing you half-remember.
                </p>
                <p className="mt-1 text-sm leading-5 text-zinc-500 dark:text-zinc-500">
                  Jump into saved notes, tasks, captures, and recent changes.
                </p>
              </div>
            </Card>
          </div>

          <PageSection>
            <PageSectionHeader
              title="Recent activity"
              description="Latest recorded task, note, and import events."
            />
            <Card className="p-4">
              {!accessToken && !authLoading ? (
                <EmptyState
                  icon={Clock}
                  size="sm"
                  title="Activity appears after sign in."
                  description="Once authenticated, task and note changes are recorded here so the dashboard can show recent changes."
                />
              ) : !activityLoaded ? (
                <div className="space-y-3" aria-label="Loading recent activity">
                  {[0, 1, 2].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-zinc-200/80 bg-white/70 px-4 py-3 dark:border-zinc-800/80 dark:bg-zinc-900/45"
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
                  title="No recent activity yet."
                  description={
                    activityError ??
                    "Create or update a task or note to start your activity feed."
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
              title="Next action"
              description="Capture something before it turns into overhead."
            />
            <Card className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-zinc-950 dark:text-white">
                    Add the next piece of context.
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm leading-5 text-zinc-500 dark:text-zinc-500">
                    Create a task or note without leaving the dashboard.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setQuickCaptureOpen(true)}
                  className="shrink-0"
                >
                  <Plus className="mr-2 h-4 w-4" aria-hidden />
                  Capture now
                </Button>
              </div>
            </Card>
          </PageSection>
      </Page>

      <QuickCapture
        accessToken={accessToken}
        open={quickCaptureOpen}
        onOpenChange={handleQuickCaptureOpenChange}
      />
    </AppShell>
  );
}
