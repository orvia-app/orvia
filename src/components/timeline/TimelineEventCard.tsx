"use client";

import {
  CheckSquare,
  CircleDot,
  FileText,
  Inbox,
  RefreshCw,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/Card";
import type { TimelineEvent } from "@/lib/timeline";

type TimelineEventCardProps = {
  event: TimelineEvent;
  timestampLabel?: string;
};

function getEventIcon(event: TimelineEvent): LucideIcon {
  switch (event.type) {
    case "task_created":
    case "task_updated":
    case "task_completed":
      return CheckSquare;
    case "note_created":
    case "note_updated":
      return FileText;
    case "quick_capture_created":
    case "inbox_processed":
      return Inbox;
    case "task_deleted":
    case "note_deleted":
      return Trash2;
    case "local_import_completed":
      return RefreshCw;
    default:
      return CircleDot;
  }
}

function getFallbackTimestampLabel(timestamp: string): string {
  const [datePart, timePart] = timestamp.split("T");
  const timeLabel = timePart?.slice(0, 5);

  return timeLabel ? `${datePart} · ${timeLabel}` : datePart;
}

export function TimelineEventCard({
  event,
  timestampLabel,
}: TimelineEventCardProps) {
  const Icon = getEventIcon(event);
  const displayTimestamp =
    timestampLabel ?? getFallbackTimestampLabel(event.timestamp);

  return (
    <Card variant="row" className="orvia-item py-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-subtle text-muted">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <h3 className="min-w-0 break-words text-sm font-semibold text-foreground">
              {event.title}
            </h3>
            <time
              dateTime={event.timestamp}
              className="shrink-0 whitespace-nowrap text-xs font-medium text-muted"
            >
              {displayTimestamp}
            </time>
          </div>
          {event.description ? (
            <p className="mt-1 text-sm leading-5 text-muted">
              {event.description}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
