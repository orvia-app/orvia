import {
  activitiesFromEntities,
  getLocalActivitySourceEntities,
} from "@/lib/activity/activity-feed";
import type { ActivityItem } from "@/lib/activity/types";
import { getStoredCars } from "@/lib/cars";
import {
  carToEntity,
  getEntitySubtitle,
  getEntityTypeLabel,
  getEntityUrl,
  noteToEntity,
  quickCaptureToEntity,
  taskToEntity,
  transactionToEntity,
} from "@/lib/entities/entity-utils";
import type { EntityId, PersonalEntity } from "@/lib/entities/types";
import { getTransactions } from "@/lib/finance";
import { getStoredNotes } from "@/lib/notes";
import { getQuickCaptures } from "@/lib/quick-captures";
import { dedupeTags } from "@/lib/tags/tag-utils";
import { getStoredTasks } from "@/lib/tasks";
import { getWorkspaceKey, getWorkspaceLabel } from "@/lib/workspaces/workspaces";

export type ContextLabel =
  | "Active"
  | "Recently updated"
  | "Connected"
  | "Repeated topic"
  | "Pending";

export type RelatedContextItem = {
  entity: PersonalEntity;
  score: number;
  reasons: readonly ContextLabel[];
};

export type EntityContext = {
  entity: PersonalEntity;
  contextualScore: number;
  labels: readonly ContextLabel[];
  relatedCount: number;
  relatedItems: readonly RelatedContextItem[];
  workspaceLabel?: string;
  tags: readonly string[];
  timestamp?: string;
  status?: string;
  priority?: string;
};

const RECENT_WINDOW_MS = 1000 * 60 * 60 * 24 * 7;
const NEARBY_WINDOW_MS = 1000 * 60 * 60 * 24 * 2;

function compactText(parts: readonly (string | number | undefined)[]): string {
  return parts
    .filter((part): part is string | number => part !== undefined)
    .map((part) => String(part).trim())
    .filter(Boolean)
    .join(" ");
}

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function getEntityTime(entity: PersonalEntity): number {
  const value = getEntityTimestamp(entity);

  if (!value) {
    return 0;
  }

  const time = Date.parse(value);

  return Number.isNaN(time) ? 0 : time;
}

function getTitleTokens(entity: PersonalEntity): Set<string> {
  return new Set(
    normalizeText(compactText([entity.title, entity.subtitle]))
      .split(" ")
      .filter((token) => token.length >= 4),
  );
}

function getSharedTokenCount(entity: PersonalEntity, other: PersonalEntity): number {
  const tokens = getTitleTokens(entity);

  if (tokens.size === 0) {
    return 0;
  }

  return Array.from(getTitleTokens(other)).filter((token) => tokens.has(token))
    .length;
}

function getSharedTagCount(entity: PersonalEntity, other: PersonalEntity): number {
  const tags = new Set(getEntityTags(entity));

  if (tags.size === 0) {
    return 0;
  }

  return getEntityTags(other).filter((tag) => tags.has(tag)).length;
}

function hasNearbyTimestamp(entity: PersonalEntity, other: PersonalEntity): boolean {
  const time = getEntityTime(entity);
  const otherTime = getEntityTime(other);

  return (
    time !== 0 &&
    otherTime !== 0 &&
    Math.abs(time - otherTime) <= NEARBY_WINDOW_MS
  );
}

function hasExplicitRelation(entity: PersonalEntity, other: PersonalEntity): boolean {
  return (
    entity.metadata.relationIds?.includes(other.id as EntityId) ||
    other.metadata.relationIds?.includes(entity.id as EntityId) ||
    false
  );
}

function getRelationReasons(input: {
  explicit: boolean;
  sharedTags: number;
  sharedWorkspace: boolean;
  sharedTokens: number;
  nearby: boolean;
}): ContextLabel[] {
  const reasons: ContextLabel[] = [];

  if (input.explicit || input.sharedTags > 0 || input.sharedWorkspace) {
    reasons.push("Connected");
  }

  if (input.sharedTokens >= 2) {
    reasons.push("Repeated topic");
  }

  if (input.nearby) {
    reasons.push("Recently updated");
  }

  return reasons;
}

function scoreEntityRelation(entity: PersonalEntity, other: PersonalEntity): RelatedContextItem | null {
  if (entity.id === other.id) {
    return null;
  }

  const sharedTags = getSharedTagCount(entity, other);
  const sharedWorkspace =
    entity.metadata.workspaceId !== undefined &&
    other.metadata.workspaceId !== undefined &&
    getWorkspaceKey(entity.metadata.workspaceId) ===
      getWorkspaceKey(other.metadata.workspaceId);
  const sharedTokens = getSharedTokenCount(entity, other);
  const nearby = hasNearbyTimestamp(entity, other);
  const explicit = hasExplicitRelation(entity, other);
  const score =
    (explicit ? 40 : 0) +
    sharedTags * 12 +
    (sharedWorkspace ? 8 : 0) +
    sharedTokens * 10 +
    (nearby ? 8 : 0);

  if (score < 16) {
    return null;
  }

  return {
    entity: other,
    score,
    reasons: getRelationReasons({
      explicit,
      sharedTags,
      sharedWorkspace,
      sharedTokens,
      nearby,
    }),
  };
}

function isPendingTask(entity: PersonalEntity): boolean {
  return entity.type === "task" && entity.data.status !== "done";
}

function isHighPriority(entity: PersonalEntity): boolean {
  return (
    entity.type === "task" &&
    (entity.data.priority === "high" || entity.data.priority === "critical")
  );
}

function isRecent(entity: PersonalEntity, now: number): boolean {
  const time = getEntityTime(entity);

  return time !== 0 && Math.max(0, now - time) <= RECENT_WINDOW_MS;
}

export function getEntityTags(entity: PersonalEntity): string[] {
  return dedupeTags([
    ...(entity.metadata.tags ?? []),
    ...(entity.metadata.memoryTags ?? []),
  ]);
}

export function getEntityTimestamp(entity: PersonalEntity): string | undefined {
  return entity.metadata.updatedAt ?? entity.metadata.createdAt;
}

export function getRelatedContextForEntity(
  entity: PersonalEntity,
  entities: readonly PersonalEntity[],
  limit = 3,
): RelatedContextItem[] {
  return entities
    .map((other) => scoreEntityRelation(entity, other))
    .filter((item): item is RelatedContextItem => item !== null)
    .sort((a, b) => {
      const scoreDifference = b.score - a.score;

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return a.entity.id.localeCompare(b.entity.id);
    })
    .slice(0, limit);
}

export function getEntityContext(
  entity: PersonalEntity,
  entities: readonly PersonalEntity[],
): EntityContext {
  const now = Date.now();
  const relatedItems = getRelatedContextForEntity(entity, entities);
  const relatedCount = relatedItems.length;
  const labels: ContextLabel[] = [];

  if (isRecent(entity, now)) {
    labels.push("Recently updated");
  }

  if (relatedCount > 0) {
    labels.push("Connected");
  }

  if (relatedItems.some((item) => item.reasons.includes("Repeated topic"))) {
    labels.push("Repeated topic");
  }

  if (isPendingTask(entity)) {
    labels.push("Pending");
  }

  const contextualScore =
    relatedItems.reduce((sum, item) => sum + item.score, 0) +
    (isRecent(entity, now) ? 25 : 0) +
    (isPendingTask(entity) ? 30 : 0) +
    (isHighPriority(entity) ? 25 : 0);

  if (contextualScore >= 45) {
    labels.unshift("Active");
  }

  return {
    entity,
    contextualScore,
    labels: Array.from(new Set(labels)).slice(0, 4),
    relatedCount,
    relatedItems,
    workspaceLabel: entity.metadata.workspaceId
      ? getWorkspaceLabel(entity.metadata.workspaceId)
      : undefined,
    tags: getEntityTags(entity),
    timestamp: getEntityTimestamp(entity),
    status: entity.metadata.status,
    priority: entity.metadata.priority,
  };
}

export function buildActiveContext(
  entities: readonly PersonalEntity[],
  limit = 5,
): EntityContext[] {
  return entities
    .map((entity) => getEntityContext(entity, entities))
    .filter((context) => context.contextualScore > 0)
    .sort((a, b) => {
      const scoreDifference = b.contextualScore - a.contextualScore;

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return a.entity.id.localeCompare(b.entity.id);
    })
    .slice(0, limit);
}

export function getResurfacingCandidates(
  entities: readonly PersonalEntity[],
  limit = 5,
): EntityContext[] {
  return buildActiveContext(entities, limit);
}

export function getLocalContextEntities(): PersonalEntity[] {
  return [
    ...getStoredTasks().map((task) => taskToEntity(task)),
    ...getStoredNotes().map((note) => noteToEntity(note)),
    ...getTransactions().map((transaction) =>
      transactionToEntity(transaction),
    ),
    ...getStoredCars().map((car) => carToEntity(car)),
    ...getQuickCaptures().map((capture) => quickCaptureToEntity(capture)),
  ];
}

export function getLocalActiveContext(limit = 5): EntityContext[] {
  return buildActiveContext(getLocalContextEntities(), limit);
}

export function getRecentActivityClusters(
  activities: readonly ActivityItem[],
): ReadonlyMap<string, number> {
  const clusters = new Map<string, number>();

  activities.forEach((activity) => {
    if (!activity.metadata.workspaceId) {
      return;
    }

    const workspaceKey = getWorkspaceKey(activity.metadata.workspaceId);
    clusters.set(workspaceKey, (clusters.get(workspaceKey) ?? 0) + 1);
  });

  return clusters;
}

export function getLocalActivityContext(): ActivityItem[] {
  return activitiesFromEntities(getLocalActivitySourceEntities());
}

export function getContextLabelSearchText(labels: readonly ContextLabel[]): string {
  return labels.join(" ");
}

export function getEntityContextUrl(context: EntityContext): string {
  return getEntityUrl(context.entity);
}

export function getRelatedContextSubtitle(item: RelatedContextItem): string {
  return compactText([
    getEntityTypeLabel(item.entity.type),
    getEntitySubtitle(item.entity),
  ]);
}
