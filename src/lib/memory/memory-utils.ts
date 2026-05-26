import type { ActivityItem } from "@/lib/activity/types";
import {
  getEntitySubtitle,
  getEntityTitle,
  getEntityUrl,
} from "@/lib/entities/entity-utils";
import type {
  EntityId,
  PersonalEntity,
} from "@/lib/entities/types";
import type {
  MemoryCandidate,
  MemoryEntityRef,
  MemoryId,
  MemoryImportance,
  MemoryItem,
  MemorySourceType,
} from "@/lib/memory/types";

type EntityMemorySourceType = Extract<
  MemorySourceType,
  "task" | "note" | "inbox"
>;

function compactText(parts: readonly (string | number | undefined)[]): string {
  return parts
    .filter((part): part is string | number => part !== undefined)
    .map((part) => String(part).trim())
    .filter(Boolean)
    .join(" ");
}

function sourceTypeFromEntity(
  entity: PersonalEntity,
): EntityMemorySourceType | null {
  switch (entity.type) {
    case "task":
      return "task";
    case "note":
      return "note";
    case "inbox_item":
      return "inbox";
    case "finance_transaction":
    case "car":
      return null;
  }
}

function makeMemoryId(
  sourceType: MemorySourceType,
  sourceId: string,
): MemoryId {
  return `memory:${sourceType}:${sourceId}`;
}

function getEntityImportance(entity: PersonalEntity): MemoryImportance {
  if (entity.type !== "task") {
    return "medium";
  }

  switch (entity.data.priority) {
    case "critical":
      return "critical";
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
      return "low";
  }
}

function getActivityImportance(item: ActivityItem): MemoryImportance {
  switch (item.eventType) {
    case "task_created":
    case "task_updated":
    case "note_created":
    case "note_updated":
      return "medium";
    case "inbox_item_created":
      return "low";
    case "finance_transaction_created":
    case "car_added":
      return "medium";
  }
}

export function getMemoryEntityRef(entity: PersonalEntity): MemoryEntityRef {
  return {
    id: entity.id,
    type: entity.type,
    sourceId: entity.sourceId,
    title: getEntityTitle(entity),
    url: getEntityUrl(entity),
  };
}

export function getMemoryTitle(memory: MemoryItem): string {
  return memory.title;
}

export function getMemoryContent(memory: MemoryItem): string {
  return memory.content;
}

export function getMemoryImportanceLabel(
  importance: MemoryImportance,
): string {
  switch (importance) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    case "critical":
      return "Critical";
  }
}

export function entityToMemoryCandidate(
  entity: PersonalEntity,
): MemoryCandidate | null {
  const sourceType = sourceTypeFromEntity(entity);

  if (!sourceType) {
    return null;
  }

  const title = getEntityTitle(entity);
  const subtitle = getEntitySubtitle(entity);
  const content = compactText([title, subtitle, entity.metadata.searchableText]);
  const entityRef = getMemoryEntityRef(entity);

  return {
    id: makeMemoryId(sourceType, entity.id),
    sourceType,
    source: {
      type: sourceType,
      entity: entityRef,
    },
    title,
    content,
    importance: getEntityImportance(entity),
    metadata: {
      createdAt: entity.metadata.createdAt,
      updatedAt: entity.metadata.updatedAt,
      capturedAt: entity.metadata.createdAt,
      workspaceId: entity.metadata.workspaceId,
      relationIds: entity.metadata.relationIds,
      tags: entity.metadata.memoryTags,
      source: entity.metadata.source,
    },
    candidateReason: `${sourceType} entity is available for future recall`,
  };
}

export function entitiesToMemoryCandidates(
  entities: readonly PersonalEntity[],
): MemoryCandidate[] {
  return entities
    .map((entity) => entityToMemoryCandidate(entity))
    .filter((candidate): candidate is MemoryCandidate => candidate !== null);
}

export function activityToMemoryCandidate(
  item: ActivityItem,
): MemoryCandidate {
  const entityRef: MemoryEntityRef = {
    id: item.entity.id,
    type: item.entity.type,
    sourceId: item.entity.sourceId,
    title: item.entity.title,
    url: item.entity.url,
  };

  return {
    id: makeMemoryId("activity", item.id),
    sourceType: "activity",
    source: {
      type: "activity",
      activityId: item.id,
      eventType: item.eventType,
      entity: entityRef,
    },
    title: item.title,
    content: compactText([item.title, item.subtitle, item.entity.title]),
    importance: getActivityImportance(item),
    metadata: {
      capturedAt: item.occurredAt,
      workspaceId: item.metadata.workspaceId,
      relationIds: item.metadata.relationIds,
      source: item.metadata.source,
    },
    candidateReason: "activity event can provide timeline context for recall",
  };
}

export function activitiesToMemoryCandidates(
  items: readonly ActivityItem[],
): MemoryCandidate[] {
  return items.map((item) => activityToMemoryCandidate(item));
}

export function createManualMemory(input: {
  id: string;
  title: string;
  content: string;
  importance?: MemoryImportance;
  createdAt?: string;
  updatedAt?: string;
  workspaceId?: string;
  userId?: string;
  relationIds?: readonly EntityId[];
  tags?: readonly string[];
  label?: string;
}): MemoryItem {
  return {
    id: makeMemoryId("manual", input.id),
    sourceType: "manual",
    source: {
      type: "manual",
      label: input.label,
    },
    title: input.title,
    content: input.content,
    importance: input.importance ?? "medium",
    metadata: {
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      capturedAt: input.createdAt,
      workspaceId: input.workspaceId,
      userId: input.userId,
      relationIds: input.relationIds,
      tags: input.tags,
      source: "local",
    },
  };
}
