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
import { getWorkspaceLabel } from "@/lib/workspaces/workspaces";

type TimelineGroup = {
  dateLabel: string;
  items: ActivityItem[];
};

function getTimelineDateLabel(value: string | undefined): string {
  if (!value) {
    return "No date";
  }

  return value.split("T")[0] || "No date";
}

function groupTimelineItems(items: readonly ActivityItem[]): TimelineGroup[] {
  const groups = new Map<string, ActivityItem[]>();

  items.forEach((item) => {
    const dateLabel = getTimelineDateLabel(item.occurredAt);
    const currentItems = groups.get(dateLabel) ?? [];
    groups.set(dateLabel, [...currentItems, item]);
  });

  return Array.from(groups.entries()).map(([dateLabel, groupItems]) => ({
    dateLabel,
    items: groupItems,
  }));
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

function TimelineItem({ item }: { item: ActivityItem }) {
  const Icon = getActivityIcon(item);
  const timeLabel = getActivityTimeLabel(item.occurredAt);

  return (
    <li className="relative pl-9">
      <span className="absolute left-0 top-1 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <Card className="p-4 sm:p-5">
        <div className="flex min-w-0 flex-col gap-3">
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
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
              {item.title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {item.subtitle}
            </p>
          </div>
          <Link
            href={item.entity.url}
            className="cursor-pointer text-sm font-medium text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
          >
            Open {item.entity.title}
          </Link>
        </div>
      </Card>
    </li>
  );
}

export default function TimelinePage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItems(getTimelineActivityFeed(100).items);
    setLoaded(true);
  }, []);

  const groups = useMemo(() => groupTimelineItems(items), [items]);

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
              <div className="space-y-8">
                {groups.map((group) => (
                  <Section key={group.dateLabel}>
                    <SectionHeader
                      title={group.dateLabel}
                      subtitle={`${group.items.length} event${
                        group.items.length === 1 ? "" : "s"
                      }`}
                    />
                    <ol className="space-y-3 border-l border-zinc-200 pl-4 dark:border-zinc-800">
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
