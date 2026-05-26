import { entityToActivityItems } from "@/lib/activity/activity-utils";
import { getStoredCars } from "@/lib/cars";
import { getTransactions } from "@/lib/finance";
import { getStoredNotes } from "@/lib/notes";
import { getQuickCaptures } from "@/lib/quick-captures";
import { getStoredTasks } from "@/lib/tasks";
import {
  carToEntity,
  noteToEntity,
  quickCaptureToEntity,
  taskToEntity,
  transactionToEntity,
} from "@/lib/entities/entity-utils";
import type {
  ActivityFeedPage,
  ActivityEventType,
  ActivityFilter,
  ActivityItem,
  ActivityPagination,
  ActivitySourceEntity,
} from "@/lib/activity/types";

function getActivityTime(item: ActivityItem): number {
  if (!item.occurredAt) {
    return 0;
  }

  const time = new Date(item.occurredAt).getTime();

  return Number.isNaN(time) ? 0 : time;
}

export function compareActivitiesDesc(
  a: ActivityItem,
  b: ActivityItem,
): number {
  const timeDifference = getActivityTime(b) - getActivityTime(a);

  if (timeDifference !== 0) {
    return timeDifference;
  }

  return a.id.localeCompare(b.id);
}

export function mergeActivityItems(
  activityGroups: readonly (readonly ActivityItem[])[],
): ActivityItem[] {
  return activityGroups.flat().sort(compareActivitiesDesc);
}

export function activitiesFromEntities(
  entities: readonly ActivitySourceEntity[],
): ActivityItem[] {
  return mergeActivityItems(
    entities.map((entity) => entityToActivityItems(entity)),
  );
}

export function filterActivityItems(
  items: readonly ActivityItem[],
  filter: ActivityFilter = {},
): ActivityItem[] {
  return items.filter((item) => {
    const entityTypeMatches =
      !filter.entityTypes ||
      filter.entityTypes.length === 0 ||
      filter.entityTypes.includes(item.entity.type);

    const eventTypeMatches =
      !filter.eventTypes ||
      filter.eventTypes.length === 0 ||
      filter.eventTypes.includes(item.eventType);

    return entityTypeMatches && eventTypeMatches;
  });
}

export function paginateActivityItems(
  items: readonly ActivityItem[],
  pagination: ActivityPagination = {},
): ActivityFeedPage {
  const limit = pagination.limit ?? items.length;
  const startIndex = pagination.cursor
    ? items.findIndex((item) => item.id === pagination.cursor) + 1
    : 0;
  const safeStartIndex = Math.max(startIndex, 0);
  const pageItems = items.slice(safeStartIndex, safeStartIndex + limit);
  const nextItem = items[safeStartIndex + limit];

  return {
    items: pageItems,
    nextCursor: nextItem?.id,
  };
}

export function createActivityFeed(
  entities: readonly ActivitySourceEntity[],
  options: {
    filter?: ActivityFilter;
    pagination?: ActivityPagination;
  } = {},
): ActivityFeedPage {
  const items = filterActivityItems(
    activitiesFromEntities(entities),
    options.filter,
  );

  return paginateActivityItems(items, options.pagination);
}

export function getLocalActivitySourceEntities(): ActivitySourceEntity[] {
  return [
    ...getStoredTasks().map((task) => taskToEntity(task)),
    ...getStoredNotes().map((note) => noteToEntity(note)),
    ...getQuickCaptures().map((capture) => quickCaptureToEntity(capture)),
    ...getTransactions().map((transaction) =>
      transactionToEntity(transaction),
    ),
    ...getStoredCars().map((car) => carToEntity(car)),
  ];
}

export function getRecentActivityFeed(limit = 5): ActivityFeedPage {
  return createActivityFeed(getLocalActivitySourceEntities(), {
    pagination: { limit },
  });
}

const TIMELINE_EVENT_TYPES: readonly ActivityEventType[] = [
  "task_created",
  "note_created",
  "finance_transaction_created",
  "car_added",
  "inbox_item_created",
] as const;

export function getTimelineActivityFeed(limit = 50): ActivityFeedPage {
  return createActivityFeed(getLocalActivitySourceEntities(), {
    filter: {
      eventTypes: TIMELINE_EVENT_TYPES,
    },
    pagination: { limit },
  });
}
