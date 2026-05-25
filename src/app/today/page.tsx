"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Sparkles } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { getDailyBriefing, type DailyBriefing } from "@/lib/briefing";
import { createQuickCapture } from "@/lib/quick-captures";
import { getTasks } from "@/lib/tasks";
import { tasks as mockTasks } from "@/data/mock";
import type { Task, TaskPriority } from "@/types";

const PRIORITY_RANK: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function sortByPriorityDesc(a: Task, b: Task): number {
  return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
}

const AI_SUGGESTIONS = [
  "Start with the highest-priority work item.",
  "Clear small admin tasks after deep work.",
  "Review finance and car reminders once per day.",
] as const;

const initialBriefing: DailyBriefing = {
  overdueTasks: [],
  todayTasks: [],
  recentNotes: [],
  recentCaptures: [],
};

export default function TodayPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [briefing, setBriefing] = useState<DailyBriefing>(initialBriefing);
  const [hydrated, setHydrated] = useState(false);
  const [captureText, setCaptureText] = useState("");
  const [captureSuccess, setCaptureSuccess] = useState(false);

  useEffect(() => {
    setTasks(getTasks());
    setBriefing(getDailyBriefing());
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
    if (!text) return;
    try {
      createQuickCapture({
        id: Date.now().toString(),
        text,
        createdAt: new Date().toISOString(),
      });
      setBriefing(getDailyBriefing());
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
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 shadow-sm shadow-violet-950/[0.03] dark:border-violet-500/20 dark:bg-violet-500/10 dark:shadow-none">
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
            <div className="space-y-8 lg:col-span-2">
              <Section>
                <SectionHeader
                  title="Focus Plan"
                  subtitle="Top three open items by priority."
                />
                <div className="space-y-3">
                  {focusPlan.length === 0 ? (
                    hydrated ? (
                      <EmptyState
                        title="No focus items"
                        description="Add tasks or clear done work to shape today's plan."
                      />
                    ) : (
                      <Card className="space-y-3">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-full max-w-md" />
                      </Card>
                    )
                  ) : (
                    focusPlan.map((task, i) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-950/[0.03] dark:border-zinc-800/80 dark:bg-zinc-950 dark:shadow-none sm:p-5"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-sm font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
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
                            <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                              {task.priority}
                            </span>
                            <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                              {task.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Section>

              <Section>
                <SectionHeader
                  title="Overdue / Active"
                  subtitle="Everything still in motion."
                />
                <div className="space-y-2">
                  {nonDone.length === 0 ? (
                    <EmptyState
                      title="All caught up"
                      description="No active tasks are waiting right now."
                    />
                  ) : (
                    nonDone.map((task) => (
                      <div
                        key={task.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-white px-4 py-3 shadow-sm shadow-zinc-950/[0.02] dark:border-zinc-800/80 dark:bg-zinc-950/80 dark:shadow-none"
                      >
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {task.title}
                        </span>
                        <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                          {task.priority} · {task.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </Section>
            </div>

            <div className="space-y-8">
              <Section>
                <Card className="p-5 sm:p-6">
                  <SectionHeader
                    title="Daily Briefing"
                    subtitle="A local snapshot of what needs attention."
                  />

                  {!hydrated ? (
                    <div
                      className="mt-5 space-y-4"
                      aria-label="Loading daily briefing"
                    >
                      {[0, 1, 2, 3].map((item) => (
                        <div key={item} className="space-y-2">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 space-y-6">
                      <div>
                        <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                          Overdue tasks
                        </h3>
                        {briefing.overdueTasks.length === 0 ? (
                          <EmptyState
                            size="sm"
                            title="Nothing overdue"
                            description="Your task deadlines are clear."
                          />
                        ) : (
                          <ul className="mt-2 space-y-2">
                            {briefing.overdueTasks.slice(0, 3).map((task) => (
                              <li
                                key={task.id}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                              >
                                {task.title}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div>
                        <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                          Today tasks
                        </h3>
                        {briefing.todayTasks.length === 0 ? (
                          <EmptyState
                            size="sm"
                            title="No due dates today"
                            description="Nothing scheduled for today yet."
                          />
                        ) : (
                          <ul className="mt-2 space-y-2">
                            {briefing.todayTasks.slice(0, 3).map((task) => (
                              <li
                                key={task.id}
                                className="rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-200"
                              >
                                {task.title}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div>
                        <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                          Recent notes
                        </h3>
                        {briefing.recentNotes.length === 0 ? (
                          <EmptyState
                            size="sm"
                            title="No notes yet"
                            description="Capture a note to include it here."
                          />
                        ) : (
                          <ul className="mt-2 space-y-2">
                            {briefing.recentNotes.slice(0, 3).map((note) => (
                              <li
                                key={note.id}
                                className="rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800/80 dark:bg-zinc-900/40"
                              >
                                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                  {note.title}
                                </p>
                                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                                  {note.type}
                                </p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div>
                        <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                          Recent captures
                        </h3>
                        {briefing.recentCaptures.length === 0 ? (
                          <EmptyState
                            size="sm"
                            title="No captures yet"
                            description="Send a quick thought to Inbox."
                          />
                        ) : (
                          <ul className="mt-2 space-y-2">
                            {briefing.recentCaptures
                              .slice(0, 3)
                              .map((capture) => (
                                <li
                                  key={capture.id}
                                  className="rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:text-zinc-200"
                                >
                                  {capture.text}
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              </Section>

              <Section>
                <Card className="p-5 sm:p-6">
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
                </Card>
              </Section>

              <Section>
                <Card className="p-5 sm:p-6">
                  <SectionHeader
                    title="Quick Capture"
                    subtitle={
                      <>
                        Stash a thought; process it later from{" "}
                        <Link
                          href="/inbox"
                          className="text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
                        >
                          Inbox
                        </Link>
                        .
                      </>
                    }
                  />
                  <textarea
                    value={captureText}
                    onChange={(e) => setCaptureText(e.target.value)}
                    rows={4}
                    placeholder="Quick thought, reminder, or link…"
                    className="mt-4 w-full resize-y rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 shadow-sm shadow-zinc-950/[0.02] placeholder:text-zinc-500 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200 dark:border-zinc-800 dark:bg-black dark:text-white dark:shadow-none dark:placeholder:text-zinc-600 dark:focus:border-violet-500/35 dark:focus:ring-violet-500/15"
                  />
                  <button
                    type="button"
                    onClick={sendToInbox}
                    disabled={!captureText.trim()}
                    className="mt-3 w-full rounded-xl bg-zinc-950 py-2.5 text-sm font-semibold text-white shadow-sm shadow-zinc-950/10 transition hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-950 dark:shadow-none dark:hover:bg-white"
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
                </Card>
              </Section>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
