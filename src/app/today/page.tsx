"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useI18n } from "@/components/i18n/I18nProvider";
import { Card } from "@/components/ui/Card";
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
import type { Task, TaskPriority, TaskStatus } from "@/types";
import type { TranslationKey } from "@/lib/i18n";

function getTodayDateKey(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

function getTaskDueDateKey(task: Task): string | undefined {
  return task.dueDate?.split("T")[0];
}

function getTaskUrl(task: Task): string {
  const params = new URLSearchParams({
    filter: task.status,
    taskId: task.id,
  });

  return `/app/tasks?${params.toString()}`;
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

function statusLabelKey(status: TaskStatus): TranslationKey {
  switch (status) {
    case "in-progress":
      return "status.inProgress";
    case "done":
      return "status.done";
    case "todo":
      return "status.todo";
  }
}

function taskSourceLabelKey(source: PrimaryTaskSource): TranslationKey {
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

function formatTimestamp(timestamp: string): string {
  const [datePart, timePart] = timestamp.split("T");
  const timeLabel = timePart?.slice(0, 5);

  return timeLabel ? `${datePart} · ${timeLabel}` : datePart;
}

function TaskMeta({
  prioritizedTask,
  source,
  t,
}: {
  prioritizedTask: PrioritizedTask;
  source: PrimaryTaskSource;
  t: (key: TranslationKey) => string;
}) {
  const { reasons, task } = prioritizedTask;
  const dueDate = getTaskDueDateKey(task);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 ring-1 ring-zinc-200/70 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800">
        {t(priorityLabelKey(task.priority))}
      </span>
      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 ring-1 ring-zinc-200/70 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800">
        {t(statusLabelKey(task.status))}
      </span>
      {shouldShowTaskSource(source) ? (
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 ring-1 ring-zinc-200/70 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800">
          {t(taskSourceLabelKey(source))}
        </span>
      ) : null}
      {dueDate ? (
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 ring-1 ring-zinc-200/70 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800">
          {dueDate}
        </span>
      ) : null}
      {reasons.slice(0, 3).map((reason) => (
        <span
          key={reason}
          className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-500 ring-1 ring-zinc-200/70 dark:bg-zinc-950 dark:text-zinc-400 dark:ring-zinc-800"
        >
          {t(priorityReasonKey(reason))}
        </span>
      ))}
    </div>
  );
}

function getReasonSentence(
  reasons: readonly PriorityReason[],
  t: (key: TranslationKey) => string,
): string {
  if (reasons.length === 0) {
    return t("today.reasonDefault");
  }

  const formattedReasons = reasons.map((reason) =>
    t(priorityReasonKey(reason)).toLowerCase(),
  );

  if (formattedReasons.length === 1) {
    return t("today.reasonSingle").replace("{reason}", formattedReasons[0]);
  }

  return t("today.reasonMultiple")
    .replace("{reasons}", formattedReasons.slice(0, -1).join(", "))
    .replace("{lastReason}", formattedReasons[formattedReasons.length - 1]);
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
  const [activityEvents, setActivityEvents] = useState<TimelineEvent[]>([]);
  const [activityLoaded, setActivityLoaded] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const todayDataLoadedRef = useRef(false);
  const todayActivityLoadedRef = useRef(false);
  const todayOwnerKeyRef = useRef<string | null>(null);

  const refreshTodayData = useCallback(async () => {
    const ownerKey = ownerId ?? "signed-out";

    if (todayOwnerKeyRef.current !== ownerKey) {
      todayOwnerKeyRef.current = ownerKey;
      todayDataLoadedRef.current = false;
      todayActivityLoadedRef.current = false;
      setTasks([]);
      setInboxCount(0);
      setActivityEvents([]);
    }

    if (!todayDataLoadedRef.current) {
      setTasksLoaded(false);
    }

    if (!todayActivityLoadedRef.current) {
      setActivityLoaded(false);
    }

    setActivityError(null);

    const taskResult = await loadTasksFromPrimarySourceWithBoundary({
      accessToken,
      ownerId,
    });
    const captureResult = await loadCapturesFromPrimarySourceWithBoundary({
      accessToken,
      ownerId,
    });

    setTasks(taskResult.tasks);
    setTaskSource(taskResult.source);
    setTaskSourcesById(taskResult.taskSources);
    setInboxCount(captureResult.captures.length);
    setInboxSource(captureResult.source);
    todayDataLoadedRef.current = true;
    setTasksLoaded(true);

    if (!accessToken) {
      setActivityEvents([]);
      todayActivityLoadedRef.current = true;
      setActivityLoaded(true);
      return;
    }

    try {
      const activities = await fetchActivitiesViaApi({ accessToken });
      setActivityEvents(
        createTimelineEventsFromActivities(activities, t).slice(0, 3),
      );
    } catch {
      setActivityEvents([]);
      setActivityError(t("today.activityError"));
    } finally {
      todayActivityLoadedRef.current = true;
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

  const prioritizedTasks = useMemo(
    () =>
      todayDateKey
        ? getPrioritizedTasks(tasks, { todayDateKey })
        : [],
    [tasks, todayDateKey],
  );
  const topPriorityTask = prioritizedTasks[0];
  const focusQueue = prioritizedTasks.slice(1, 6);
  const todayBoundaryMessage = accessToken
    ? taskSource === "local-fallback"
      ? t("source.todayTasksFallback")
      : inboxSource === "local-fallback"
        ? t("source.inboxFallback")
        : null
    : t("source.todayDevice");

  return (
    <AppShell>
      <Page>
        <PageHeader
          eyebrow={t("today.eyebrow")}
          title={t("today.title")}
          description={t("today.description")}
        />

          {todayBoundaryMessage ? (
            <Card
              variant={taskSource === "local-fallback" ? "secondary" : "ghost"}
              className="mt-5 p-3 text-sm text-zinc-600 dark:text-zinc-400"
            >
              {todayBoundaryMessage}
            </Card>
          ) : null}

          <div className="mt-7 grid gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]">
            <div className="space-y-7">
              <PageSection className="mt-0">
                <PageSectionHeader
                  title={t("today.doFirst")}
                  description={t("today.doFirstDescription")}
                />
                <Card className="p-5 sm:p-6">
                  {!tasksLoaded ? (
                    <div aria-label={t("today.loadingTopPriority")}>
                      <Skeleton className="h-5 w-44" />
                      <Skeleton className="mt-3 h-4 w-full max-w-lg" />
                      <Skeleton className="mt-4 h-8 w-48" />
                    </div>
                  ) : topPriorityTask ? (
                    <Link
                      href={getTaskUrl(topPriorityTask.task)}
                      className="group block cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 ring-1 ring-violet-200/75 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20">
                          <Target className="h-4 w-4" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                                {t("today.recommendedNext")}
                              </p>
                              <h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                                {topPriorityTask.task.title}
                              </h2>
                            </div>
                            <ArrowRight
                              className="mt-1 h-4 w-4 shrink-0 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-700 dark:group-hover:text-zinc-200"
                              aria-hidden
                            />
                          </div>
                          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                            {getReasonSentence(topPriorityTask.reasons, t)}
                          </p>
                          {topPriorityTask.task.description ? (
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500 dark:text-zinc-500">
                              {topPriorityTask.task.description}
                            </p>
                          ) : null}
                          <TaskMeta
                            prioritizedTask={topPriorityTask}
                            t={t}
                            source={
                              taskSourcesById[topPriorityTask.task.id] ??
                              taskSource
                            }
                          />
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <EmptyInline
                      title={t("today.noUrgent")}
                      description={t("today.noUrgentDescription")}
                    />
                  )}
                </Card>
              </PageSection>

              <PageSection className="mt-0">
                <PageSectionHeader
                  title={t("today.focusQueue")}
                  description={t("today.focusQueueDescription")}
                />
                <Card className="p-0">
                  {!tasksLoaded ? (
                    <div
                      className="space-y-3 p-4"
                      aria-label={t("today.loadingFocusQueue")}
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
                        title={t("today.noActionable")}
                        description={t("today.noActionableDescription")}
                      />
                    </div>
                  ) : (
                    <ul className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
                      {focusQueue.map((prioritizedTask, index) => (
                        <li key={prioritizedTask.task.id}>
                          <Link
                            href={getTaskUrl(prioritizedTask.task)}
                            className="group flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-violet-50/60 dark:hover:bg-violet-500/5"
                          >
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-xs font-semibold text-violet-700 ring-1 ring-violet-200/75 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20">
                              {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className="truncate text-sm font-semibold text-zinc-950 dark:text-white">
                                  {prioritizedTask.task.title}
                                </p>
                                <ArrowRight
                                  className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-700 dark:group-hover:text-zinc-200"
                                  aria-hidden
                                />
                              </div>
                              <TaskMeta
                                prioritizedTask={prioritizedTask}
                                t={t}
                                source={
                                  taskSourcesById[prioritizedTask.task.id] ??
                                  taskSource
                                }
                              />
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </PageSection>
            </div>

            <div className="space-y-5">
              <PageSection className="mt-0">
                <PageSectionHeader
                  title={t("today.inboxWaiting")}
                  description={
                    inboxSource === "cloud"
                      ? t("source.savedAccount")
                      : inboxSource === "local-fallback"
                        ? t("source.inboxFallback")
                        : t("source.savedDevice")
                  }
                />
                <Card variant="secondary" className="p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {inboxCount === 0 ? (
                        <>
                          <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                            {t("today.inboxClear")}
                          </p>
                          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                            {t("today.nothingWaiting")}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                            {inboxCount}
                          </p>
                          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                            {t("today.capturesWaiting")}
                          </p>
                        </>
                      )}
                    </div>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700 ring-1 ring-violet-200/75 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20">
                      {inboxCount === 0 ? (
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                      ) : (
                        <Inbox className="h-4 w-4" aria-hidden />
                      )}
                    </span>
                  </div>
                  <Link
                    href="/app/inbox"
                    className="mt-3 inline-flex w-fit cursor-pointer items-center justify-center rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-800 shadow-sm shadow-zinc-950/[0.03] ring-1 ring-zinc-200/80 transition hover:bg-violet-50 hover:text-violet-800 hover:ring-violet-200/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:bg-zinc-950/60 dark:text-zinc-200 dark:shadow-none dark:ring-zinc-800 dark:hover:bg-violet-500/10 dark:hover:text-violet-200 dark:hover:ring-violet-500/25 dark:focus-visible:ring-violet-400 dark:focus-visible:ring-offset-zinc-950"
                  >
                    {t("common.openInbox")}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                  </Link>
                </Card>
              </PageSection>

              <PageSection className="mt-0">
                <PageSectionHeader
                  title={t("today.recentChanges")}
                  description={t("today.recentChangesDescription")}
                />
                <Card variant="secondary" className="p-3.5">
                  {!accessToken && !authLoading ? (
                    <div className="flex items-start gap-2.5">
                      <Clock
                        className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400"
                        aria-hidden
                      />
                      <div>
                        <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                          {t("today.signInChangesTitle")}
                        </p>
                        <p className="mt-1 text-sm leading-5 text-zinc-500 dark:text-zinc-500">
                          {t("today.signInChangesDescription")}
                        </p>
                      </div>
                    </div>
                  ) : !activityLoaded ? (
                    <div
                      className="space-y-3"
                      aria-label={t("today.loadingRecentChanges")}
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
                          {t("today.noRecentChanges")}
                        </p>
                        <p className="mt-1 text-sm leading-5 text-zinc-500 dark:text-zinc-500">
                          {activityError ??
                            t("today.noRecentChangesDescription")}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <ul className="space-y-2.5">
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
              </PageSection>

              <PageSection className="mt-0">
                <PageSectionHeader
                  title={t("today.wrapUp")}
                  description={t("today.wrapUpDescription")}
                />
                <Card variant="secondary" className="p-3.5">
                  <div className="flex items-start gap-2.5">
                    <ListChecks
                      className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400"
                      aria-hidden
                    />
                    <div>
                      <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                        {t("today.wrapUpTitle")}
                      </p>
                      <p className="mt-1 text-sm leading-5 text-zinc-500 dark:text-zinc-500">
                        {t("today.wrapUpBody")}
                      </p>
                    </div>
                  </div>
                </Card>
              </PageSection>
            </div>
          </div>
      </Page>
    </AppShell>
  );
}
