import type {
  EntityId,
  EntityType,
  PersonalEntity,
} from "@/lib/entities/types";

export type ActivityEventType =
  | "task_created"
  | "task_updated"
  | "note_created"
  | "note_updated"
  | "inbox_item_created"
  | "finance_transaction_created"
  | "car_added";

export type ActivityId = `activity:${ActivityEventType}:${EntityId}`;

export type ActivityActor = {
  id: string;
  type: "user" | "system" | "integration";
  name?: string;
};

export type ActivityEntityRef = {
  id: EntityId;
  type: EntityType;
  sourceId: string;
  title: string;
  url: string;
};

export type ActivityMetadata = {
  source: "local" | "backend" | "sync";
  workspaceId?: string;
  relationIds?: readonly EntityId[];
  memoryReferenceIds?: readonly string[];
  syncId?: string;
  syncVersion?: string;
  conflictId?: string;
  cursor?: string;
};

export type ActivityItem = {
  id: ActivityId;
  eventType: ActivityEventType;
  occurredAt?: string;
  entity: ActivityEntityRef;
  title: string;
  subtitle: string;
  actor?: ActivityActor;
  metadata: ActivityMetadata;
};

export type ActivityFilter = {
  entityTypes?: readonly EntityType[];
  eventTypes?: readonly ActivityEventType[];
};

export type ActivityPagination = {
  limit?: number;
  cursor?: string;
};

export type ActivityFeedPage = {
  items: ActivityItem[];
  nextCursor?: string;
};

export type ActivitySourceEntity = PersonalEntity;
