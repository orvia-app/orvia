import { CheckCircle2, CheckSquare } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { TimelineEvent } from "@/lib/timeline";

type TimelineEventCardProps = {
  event: TimelineEvent;
};

function getEventLabel(event: TimelineEvent): string {
  switch (event.type) {
    case "task-created":
      return "Task created";
    case "task-completed":
      return "Task completed";
  }
}

function getEventTimestampLabel(timestamp: string): string {
  const [datePart, timePart] = timestamp.split("T");
  const timeLabel = timePart?.slice(0, 5);

  return timeLabel ? `${datePart} · ${timeLabel}` : datePart;
}

export function TimelineEventCard({ event }: TimelineEventCardProps) {
  const Icon = event.type === "task-completed" ? CheckCircle2 : CheckSquare;

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/70 dark:bg-zinc-900/70 dark:text-zinc-300 dark:ring-zinc-800">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{getEventLabel(event)}</Badge>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
              {getEventTimestampLabel(event.timestamp)}
            </span>
          </div>
          <h3 className="mt-2 truncate text-sm font-semibold text-zinc-950 dark:text-white">
            {event.title}
          </h3>
        </div>
      </div>
    </Card>
  );
}
