import type { ActivityItem } from "@/lib/activity/types";
import type { CarRecord } from "@/lib/cars";
import type { PersonalEntity } from "@/lib/entities/types";
import {
  carToEntity,
  noteToEntity,
  quickCaptureToEntity,
  taskToEntity,
  transactionToEntity,
} from "@/lib/entities/entity-utils";
import type { Transaction } from "@/lib/finance";
import type { MemoryCandidate } from "@/lib/memory/types";
import type { Note } from "@/lib/notes";
import type { QuickCapture } from "@/lib/quick-captures";
import type { Task } from "@/types";
import type {
  BaseEntity,
  EntityId,
  EntityType,
  SyncMetadata,
} from "@/core/entities/types";

const LOCAL_SYNC_METADATA: SyncMetadata = {
  version: 1,
  syncStatus: "local",
  source: "local",
};

function mapPersonalEntityType(type: PersonalEntity["type"]): EntityType {
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

function makeCoreEntityId<TType extends EntityType>(
  type: TType,
  sourceId: string,
): EntityId<TType> {
  return `${type}:${sourceId}`;
}

function personalEntityToTypedCoreEntity<TType extends EntityType>(
  entity: PersonalEntity,
  type: TType,
): BaseEntity<TType> {
  return {
    id: makeCoreEntityId(type, entity.sourceId),
    type,
    title: entity.title,
    subtitle: entity.subtitle,
    createdAt: entity.metadata.createdAt,
    updatedAt: entity.metadata.updatedAt,
    workspaceId: entity.metadata.workspaceId,
    tags: entity.metadata.tags ?? entity.metadata.memoryTags ?? [],
    status: entity.metadata.status,
    metadata: {
      url: entity.metadata.url,
      workspaceId: entity.metadata.workspaceId,
      workspaceLabel: entity.metadata.workspaceLabel,
      tags: entity.metadata.tags,
      status: entity.metadata.status,
      priority: entity.metadata.priority,
      searchableText: entity.metadata.searchableText,
      relatedCount: entity.metadata.relatedCount,
      contextScore: entity.metadata.contextualScore,
      sourceId: entity.sourceId,
      sourceType: entity.type,
    },
    relations: [],
    sync: LOCAL_SYNC_METADATA,
  };
}

export function personalEntityToCoreEntity(
  entity: PersonalEntity,
): BaseEntity {
  return personalEntityToTypedCoreEntity(
    entity,
    mapPersonalEntityType(entity.type),
  );
}

export function taskToCoreEntity(task: Task): BaseEntity<"task"> {
  return personalEntityToTypedCoreEntity(taskToEntity(task), "task");
}

export function noteToCoreEntity(note: Note): BaseEntity<"note"> {
  return personalEntityToTypedCoreEntity(noteToEntity(note), "note");
}

export function transactionToCoreEntity(
  transaction: Transaction,
): BaseEntity<"finance"> {
  return personalEntityToTypedCoreEntity(
    transactionToEntity(transaction),
    "finance",
  );
}

export function carToCoreEntity(car: CarRecord): BaseEntity<"car"> {
  return personalEntityToTypedCoreEntity(carToEntity(car), "car");
}

export function quickCaptureToCoreEntity(
  capture: QuickCapture,
): BaseEntity<"capture"> {
  return personalEntityToTypedCoreEntity(
    quickCaptureToEntity(capture),
    "capture",
  );
}

export function activityToCoreEntity(
  activity: ActivityItem,
): BaseEntity<"activity"> {
  return {
    id: `activity:${activity.id}`,
    type: "activity",
    title: activity.title,
    subtitle: activity.subtitle,
    createdAt: activity.occurredAt,
    updatedAt: activity.occurredAt,
    workspaceId: activity.metadata.workspaceId,
    tags: [activity.eventType, activity.entity.type],
    status: activity.eventType,
    metadata: {
      url: activity.entity.url,
      workspaceId: activity.metadata.workspaceId,
      tags: [activity.eventType, activity.entity.type],
      status: activity.eventType,
      searchableText: [
        activity.title,
        activity.subtitle,
        activity.entity.title,
      ].join(" "),
      sourceId: activity.id,
      sourceType: "activity",
    },
    relations: [],
    sync: {
      ...LOCAL_SYNC_METADATA,
      source: activity.metadata.source,
    },
  };
}

export function memoryCandidateToCoreEntity(
  memory: MemoryCandidate,
): BaseEntity<"memory"> {
  return {
    id: `memory:${memory.id}`,
    type: "memory",
    title: memory.title,
    subtitle: memory.content,
    createdAt: memory.metadata.createdAt ?? memory.metadata.capturedAt,
    updatedAt: memory.metadata.updatedAt,
    workspaceId: memory.metadata.workspaceId,
    tags: memory.metadata.tags ?? [],
    status: memory.importance,
    metadata: {
      workspaceId: memory.metadata.workspaceId,
      tags: memory.metadata.tags,
      status: memory.importance,
      searchableText: [memory.title, memory.content].join(" "),
      sourceId: memory.id,
      sourceType: memory.sourceType,
      extra: {
        candidateReason: memory.candidateReason,
      },
    },
    relations: [],
    sync: {
      ...LOCAL_SYNC_METADATA,
      source: memory.metadata.source,
    },
  };
}
