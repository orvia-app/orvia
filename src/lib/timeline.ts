import type { Task } from "@/types";

export type TimelineEvent = {
  id: string;
  type: "task-created" | "task-completed";
  title: string;
  timestamp: string;
};

function getTimelineEventTimestamp(task: Task): string {
  return task.createdAt;
}

function sortTimelineEventsNewestFirst(
  events: readonly TimelineEvent[],
): TimelineEvent[] {
  return [...events].sort((a, b) => {
    const timestampDifference =
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();

    if (timestampDifference !== 0) {
      return timestampDifference;
    }

    return a.title.localeCompare(b.title);
  });
}

export function createTimelineEventsFromTasks(
  tasks: readonly Task[],
): TimelineEvent[] {
  const events: TimelineEvent[] = tasks
    .filter((task) => task.status !== "done")
    .map((task) => ({
      id: `${task.id}-created`,
      type: "task-created",
      title: task.title,
      timestamp: getTimelineEventTimestamp(task),
    }));

  return sortTimelineEventsNewestFirst(events);
}
