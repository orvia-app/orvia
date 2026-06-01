import type { Activity } from "@/lib/activities-api";

export type TimelineEvent = {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
};

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

export function createTimelineEventsFromActivities(
  activities: readonly Activity[],
): TimelineEvent[] {
  const events = activities.map((activity) => ({
    id: activity.id,
    type: activity.type,
    title: activity.title,
    description: activity.description,
    timestamp: activity.occurredAt,
  }));

  return sortTimelineEventsNewestFirst(events);
}
