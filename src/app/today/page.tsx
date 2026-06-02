"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Inbox,
  ListChecks,
  Target,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchActivitiesViaApi } from "@/lib/activities-api";
import { getQuickCaptures } from "@/lib/quick-captures";
import { getTasks } from "@/lib/tasks";
import { loadTasksFromPrimarySource } from "@/lib/tasks-api";
import {
  createTimelineEventsFromActivities,
  type TimelineEvent,
} from "@/lib/timeline";
import type { Task, TaskPriority, TaskStatus } from "@/types";

const PRIORITY_RANK: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  done: "Done",
  "in-progress": "In progress",
  todo: "Todo",
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

function isOverdueTask(task: Task, todayDateKey: string): boolean {
  const dueDate = getTaskDueDateKey(task);

  return isActiveTask(task) && Boolean(dueDate) && dueDate! < todayDateKey;
}

function getTaskUrl(task: Task): string {
  const params = new URLSearchParams({
    filter: task.status,
    taskId: task.id,
  });

  return `/tasks?${params.toString()}`;
}

function formatPriority(priority: TaskPriority): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function formatTimestamp(timestamp: string): string {
  const [datePart, timePart] = timestamp.split("T");
  const timeLabel = timePart?.slice(0, 5);

  return timeLabel ? `${datePart} · ${timeLabel}` : datePart;
}

function sortForTopPriority(tasks: readonly Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const priorityDifference =
      PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];

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

function scoreFocusQueueTask(task: Task, todayDateKey: string): number {
  let score = PRIORITY_RANK[task.priority] * 10;

  if (isOverdueTask(task, todayDateKey)) {
    score += 50;
  }

  if (task.priority === "critical") {
    score += 30;
  }

  if (task.priority === "high") {
    score += 20;
  }

  if (task.status === "in-progress") {
    score += 15;
  }

  return score;
}

function sortForFocusQueue(
  tasks: readonly Task[],
  todayDateKey: string,
): Task[] {
  return [...tasks].sort((a, b) => {
    const scoreDifference =
      scoreFocusQueueTask(b, todayDateKey) -
      scoreFocusQueueTask(a, todayDateKey);

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    const aDueDate = getTaskDueDateKey(a) ?? "9999-12-31";
    const bDueDate = getTaskDueDateKey(b) ?? "9999-12-31";

    if (aDueDate !== bDueDate) {
      return aDueDate.localeCompare(bDueDate);
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

function TaskMeta({ task }: { task: Task }) {
  const dueDate = getTaskDueDateKey(task);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 ring-1 ring-zinc-200/70 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800">
        {formatPriority(task.priority)}
      </span>
      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 ring-1 ring-zinc-200/70 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800">
        {STATUS_LABELS[task.status]}
      </span>
      {dueDate ? (
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 ring-1 ring-zinc-200/70 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800">
          {dueDate}
        </span>
      ) : null}
    </div>
  );
}

function EmptyInline({
  description,
  title,
}: {
  description?: string;
  title: string;
}) {
  return (
    <div className="flex items-start gap-2.5 border-t border-zinc-200/70 pt-3 dark:border-zinc-800/70">
      <CheckCircle2
        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
        aria-hidden
      />
      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {title}
        </p>
        {description ? (
          <p className="mt-0.5 text-xs leading-5 text-zinc-500 dark:text-zinc-500">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function TodayPage() {
  const { loading: authLoading, session } = useAuthSession();
  const accessToken = session?.access_token;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [todayDateKey, setTodayDateKey] = useState("");
  const [inboxCount, setInboxCount] = useState(0);
  const [activityEvents, setActivityEvents] = useState<TimelineEvent[]>([]);
  const [activityLoaded, setActivityLoaded] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  const refreshTodayData = useCallback(async () => {
    setTasksLoaded(false);
    setActivityLoaded(false);
    setActivityError(null);

    const nextTasks = accessToken
      ? await loadTasksFromPrimarySource({ accessToken })
      : getTasks();

    setTasks(nextTasks);
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
        createTimelineEventsFromActivities(activities).slice(0, 3),
      );
    } catch {
      setActivityEvents([]);
      setActivityError("Recent changes could not be loaded.");
    } finally {
      setActivityLoaded(true);
    }
  }, [accessToken]);

  useEffect(() => {
    setTodayDateKey(getTodayDateKey());
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void refreshTodayData();

    function handleRefresh(): void {
      void refreshTodayData();
    }

    window.addEventListener("focus", handleRefresh);
    window.addEventListener("storage", handleRefresh);

    return () => {
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
    };
  }, [authLoading, refreshTodayData]);

  const activeTasks = useMemo(
    () => tasks.filter(isActiveTask),
    [tasks],
  );
  const topPriorityTask = useMemo(
    () => sortForTopPriority(activeTasks)[0],
    [activeTasks],
  );
  const focusQueue = useMemo(
    () => sortForFocusQueue(activeTasks, todayDateKey).slice(0, 5),
    [activeTasks, todayDateKey],
  );

  return (
    <AppShell>
      <div className="px-4 py-5 sm:px-8 sm:py-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl bg-white px-5 py-5 shadow-sm shadow-zinc-950/[0.025] ring-1 ring-zinc-200/70 dark:bg-zinc-950 dark:shadow-none dark:ring-zinc-800/70 sm:px-6">
            <Badge>Today</Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
              Today&apos;s plan
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-500">
              Focus on the highest-impact work first.
            </p>
          </div>

          <div className="mt-7 grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
            <div className="space-y-7">
              <Section>
                <SectionHeader
                  title="Top priority"
                  subtitle="Start here before pulling in more work."
                />
                <Card className="p-4 sm:p-5">
                  {!tasksLoaded ? (
                    <div aria-label="Loading top priority">
                      <Skeleton className="h-5 w-44" />
                      <Skeleton className="mt-3 h-4 w-full max-w-lg" />
                      <Skeleton className="mt-4 h-8 w-48" />
                    </div>
                  ) : topPriorityTask ? (
                    <Link
                      href={getTaskUrl(topPriorityTask)}
                      className="group block cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/70 dark:bg-zinc-900/70 dark:text-zinc-300 dark:ring-zinc-800">
                          <Target className="h-4 w-4" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h2 className="truncate text-base font-semibold text-zinc-950 dark:text-white">
                              {topPriorityTask.title}
                            </h2>
                            <ArrowRight
                              className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-700 dark:group-hover:text-zinc-200"
                              aria-hidden
                            />
                          </div>
                          {topPriorityTask.description ? (
                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-500 dark:text-zinc-500">
                              {topPriorityTask.description}
                            </p>
                          ) : null}
                          <TaskMeta task={topPriorityTask} />
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <EmptyInline
                      title="No urgent work today."
                      description="Add or prioritize tasks when something needs focus."
                    />
                  )}
                </Card>
              </Section>

              <Section>
                <SectionHeader
                  title="Focus queue"
                  subtitle="Up to five actionable tasks for today."
                />
                <Card className="p-0">
                  {!tasksLoaded ? (
                    <div
                      className="space-y-3 p-4"
                      aria-label="Loading focus queue"
                    >
                      {[0, 1, 2].map((item) => (
                        <div key={item}>
                          <Skeleton className="h-5 w-56" />
                          <Skeleton className="mt-2 h-4 w-full max-w-md" />
                        </div>
                      ))}
                    </div>
                  ) : focusQueue.length === 0 ? (
                    <div className="p-4">
                      <EmptyInline
                        title="No actionable tasks."
                        description="Your active task list is clear."
                      />
                    </div>
                  ) : (
                    <ul className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
                      {focusQueue.map((task, index) => (
                        <li key={task.id}>
                          <Link
                            href={getTaskUrl(task)}
                            className="group flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-900/45"
                          >
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200/70 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800">
                              {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className="truncate text-sm font-semibold text-zinc-950 dark:text-white">
                                  {task.title}
                                </p>
                                <ArrowRight
                                  className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-700 dark:group-hover:text-zinc-200"
                                  aria-hidden
                                />
                              </div>
                              <TaskMeta task={task} />
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </Section>
            </div>

            <div className="space-y-7">
              <Section>
                <SectionHeader
                  title="Inbox waiting"
                  subtitle="Captured items ready for review."
                />
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
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
                            Captures waiting.
                          </p>
                        </>
                      )}
                    </div>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/70 dark:bg-zinc-900/70 dark:text-zinc-300 dark:ring-zinc-800">
                      {inboxCount === 0 ? (
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                      ) : (
                        <Inbox className="h-4 w-4" aria-hidden />
                      )}
                    </span>
                  </div>
                  <Link
                    href="/inbox"
                    className="mt-4 inline-flex w-fit cursor-pointer items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm shadow-zinc-950/[0.03] ring-1 ring-zinc-200/80 transition hover:bg-zinc-50 hover:ring-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-zinc-950 dark:text-zinc-200 dark:shadow-none dark:ring-zinc-800 dark:hover:bg-zinc-900 dark:hover:ring-zinc-700 dark:focus-visible:ring-zinc-600 dark:focus-visible:ring-offset-black"
                  >
                    Open Inbox
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Link>
                </Card>
              </Section>

              <Section>
                <SectionHeader
                  title="Recent changes"
                  subtitle="Latest recorded activity."
                />
                <Card className="p-4">
                  {!accessToken && !authLoading ? (
                    <div className="flex items-start gap-2.5">
                      <Clock
                        className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400"
                        aria-hidden
                      />
                      <div>
                        <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                          Sign in to see changes.
                        </p>
                        <p className="mt-1 text-sm leading-5 text-zinc-500 dark:text-zinc-500">
                          Activity is recorded for authenticated workflows.
                        </p>
                      </div>
                    </div>
                  ) : !activityLoaded ? (
                    <div
                      className="space-y-3"
                      aria-label="Loading recent changes"
                    >
                      {[0, 1, 2].map((item) => (
                        <div key={item}>
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="mt-2 h-3 w-28" />
                        </div>
                      ))}
                    </div>
                  ) : activityEvents.length === 0 ? (
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400"
                        aria-hidden
                      />
                      <div>
                        <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                          No recent changes.
                        </p>
                        <p className="mt-1 text-sm leading-5 text-zinc-500 dark:text-zinc-500">
                          {activityError ??
                            "Task and note updates will appear here."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {activityEvents.map((event) => (
                        <li key={event.id}>
                          <p className="truncate text-sm font-semibold text-zinc-950 dark:text-white">
                            {event.title}
                          </p>
                          {event.description ? (
                            <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-500 dark:text-zinc-500">
                              {event.description}
                            </p>
                          ) : null}
                          <p className="mt-1 text-xs font-medium text-zinc-400 dark:text-zinc-600">
                            {formatTimestamp(event.timestamp)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </Section>

              <Section>
                <SectionHeader
                  title="End of day"
                  subtitle="A simple closeout placeholder."
                />
                <Card className="p-4">
                  <div className="flex items-start gap-2.5">
                    <ListChecks
                      className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400"
                      aria-hidden
                    />
                    <div>
                      <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                        Completed work will land here later.
                      </p>
                      <p className="mt-1 text-sm leading-5 text-zinc-500 dark:text-zinc-500">
                        Use Tasks for now to mark work done.
                      </p>
                    </div>
                  </div>
                </Card>
              </Section>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
