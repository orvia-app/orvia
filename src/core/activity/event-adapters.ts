import type { ActivityItem } from "@/lib/activity/types";
import type { ActivityEvent } from "@/core/activity/types";
import type { EntityType } from "@/core/entities/types";

function mapActivityEntityType(
  type: ActivityItem["entity"]["type"],
): EntityType {
  switch (type) {
    case "task":
      return "task";
    case "note":
      return "note";
    case "finance_transaction":
      return "finance";
    case "car":
      return "car";
    case "inbox_item":
      return "capture";
  }
}

export function activityItemToEvent(item: ActivityItem): ActivityEvent {
  const entityType = mapActivityEntityType(item.entity.type);

  return {
    eventId: item.id,
    entityId: `${entityType}:${item.entity.sourceId}`,
    entityType,
    action: item.eventType,
    timestamp: item.occurredAt,
    source: item.metadata.source === "local" ? "local" : "sync",
    actorId: item.actor?.id,
    workspaceId: item.metadata.workspaceId,
    metadata: {
      title: item.title,
      subtitle: item.subtitle,
      relationIds: item.metadata.relationIds,
      memoryReferenceIds: item.metadata.memoryReferenceIds,
    },
    sync: {
      version: 1,
      syncStatus: "local",
      source: item.metadata.source,
      lastSyncedAt: undefined,
    },
  };
}

export function activityItemsToEvents(
  items: readonly ActivityItem[],
): ActivityEvent[] {
  return items.map((item) => activityItemToEvent(item));
}
