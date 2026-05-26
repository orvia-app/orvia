import type { ActivityItem } from "@/lib/activity/types";
import type { PersonalEntity } from "@/lib/entities/types";
import type { MemoryCandidate } from "@/lib/memory/types";
import { getWorkspaceKey } from "@/lib/workspaces/workspaces";

const NEARBY_ACTIVITY_WINDOW_MS = 1000 * 60 * 60 * 24;

export type MemoryRelationSignals = {
  repeatedTitleCount: number;
  sharedTagCount: number;
  sharedWorkspaceCount: number;
  nearbyActivityCount: number;
  relatedEntityCount: number;
  relationScore: number;
};

function normalizeRelationText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function getMemoryTime(candidate: MemoryCandidate): number {
  const value =
    candidate.metadata.capturedAt ??
    candidate.metadata.updatedAt ??
    candidate.metadata.createdAt;

  if (!value) {
    return 0;
  }

  const time = Date.parse(value);

  return Number.isNaN(time) ? 0 : time;
}

function hasSharedTag(
  candidate: MemoryCandidate,
  otherCandidate: MemoryCandidate,
): boolean {
  const tags = new Set(candidate.metadata.tags ?? []);

  if (tags.size === 0) {
    return false;
  }

  return (otherCandidate.metadata.tags ?? []).some((tag) => tags.has(tag));
}

function hasSharedWorkspace(
  candidate: MemoryCandidate,
  otherCandidate: MemoryCandidate,
): boolean {
  if (!candidate.metadata.workspaceId || !otherCandidate.metadata.workspaceId) {
    return false;
  }

  return (
    getWorkspaceKey(candidate.metadata.workspaceId) ===
    getWorkspaceKey(otherCandidate.metadata.workspaceId)
  );
}

export function getRepeatedTitleCount(
  candidate: MemoryCandidate,
  candidates: readonly MemoryCandidate[],
): number {
  const normalizedTitle = normalizeRelationText(candidate.title);

  if (!normalizedTitle) {
    return 0;
  }

  return candidates.filter(
    (otherCandidate) =>
      normalizeRelationText(otherCandidate.title) === normalizedTitle,
  ).length;
}

export function getNearbyActivityCount(
  candidate: MemoryCandidate,
  candidates: readonly MemoryCandidate[],
): number {
  const candidateTime = getMemoryTime(candidate);

  if (candidateTime === 0) {
    return 0;
  }

  return candidates.filter((otherCandidate) => {
    if (otherCandidate.id === candidate.id) {
      return false;
    }

    const otherTime = getMemoryTime(otherCandidate);

    return (
      otherTime !== 0 &&
      Math.abs(candidateTime - otherTime) <= NEARBY_ACTIVITY_WINDOW_MS
    );
  }).length;
}

export function getMemoryRelationSignals(
  candidate: MemoryCandidate,
  candidates: readonly MemoryCandidate[],
): MemoryRelationSignals {
  const relatedEntityCount = candidate.metadata.relationIds?.length ?? 0;
  const repeatedTitleCount = getRepeatedTitleCount(candidate, candidates);
  const sharedTagCount = candidates.filter(
    (otherCandidate) =>
      otherCandidate.id !== candidate.id &&
      hasSharedTag(candidate, otherCandidate),
  ).length;
  const sharedWorkspaceCount = candidates.filter(
    (otherCandidate) =>
      otherCandidate.id !== candidate.id &&
      hasSharedWorkspace(candidate, otherCandidate),
  ).length;
  const nearbyActivityCount = getNearbyActivityCount(candidate, candidates);
  const relationScore =
    Math.max(0, repeatedTitleCount - 1) * 20 +
    sharedTagCount * 6 +
    sharedWorkspaceCount * 4 +
    nearbyActivityCount * 3 +
    relatedEntityCount * 8;

  return {
    repeatedTitleCount,
    sharedTagCount,
    sharedWorkspaceCount,
    nearbyActivityCount,
    relatedEntityCount,
    relationScore,
  };
}

export function getRelatedEntityCountFromActivity(item: ActivityItem): number {
  return item.metadata.relationIds?.length ?? 0;
}

export function getEntityRelationKey(entity: PersonalEntity): string {
  return `${entity.type}:${entity.sourceId}`;
}
