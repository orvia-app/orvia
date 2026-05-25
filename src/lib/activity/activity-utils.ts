import {
  getEntitySubtitle,
  getEntityTitle,
  getEntityTypeLabel,
  getEntityUrl,
} from "@/lib/entities/entity-utils";
import type { PersonalEntity } from "@/lib/entities/types";
import type {
  ActivityEntityRef,
  ActivityEventType,
  ActivityId,
  ActivityItem,
} from "@/lib/activity/types";

function getCreatedEventType(entity: PersonalEntity): ActivityEventType {
  switch (entity.type) {
    case "task":
      return "task_created";
    case "note":
      return "note_created";
    case "finance_transaction":
      return "finance_transaction_created";
    case "car":
      return "car_added";
    case "inbox_item":
      return "inbox_item_created";
  }
}

function getUpdatedEventType(entity: PersonalEntity): ActivityEventType | null {
  switch (entity.type) {
    case "task":
      return "task_updated";
    case "note":
      return "note_updated";
    case "finance_transaction":
    case "car":
    case "inbox_item":
      return null;
  }
}

function makeActivityId(
  eventType: ActivityEventType,
  entity: PersonalEntity,
): ActivityId {
  return `activity:${eventType}:${entity.id}`;
}

export function getActivityTitle(item: ActivityItem): string {
  return item.title;
}

export function getActivitySubtitle(item: ActivityItem): string {
  return item.subtitle;
}

export function getActivityEntityRef(
  entity: PersonalEntity,
): ActivityEntityRef {
  return {
    id: entity.id,
    type: entity.type,
    sourceId: entity.sourceId,
    title: getEntityTitle(entity),
    url: getEntityUrl(entity),
  };
}

export function getActivityEventLabel(eventType: ActivityEventType): string {
  switch (eventType) {
    case "task_created":
      return "Task created";
    case "task_updated":
      return "Task updated";
    case "note_created":
      return "Note created";
    case "note_updated":
      return "Note updated";
    case "inbox_item_created":
      return "Inbox item created";
    case "finance_transaction_created":
      return "Finance transaction created";
    case "car_added":
      return "Car added";
  }
}

export function entityToCreatedActivity(
  entity: PersonalEntity,
): ActivityItem {
  const eventType = getCreatedEventType(entity);
  const entityTypeLabel = getEntityTypeLabel(entity.type);

  return {
    id: makeActivityId(eventType, entity),
    eventType,
    occurredAt: entity.metadata.createdAt,
    entity: getActivityEntityRef(entity),
    title: getActivityEventLabel(eventType),
    subtitle: `${entityTypeLabel}: ${getEntityTitle(entity)}`,
    metadata: {
      source: entity.metadata.source,
      workspaceId: entity.metadata.workspaceId,
      relationIds: entity.metadata.relationIds,
    },
  };
}

export function entityToUpdatedActivity(
  entity: PersonalEntity,
): ActivityItem | null {
  const eventType = getUpdatedEventType(entity);

  if (!eventType || !entity.metadata.updatedAt) {
    return null;
  }

  return {
    id: makeActivityId(eventType, entity),
    eventType,
    occurredAt: entity.metadata.updatedAt,
    entity: getActivityEntityRef(entity),
    title: getActivityEventLabel(eventType),
    subtitle: getEntitySubtitle(entity),
    metadata: {
      source: entity.metadata.source,
      workspaceId: entity.metadata.workspaceId,
      relationIds: entity.metadata.relationIds,
    },
  };
}

export function entityToActivityItems(
  entity: PersonalEntity,
): ActivityItem[] {
  const updatedActivity = entityToUpdatedActivity(entity);

  return updatedActivity
    ? [updatedActivity, entityToCreatedActivity(entity)]
    : [entityToCreatedActivity(entity)];
}
