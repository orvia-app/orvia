import type { ActivityItem } from "@/lib/activity/types";
import type { PersonalEntity } from "@/lib/entities/types";
import {
  getMemoryRelationSignals,
  type MemoryRelationSignals,
} from "@/lib/memory/memory-relations";
import type {
  MemoryCandidate,
  MemoryImportance,
} from "@/lib/memory/types";
import { getWorkspaceKey } from "@/lib/workspaces/workspaces";
import type { Task } from "@/types";

export type MemoryRankReason =
  | "Recently active"
  | "High importance"
  | "Mentioned multiple times"
  | "Pending task";

export type RankedMemoryCandidate = {
  candidate: MemoryCandidate;
  score: number;
  reasons: readonly MemoryRankReason[];
  relation: MemoryRelationSignals;
};

type RankMemoryOptions = {
  entities?: readonly PersonalEntity[];
  activities?: readonly ActivityItem[];
};

const IMPORTANCE_SCORE: Record<MemoryImportance, number> = {
  critical: 60,
  high: 42,
  medium: 24,
  low: 10,
};

const WORKSPACE_SCORE: Record<string, number> = {
  business: 12,
  work: 10,
  personal: 8,
  knowledge: 7,
  cars: 6,
};

const DAY_MS = 1000 * 60 * 60 * 24;

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

function getRecencyScore(candidate: MemoryCandidate, now: number): number {
  const time = getMemoryTime(candidate);

  if (time === 0) {
    return 0;
  }

  const ageMs = Math.max(0, now - time);

  if (ageMs <= DAY_MS) {
    return 35;
  }

  if (ageMs <= DAY_MS * 7) {
    return 24;
  }

  if (ageMs <= DAY_MS * 30) {
    return 12;
  }

  return 0;
}

function getWorkspaceScore(candidate: MemoryCandidate): number {
  const workspaceId = candidate.metadata.workspaceId;

  if (!workspaceId) {
    return 0;
  }

  return WORKSPACE_SCORE[getWorkspaceKey(workspaceId)] ?? 0;
}

function isTaskEntity(entity: PersonalEntity): entity is PersonalEntity & {
  data: Task;
} {
  return entity.type === "task";
}

function getPendingTaskEntityIds(
  entities: readonly PersonalEntity[] | undefined,
): Set<string> {
  return new Set(
    (entities ?? [])
      .filter(isTaskEntity)
      .filter((entity) => entity.data.status !== "done")
      .map((entity) => entity.id),
  );
}

function getMemoryEntityId(candidate: MemoryCandidate): string | undefined {
  switch (candidate.source.type) {
    case "task":
    case "note":
    case "inbox":
    case "activity":
      return candidate.source.entity.id;
    case "manual":
      return undefined;
  }
}

function getRankReasons(input: {
  candidate: MemoryCandidate;
  recencyScore: number;
  relation: MemoryRelationSignals;
  pendingTaskEntityIds: ReadonlySet<string>;
}): readonly MemoryRankReason[] {
  const reasons: MemoryRankReason[] = [];
  const entityId = getMemoryEntityId(input.candidate);

  if (input.recencyScore >= 24) {
    reasons.push("Recently active");
  }

  if (
    input.candidate.importance === "high" ||
    input.candidate.importance === "critical"
  ) {
    reasons.push("High importance");
  }

  if (input.relation.repeatedTitleCount > 1) {
    reasons.push("Mentioned multiple times");
  }

  if (
    input.candidate.sourceType === "task" &&
    entityId &&
    input.pendingTaskEntityIds.has(entityId)
  ) {
    reasons.push("Pending task");
  }

  return reasons;
}

export function rankMemoryCandidates(
  candidates: readonly MemoryCandidate[],
  options: RankMemoryOptions = {},
): RankedMemoryCandidate[] {
  const now = Date.now();
  const pendingTaskEntityIds = getPendingTaskEntityIds(options.entities);

  return candidates
    .map((candidate) => {
      const recencyScore = getRecencyScore(candidate, now);
      const relation = getMemoryRelationSignals(candidate, candidates);
      const entityId = getMemoryEntityId(candidate);
      const isPendingTask =
        candidate.sourceType === "task" &&
        Boolean(entityId && pendingTaskEntityIds.has(entityId));
      const score =
        IMPORTANCE_SCORE[candidate.importance] +
        recencyScore +
        getWorkspaceScore(candidate) +
        relation.relationScore +
        (isPendingTask ? 30 : 0);

      return {
        candidate,
        score,
        reasons: getRankReasons({
          candidate,
          recencyScore,
          relation,
          pendingTaskEntityIds,
        }),
        relation,
      };
    })
    .sort((a, b) => {
      const scoreDifference = b.score - a.score;

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      const timeDifference =
        getMemoryTime(b.candidate) - getMemoryTime(a.candidate);

      if (timeDifference !== 0) {
        return timeDifference;
      }

      return a.candidate.id.localeCompare(b.candidate.id);
    });
}

export function getTopRankedMemoryCandidates(
  candidates: readonly MemoryCandidate[],
  limit: number,
  options: RankMemoryOptions = {},
): RankedMemoryCandidate[] {
  return rankMemoryCandidates(candidates, options).slice(0, limit);
}
