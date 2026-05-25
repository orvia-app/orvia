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
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { getRecentActivityFeed } from "@/lib/activity/activity-feed";
import type { ActivityItem } from "@/lib/activity/types";
import { getStoredCars } from "@/lib/cars";
import { getEntityTypeLabel } from "@/lib/entities/entity-utils";
import { getTransactions } from "@/lib/finance";
import { getStoredNotes } from "@/lib/notes";
import { getTasks } from "@/lib/tasks";
import { tasks as mockTasks } from "@/data/mock";

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
      totalTasks: mockTasks.length,
      activeTasks: mockTasks.filter((t) => t.status !== "done").length,
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
    description: "Capture and let AI route thoughts into your system",
    icon: Inbox,
    href: "/inbox",
  },
  {
    title: "Tasks",
    description: "Smart task management and prioritization",
    icon: CheckSquare,
    href: "/tasks",
  },
  {
    title: "Notes",
    description: "AI memory and knowledge storage",
    icon: FileText,
    href: "/notes",
  },
  {
    title: "AI Chat",
    description: "Second brain assistant interface",
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
  totalTasks: mockTasks.length,
  activeTasks: mockTasks.filter((t) => t.status !== "done").length,
  notesCount: 0,
  financeCount: 0,
  carsCount: 0,
};

function formatActivityDate(value: string | undefined): string {
  if (!value) {
    return "";
  }

  const datePart = value.split("T")[0];

  return datePart || "";
}

export default function Home() {
  const pathname = usePathname();
  const [stats, setStats] = useState<OverviewStats>(initialOverview);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [activityLoaded, setActivityLoaded] = useState(false);

  useEffect(() => {
    function refresh() {
      if (typeof window === "undefined") return;
      setStats(computeOverview());
      setRecentActivity(getRecentActivityFeed(5).items);
      setActivityLoaded(true);
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
      setStats(computeOverview());
      setRecentActivity(getRecentActivityFeed(5).items);
    }
  }, [pathname]);

  return (
    <AppShell>
      <div className="p-6 sm:p-10">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-500 sm:text-base">
            Jump into your workspace modules.
          </p>

          <Section className="mt-10">
            <SectionHeader title="System overview" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs text-zinc-600 dark:text-zinc-500">Total tasks</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-white">
                  {stats.totalTasks}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-600">
                  localStorage or demo seed
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs text-zinc-600 dark:text-zinc-500">Active tasks</p>
                <p className="mt-1 text-2xl font-semibold text-violet-700 dark:text-violet-300">
                  {stats.activeTasks}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-600">
                  Not marked done
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs text-zinc-600 dark:text-zinc-500">Notes</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-white">
                  {stats.notesCount}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-600">
                  Saved in browser
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs text-zinc-600 dark:text-zinc-500">Finance txns</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-white">
                  {stats.financeCount}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-600">Transactions</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 sm:col-span-2 lg:col-span-1 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs text-zinc-600 dark:text-zinc-500">Cars</p>
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
                      className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-black/30"
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
                        className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 transition dark:border-zinc-800 dark:bg-black/30"
                      >
                        <div className="flex min-w-0 flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <Badge className="px-2.5 py-0.5">
                              {getEntityTypeLabel(item.entity.type)}
                            </Badge>
                            {occurredAt ? (
                              <span className="text-xs text-zinc-500 dark:text-zinc-600">
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

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80 sm:p-8"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-200 transition group-hover:bg-zinc-300 dark:bg-zinc-800 dark:group-hover:bg-zinc-700">
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
