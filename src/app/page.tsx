"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  CalendarDays,
  Car,
  CheckSquare,
  FileText,
  Inbox,
  Wallet,
  Zap,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { getRecentActivityFeed } from "@/lib/activity/activity-feed";
import type { ActivityItem } from "@/lib/activity/types";
import { getStoredCars } from "@/lib/cars";
import {
  getEntityTypeLabel,
  noteToEntity,
  quickCaptureToEntity,
  taskToEntity,
} from "@/lib/entities/entity-utils";
import { getTransactions } from "@/lib/finance";
import {
  activitiesToMemoryCandidates,
  entitiesToMemoryCandidates,
  getMemoryImportanceLabel,
  getMemorySourceTypeLabel,
} from "@/lib/memory/memory-utils";
import {
  getTopRankedMemoryCandidates,
  type RankedMemoryCandidate,
} from "@/lib/memory/memory-ranking";
import {
  getEntityContextUrl,
  getLocalActiveContext,
  type EntityContext,
} from "@/lib/memory/context";
import type { MemoryCandidate } from "@/lib/memory/types";
import { getStoredNotes } from "@/lib/notes";
import { completeOnboarding, hasCompletedOnboarding } from "@/lib/onboarding";
import { getQuickCaptures } from "@/lib/quick-captures";
import { getTasks } from "@/lib/tasks";

type OverviewStats = {
  totalTasks: number;
  activeTasks: number;
  notesCount: number;
  financeCount: number;
  carsCount: number;
};

function computeOverview(): OverviewStats {
  if (typeof window === "undefined") {
    return {
      totalTasks: 0,
      activeTasks: 0,
      notesCount: 0,
      financeCount: 0,
      carsCount: 0,
    };
  }
  const taskList = getTasks();
  const notes = getStoredNotes();
  const txs = getTransactions();
  const cars = getStoredCars();
  return {
    totalTasks: taskList.length,
    activeTasks: taskList.filter((t) => t.status !== "done").length,
    notesCount: notes.length,
    financeCount: txs.length,
    carsCount: cars.length,
  };
}

const cards = [
  {
    title: "Today",
    description: "Daily focus, active work, and quick capture",
    icon: CalendarDays,
    href: "/today",
  },
  {
    title: "Inbox",
    description: "Capture anything and review local structure",
    icon: Inbox,
    href: "/inbox",
  },
  {
    title: "Tasks",
    description: "Plan, prioritize, and keep work moving",
    icon: CheckSquare,
    href: "/tasks",
  },
  {
    title: "Notes",
    description: "Knowledge, ideas, and context worth keeping",
    icon: FileText,
    href: "/notes",
  },
  {
    title: "AI Chat",
    description: "Local preview of the future assistant layer",
    icon: Brain,
    href: "/ai-chat",
  },
  {
    title: "Finance",
    description: "Income, expenses, and cashflow",
    icon: Wallet,
    href: "/finance",
  },
  {
    title: "Cars",
    description: "Maintenance, costs, and reminders",
    icon: Car,
    href: "/cars",
  },
  {
    title: "Automation",
    description: "Telegram bots and workflows",
    icon: Zap,
    href: "/automation",
  },
];

const initialOverview: OverviewStats = {
  totalTasks: 0,
  activeTasks: 0,
  notesCount: 0,
  financeCount: 0,
  carsCount: 0,
};

const overviewCardClassName =
  "rounded-2xl bg-white px-4 py-4 shadow-sm shadow-zinc-950/[0.025] ring-1 ring-zinc-200/70 dark:bg-zinc-950 dark:shadow-none dark:ring-zinc-800/70";

function formatActivityDate(value: string | undefined): string {
  if (!value) {
    return "";
  }

  const datePart = value.split("T")[0];

  return datePart || "";
}

function getMemoryExcerpt(candidate: MemoryCandidate): string {
  const content = candidate.content.trim();

  if (content.length <= 140) {
    return content;
  }

  return `${content.slice(0, 137).trim()}...`;
}

function getMemoryPreviewCandidates(
  activityItems: readonly ActivityItem[],
): RankedMemoryCandidate[] {
  const entities = [
    ...getTasks().map((task) => taskToEntity(task)),
    ...getStoredNotes().map((note) => noteToEntity(note)),
    ...getQuickCaptures().map((capture) => quickCaptureToEntity(capture)),
  ];
  const candidates = [
    ...entitiesToMemoryCandidates(entities),
    ...activitiesToMemoryCandidates(activityItems),
  ];

  return getTopRankedMemoryCandidates(candidates, 3, {
    entities,
    activities: activityItems,
  });
}

export default function Home() {
  const pathname = usePathname();
  const [stats, setStats] = useState<OverviewStats>(initialOverview);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [activityLoaded, setActivityLoaded] = useState(false);
  const [memoryCandidates, setMemoryCandidates] = useState<
    RankedMemoryCandidate[]
  >([]);
  const [activeContext, setActiveContext] = useState<EntityContext[]>([]);
  const [memoryLoaded, setMemoryLoaded] = useState(false);
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    function refresh() {
      if (typeof window === "undefined") return;
      const activityItems = getRecentActivityFeed(5).items;
      setStats(computeOverview());
      setRecentActivity(activityItems);
      setMemoryCandidates(getMemoryPreviewCandidates(activityItems));
      setActiveContext(getLocalActiveContext(4));
      setActivityLoaded(true);
      setMemoryLoaded(true);
      setShowOnboarding(!hasCompletedOnboarding());
      setOnboardingLoaded(true);
    }
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    if (pathname === "/" && typeof window !== "undefined") {
      const activityItems = getRecentActivityFeed(5).items;
      setStats(computeOverview());
      setRecentActivity(activityItems);
      setMemoryCandidates(getMemoryPreviewCandidates(activityItems));
      setActiveContext(getLocalActiveContext(4));
    }
  }, [pathname]);

  function dismissOnboarding(): void {
    completeOnboarding();
    setShowOnboarding(false);
  }

  return (
    <AppShell>
      <div className="px-4 py-6 sm:p-10">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-500 sm:text-base">
            Jump into your workspace modules.
          </p>

          {onboardingLoaded && showOnboarding ? (
            <Card className="mt-8 overflow-hidden p-0">
              <div className="border-b border-zinc-200/80 p-5 dark:border-zinc-800/80 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Badge>Start here</Badge>
                    <h2 className="mt-3 text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                      Drop anything into Archflow.
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      It helps organize captures into tasks, notes, memory, and
                      timeline so you can find and act on them later.
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
                    title: "Capture anything in Inbox",
                    description:
                      "Start with a thought, reminder, idea, car note, or research lead.",
                  },
                  {
                    step: "2",
                    title: "Turn it into a task or note",
                    description:
                      "Review the local preview and choose what gets created.",
                  },
                  {
                    step: "3",
                    title: "Find it later",
                    description:
                      "Search, Timeline, and Memory Preview keep the context visible.",
                  },
                ].map((item) => (
                  <div key={item.step} className="p-5 sm:p-6">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 text-sm font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
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

              <div className="flex flex-col gap-3 border-t border-zinc-200/80 bg-zinc-50/80 p-5 dark:border-zinc-800/80 dark:bg-zinc-900/40 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Local-first onboarding. No account, backend, or AI call is
                  required.
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
                    className="inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-zinc-950/10 transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-zinc-100 dark:text-zinc-950 dark:shadow-none dark:hover:bg-white dark:focus-visible:ring-zinc-600 dark:focus-visible:ring-offset-black"
                  >
                    Go to Inbox
                  </Link>
                </div>
              </div>
            </Card>
          ) : null}

          <Section className="mt-10">
            <SectionHeader title="System overview" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className={overviewCardClassName}>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Total tasks</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-white">
                  {stats.totalTasks}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-600">
                  Local workspace data
                </p>
              </div>
              <div className={overviewCardClassName}>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Active tasks</p>
                <p className="mt-1 text-2xl font-semibold text-violet-700 dark:text-violet-300">
                  {stats.activeTasks}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-600">
                  Not marked done
                </p>
              </div>
              <div className={overviewCardClassName}>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Notes</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-white">
                  {stats.notesCount}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-600">
                  Saved in browser
                </p>
              </div>
              <div className={overviewCardClassName}>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Finance txns</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-white">
                  {stats.financeCount}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-600">Transactions</p>
              </div>
              <div className={`${overviewCardClassName} sm:col-span-2 lg:col-span-1`}>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">Cars</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-white">
                  {stats.carsCount}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-600">Garage list</p>
              </div>
            </div>
          </Section>

          <Section className="mt-10">
            <SectionHeader
              title="Recent Activity"
              subtitle="Latest local changes across your workspace."
            />
            <Card className="p-4 sm:p-5">
              {!activityLoaded ? (
                <div className="space-y-3" aria-label="Loading recent activity">
                  {[0, 1, 2].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800/80 dark:bg-zinc-900/40"
                    >
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="mt-3 h-4 w-40" />
                      <Skeleton className="mt-2 h-4 w-full max-w-md" />
                    </div>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <EmptyState
                  title="No activity yet"
                  description="Create a task, note, capture, transaction, or car to see it here."
                />
              ) : (
                <ul className="space-y-2">
                  {recentActivity.map((item) => {
                    const occurredAt = formatActivityDate(item.occurredAt);

                    return (
                      <li
                        key={item.id}
                        className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 transition hover:border-zinc-300 hover:bg-white dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/70"
                      >
                        <div className="flex min-w-0 flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <Badge className="px-2.5 py-0.5">
                              {getEntityTypeLabel(item.entity.type)}
                            </Badge>
                            {occurredAt ? (
                              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                                {occurredAt}
                              </span>
                            ) : null}
                          </div>
                          <p className="truncate text-sm font-medium text-zinc-950 dark:text-white">
                            {item.title}
                          </p>
                          <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                            {item.subtitle}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </Section>

          <Section className="mt-10">
            <SectionHeader
              title="Active Context"
              subtitle="Deterministic local signals that are currently connected."
            />
            <Card className="p-4 sm:p-5">
              {!memoryLoaded ? (
                <div className="space-y-3" aria-label="Loading active context">
                  {[0, 1, 2].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800/80 dark:bg-zinc-900/40"
                    >
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="mt-2 h-4 w-full max-w-lg" />
                    </div>
                  ))}
                </div>
              ) : activeContext.length === 0 ? (
                <EmptyState
                  title="No active context yet"
                  description="Create tasks and notes to build connected local context."
                />
              ) : (
                <ul className="grid gap-2 md:grid-cols-2">
                  {activeContext.map((context) => (
                    <li key={context.entity.id}>
                      <Link
                        href={getEntityContextUrl(context)}
                        className="block cursor-pointer rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 transition hover:border-zinc-300 hover:bg-white dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/70"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="px-2.5 py-0.5">
                            {getEntityTypeLabel(context.entity.type)}
                          </Badge>
                          {context.labels.slice(0, 2).map((label) => (
                            <span
                              key={label}
                              className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200/80 dark:bg-zinc-950 dark:text-zinc-400 dark:ring-zinc-800"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                        <p className="mt-2 truncate text-sm font-medium text-zinc-950 dark:text-white">
                          {context.entity.title}
                        </p>
                        <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-500">
                          {context.relatedCount > 0
                            ? "Connected context"
                            : "Local context"}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </Section>

          <Section className="mt-10">
            <SectionHeader
              title="Memory Preview"
              subtitle="Source-linked context prepared for future recall."
            />
            <Card className="p-4 sm:p-5">
              {!memoryLoaded ? (
                <div className="space-y-3" aria-label="Loading memory preview">
                  {[0, 1, 2].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800/80 dark:bg-zinc-900/40"
                    >
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                      <Skeleton className="mt-3 h-4 w-48" />
                      <Skeleton className="mt-2 h-4 w-full max-w-lg" />
                    </div>
                  ))}
                </div>
              ) : memoryCandidates.length === 0 ? (
                <EmptyState
                  title="No memory candidates yet"
                  description="Create a task, note, or inbox capture to seed future recall."
                />
              ) : (
                <ul className="space-y-2">
                  {memoryCandidates.map((rankedCandidate) => {
                    const candidate = rankedCandidate.candidate;
                    const reasons = rankedCandidate.reasons.slice(0, 2);

                    return (
                      <li
                        key={candidate.id}
                        className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800/80 dark:bg-zinc-900/40"
                      >
                        <div className="flex min-w-0 flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="px-2.5 py-0.5">
                              {getMemorySourceTypeLabel(candidate.sourceType)}
                            </Badge>
                            <Badge variant="info" className="px-2.5 py-0.5">
                              {getMemoryImportanceLabel(candidate.importance)}
                            </Badge>
                            {reasons.map((reason) => (
                              <span
                                key={reason}
                                className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200/80 dark:bg-zinc-950 dark:text-zinc-400 dark:ring-zinc-800"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                          <p className="truncate text-sm font-medium text-zinc-950 dark:text-white">
                            {candidate.title}
                          </p>
                          {candidate.content ? (
                            <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                              {getMemoryExcerpt(candidate)}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </Section>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group rounded-2xl bg-white p-5 shadow-sm shadow-zinc-950/[0.025] ring-1 ring-zinc-200/70 transition hover:bg-zinc-50 hover:ring-zinc-300 dark:bg-zinc-950 dark:shadow-none dark:ring-zinc-800/70 dark:hover:bg-zinc-900/80 dark:hover:ring-zinc-700 sm:p-6"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 ring-1 ring-zinc-200/70 transition group-hover:bg-white group-hover:ring-zinc-300 dark:bg-zinc-900 dark:ring-zinc-800 dark:group-hover:bg-zinc-800 dark:group-hover:ring-zinc-700">
                    <Icon className="h-6 w-6 text-zinc-800 dark:text-zinc-100" aria-hidden />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-2xl">
                    {card.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
                    {card.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
