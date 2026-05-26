"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Car,
  CheckSquare,
  CircleDot,
  FileText,
  Inbox,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getTimelineActivityFeed } from "@/lib/activity/activity-feed";
import { getActivityEventLabel } from "@/lib/activity/activity-utils";
import type { ActivityItem } from "@/lib/activity/types";
import { getRelatedEntityCountFromActivity } from "@/lib/memory/memory-relations";
import { getWorkspaceLabel } from "@/lib/workspaces/workspaces";

type TimelineGroupKey = "today" | "recent" | "earlier";

type TimelineGroup = {
  key: TimelineGroupKey;
  title: string;
  subtitle: string;
  items: ActivityItem[];
};

const TIMELINE_GROUPS: readonly Omit<TimelineGroup, "items">[] = [
  {
    key: "today",
    title: "Today",
    subtitle: "Context created or updated today.",
  },
  {
    key: "recent",
    title: "Recent",
    subtitle: "Signals from the last seven days.",
  },
  {
    key: "earlier",
    title: "Earlier",
    subtitle: "Older local context kept in your timeline.",
  },
] as const;

const RECENT_WINDOW_MS = 1000 * 60 * 60 * 24 * 7;

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getTimelineGroupKey(
  value: string | undefined,
  now: Date,
): TimelineGroupKey {
  if (!value) {
    return "earlier";
  }

  const date = new Date(value);
  const time = date.getTime();

  if (Number.isNaN(time)) {
    return "earlier";
  }

  if (isSameLocalDay(date, now)) {
    return "today";
  }

  if (Math.max(0, now.getTime() - time) <= RECENT_WINDOW_MS) {
    return "recent";
  }

  return "earlier";
}

function groupTimelineItems(
  items: readonly ActivityItem[],
  nowIso: string,
): TimelineGroup[] {
  const now = new Date(nowIso);
  const groups = new Map<TimelineGroupKey, ActivityItem[]>();

  items.forEach((item) => {
    const groupKey = getTimelineGroupKey(item.occurredAt, now);
    const currentItems = groups.get(groupKey) ?? [];
    groups.set(groupKey, [...currentItems, item]);
  });

  return TIMELINE_GROUPS.map((group) => ({
    ...group,
    items: groups.get(group.key) ?? [],
  })).filter((group) => group.items.length > 0);
}

function getActivityIcon(item: ActivityItem): LucideIcon {
  switch (item.eventType) {
    case "task_created":
    case "task_updated":
      return CheckSquare;
    case "note_created":
    case "note_updated":
      return FileText;
    case "finance_transaction_created":
      return Wallet;
    case "car_added":
      return Car;
    case "inbox_item_created":
      return Inbox;
  }
}

function getActivityTimeLabel(value: string | undefined): string {
  if (!value) {
    return "";
  }

  const timePart = value.split("T")[1]?.slice(0, 5);

  return timePart ?? "";
}

function getActivityImportanceLabel(item: ActivityItem): string {
  const text = `${item.title} ${item.subtitle}`.toLowerCase();

  if (
    text.includes("critical") ||
    text.includes("urgent") ||
    text.includes("high")
  ) {
    return "High signal";
  }

  if (item.eventType === "inbox_item_created") {
    return "Low signal";
  }

  return "Medium signal";
}

function TimelineItem({ item }: { item: ActivityItem }) {
  const Icon = getActivityIcon(item);
  const timeLabel = getActivityTimeLabel(item.occurredAt);
  const relatedEntityCount = getRelatedEntityCountFromActivity(item);

  return (
    <li className="relative pl-9">
      <span className="absolute left-0 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm shadow-zinc-950/[0.03] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:shadow-none">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <Link href={item.entity.url} className="group block cursor-pointer">
        <Card className="p-4 transition group-hover:border-zinc-300 group-hover:bg-zinc-50/80 dark:group-hover:border-zinc-700 dark:group-hover:bg-zinc-900/70">
          <div className="flex min-w-0 flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{getActivityEventLabel(item.eventType)}</Badge>
              {timeLabel ? (
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                  {timeLabel}
                </span>
              ) : null}
              {item.metadata.workspaceId ? (
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                  {getWorkspaceLabel(item.metadata.workspaceId)}
                </span>
              ) : null}
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                {getActivityImportanceLabel(item)}
              </span>
              {relatedEntityCount > 0 ? (
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                  {relatedEntityCount} related
                </span>
              ) : null}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                {item.title}
              </h3>
              <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {item.subtitle}
              </p>
            </div>
            <span className="text-xs font-medium text-zinc-500 transition group-hover:text-zinc-800 dark:text-zinc-500 dark:group-hover:text-zinc-200">
              Open {item.entity.title}
            </span>
          </div>
        </Card>
      </Link>
    </li>
  );
}

export default function TimelinePage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadedAt, setLoadedAt] = useState("");

  useEffect(() => {
    setItems(getTimelineActivityFeed(100).items);
    setLoadedAt(new Date().toISOString());
    setLoaded(true);
  }, []);

  const groups = useMemo(
    () => (loadedAt ? groupTimelineItems(items, loadedAt) : []),
    [items, loadedAt],
  );

  return (
    <AppShell>
      <main className="p-6 sm:p-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-800 shadow-sm shadow-zinc-950/[0.03] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:shadow-none">
              <CircleDot className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                Timeline
              </h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-500 sm:text-base">
                Chronological activity across your local workspace.
              </p>
            </div>
          </div>

          <div className="mt-10">
            {!loaded ? (
              <Card className="text-sm text-zinc-500 dark:text-zinc-400">
                Loading timeline...
              </Card>
            ) : groups.length === 0 ? (
              <EmptyState
                title="No timeline activity yet"
                description="Create a task, note, transaction, car, or inbox capture to start your timeline."
              />
            ) : (
              <div className="space-y-7">
                {groups.map((group) => (
                  <Section key={group.key}>
                    <SectionHeader
                      title={group.title}
                      subtitle={`${group.items.length} event${
                        group.items.length === 1 ? "" : "s"
                      } · ${group.subtitle}`}
                    />
                    <ol className="space-y-2.5 border-l border-zinc-200/80 pl-4 dark:border-zinc-800/80">
                      {group.items.map((item) => (
                        <TimelineItem key={item.id} item={item} />
                      ))}
                    </ol>
                  </Section>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
