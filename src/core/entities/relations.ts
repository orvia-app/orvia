import type {
  BaseEntity,
  EntityId,
  EntityRelation,
  EntityRelationType,
} from "@/core/entities/types";

const NEARBY_WINDOW_MS = 1000 * 60 * 60 * 24 * 2;

export type RelationSignal = {
  type: EntityRelationType;
  score: number;
};

export type RelationScore = {
  entity: BaseEntity;
  score: number;
  signals: readonly RelationSignal[];
};

function normalizeRelationText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function getTitleTokens(entity: BaseEntity): Set<string> {
  const titleText = [entity.title, entity.subtitle].filter(Boolean).join(" ");

  return new Set(
    normalizeRelationText(titleText)
      .split(" ")
      .filter((token) => token.length >= 4),
  );
}

function getTime(entity: BaseEntity): number {
  const value = entity.updatedAt ?? entity.createdAt;

  if (!value) {
    return 0;
  }

  const time = Date.parse(value);

  return Number.isNaN(time) ? 0 : time;
}

function getSharedTagCount(entity: BaseEntity, other: BaseEntity): number {
  const tags = new Set(entity.tags);

  if (tags.size === 0) {
    return 0;
  }

  return other.tags.filter((tag) => tags.has(tag)).length;
}

function getSharedTokenCount(entity: BaseEntity, other: BaseEntity): number {
  const tokens = getTitleTokens(entity);

  if (tokens.size === 0) {
    return 0;
  }

  return Array.from(getTitleTokens(other)).filter((token) => tokens.has(token))
    .length;
}

function hasNearbyTimestamp(entity: BaseEntity, other: BaseEntity): boolean {
  const time = getTime(entity);
  const otherTime = getTime(other);

  return (
    time !== 0 &&
    otherTime !== 0 &&
    Math.abs(time - otherTime) <= NEARBY_WINDOW_MS
  );
}

function buildRelationId(
  fromEntityId: EntityId,
  toEntityId: EntityId,
  type: EntityRelationType,
): string {
  return `relation:${type}:${fromEntityId}:${toEntityId}`;
}

export function scoreCoreEntityRelation(
  entity: BaseEntity,
  other: BaseEntity,
): RelationScore | null {
  if (entity.id === other.id) {
    return null;
  }

  const signals: RelationSignal[] = [];
  const sharedTags = getSharedTagCount(entity, other);
  const sharedTokens = getSharedTokenCount(entity, other);
  const sharedWorkspace =
    Boolean(entity.workspaceId) && entity.workspaceId === other.workspaceId;
  const nearby = hasNearbyTimestamp(entity, other);

  if (sharedTags > 0) {
    signals.push({ type: "shared_tag", score: sharedTags * 12 });
  }

  if (sharedWorkspace) {
    signals.push({ type: "same_workspace", score: 8 });
  }

  if (sharedTokens >= 2) {
    signals.push({ type: "similar_title", score: sharedTokens * 10 });
  }

  if (nearby) {
    signals.push({ type: "nearby_activity", score: 8 });
  }

  const score = signals.reduce((sum, signal) => sum + signal.score, 0);

  if (score < 16) {
    return null;
  }

  return {
    entity: other,
    score,
    signals,
  };
}

export function detectCoreEntityRelations(
  entity: BaseEntity,
  entities: readonly BaseEntity[],
  limit = 5,
): RelationScore[] {
  return entities
    .map((other) => scoreCoreEntityRelation(entity, other))
    .filter((score): score is RelationScore => score !== null)
    .sort((a, b) => {
      const scoreDifference = b.score - a.score;

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return a.entity.id.localeCompare(b.entity.id);
    })
    .slice(0, limit);
}

export function createBidirectionalRelation(
  fromEntity: BaseEntity,
  toEntity: BaseEntity,
  type: EntityRelationType,
  score: number,
): readonly [EntityRelation, EntityRelation] {
  return [
    {
      id: buildRelationId(fromEntity.id, toEntity.id, type),
      fromEntityId: fromEntity.id,
      toEntityId: toEntity.id,
      type,
      score,
    },
    {
      id: buildRelationId(toEntity.id, fromEntity.id, type),
      fromEntityId: toEntity.id,
      toEntityId: fromEntity.id,
      type,
      score,
    },
  ];
}
