import {
  getActivityEventLabel,
  getActivitySubtitle,
  getActivityTitle,
} from "@/lib/activity/activity-utils";
import {
  activitiesFromEntities,
  getLocalActivitySourceEntities,
} from "@/lib/activity/activity-feed";
import type { ActivityItem } from "@/lib/activity/types";
import { getCars } from "@/lib/cars";
import {
  carToEntity,
  getEntitySubtitle,
  getEntityTitle,
  getEntityTypeLabel,
  getEntityUrl,
  noteToEntity,
  quickCaptureToEntity,
  taskToEntity,
  toSearchableEntity,
  transactionToEntity,
} from "@/lib/entities/entity-utils";
import type { PersonalEntity } from "@/lib/entities/types";
import { getTransactions } from "@/lib/finance";
import {
  activitiesToMemoryCandidates,
  entitiesToMemoryCandidates,
  getMemoryImportanceLabel,
  getMemorySourceTypeLabel,
} from "@/lib/memory/memory-utils";
import { rankMemoryCandidates } from "@/lib/memory/memory-ranking";
import {
  getContextLabelSearchText,
  getEntityContext,
  type ContextLabel,
} from "@/lib/memory/context";
import type { MemoryCandidate } from "@/lib/memory/types";
import { getNotes } from "@/lib/notes";
import { getQuickCaptures } from "@/lib/quick-captures";
import { tagsToSearchText } from "@/lib/tags/tag-utils";
import { getTasks } from "@/lib/tasks";
import { getWorkspaceLabel } from "@/lib/workspaces/workspaces";
import {
  compactText,
  normalizeSearchText,
  truncateText,
} from "@/core/search/normalization";
import {
  UNIVERSAL_SEARCH_GROUPS,
  type UniversalSearchResult,
  type UniversalSearchResultType,
} from "@/core/search/types";

function entityToUniversalSearchResult(
  entity: PersonalEntity,
  entities: readonly PersonalEntity[],
): UniversalSearchResult {
  const searchableEntity = toSearchableEntity(entity);
  const subtitle = getEntitySubtitle(entity);
  const workspaceLabel = entity.metadata.workspaceId
    ? getWorkspaceLabel(entity.metadata.workspaceId)
    : undefined;
  const context = getEntityContext(entity, entities);

  return {
    id: `entity:${entity.id}`,
    type: "entity",
    groupLabel: "Entities",
    badgeLabel: getEntityTypeLabel(entity.type),
    title: getEntityTitle(entity),
    subtitle,
    excerpt: truncateText(subtitle || entity.metadata.searchableText),
    href: getEntityUrl(entity),
    contextLabels: context.labels,
    relatedCount: context.relatedCount,
    contextualScore: context.contextualScore,
    searchableText: normalizeSearchText(
      compactText([
        searchableEntity.searchableText,
        searchableEntity.typeLabel,
        workspaceLabel,
        tagsToSearchText(entity.metadata.memoryTags),
        tagsToSearchText(entity.metadata.tags),
        getContextLabelSearchText(context.labels),
      ]),
    ),
  };
}

function activityToUniversalSearchResult(
  activity: ActivityItem,
): UniversalSearchResult {
  const subtitle = getActivitySubtitle(activity);
  const workspaceLabel = activity.metadata.workspaceId
    ? getWorkspaceLabel(activity.metadata.workspaceId)
    : undefined;

  return {
    id: `activity:${activity.id}`,
    type: "activity",
    groupLabel: "Activity",
    badgeLabel: getActivityEventLabel(activity.eventType),
    title: getActivityTitle(activity),
    subtitle,
    excerpt: truncateText(subtitle),
    href: activity.entity.url,
    relatedCount: activity.metadata.relationIds?.length ?? 0,
    searchableText: normalizeSearchText(
      compactText([
        activity.title,
        activity.subtitle,
        activity.eventType,
        activity.entity.title,
        activity.entity.type,
        activity.metadata.workspaceId,
        workspaceLabel,
      ]),
    ),
  };
}

function getMemoryHref(memory: MemoryCandidate): string | undefined {
  switch (memory.source.type) {
    case "task":
    case "note":
    case "inbox":
    case "activity":
      return memory.source.entity.url;
    case "manual":
      return undefined;
  }
}

function memoryToUniversalSearchResult(
  memory: MemoryCandidate,
  labels: readonly ContextLabel[] = [],
): UniversalSearchResult {
  const workspaceLabel = memory.metadata.workspaceId
    ? getWorkspaceLabel(memory.metadata.workspaceId)
    : undefined;

  return {
    id: `memory:${memory.id}`,
    type: "memory",
    groupLabel: "Memory",
    badgeLabel: getMemorySourceTypeLabel(memory.sourceType),
    title: memory.title,
    subtitle: getMemoryImportanceLabel(memory.importance),
    excerpt: truncateText(memory.content),
    href: getMemoryHref(memory),
    contextLabels: labels,
    searchableText: normalizeSearchText(
      compactText([
        memory.title,
        memory.content,
        memory.sourceType,
        memory.importance,
        workspaceLabel,
        tagsToSearchText(memory.metadata.tags),
        memory.candidateReason,
        getContextLabelSearchText(labels),
      ]),
    ),
  };
}

export function createUniversalSearchResults(input: {
  entities: readonly PersonalEntity[];
  activities: readonly ActivityItem[];
  memories: readonly MemoryCandidate[];
}): UniversalSearchResult[] {
  return [
    ...input.entities.map((entity) =>
      entityToUniversalSearchResult(entity, input.entities),
    ),
    ...input.activities.map((activity) =>
      activityToUniversalSearchResult(activity),
    ),
    ...rankMemoryCandidates(input.memories, { entities: input.entities }).map(
      (rankedMemory) =>
        memoryToUniversalSearchResult(
          rankedMemory.candidate,
          rankedMemory.reasons.map((reason) => {
            if (reason === "Recently active") return "Recently updated";
            if (reason === "Mentioned multiple times") return "Repeated topic";
            if (reason === "Pending task") return "Pending";
            return "Active";
          }),
        ),
    ),
  ];
}

export function getLocalUniversalSearchResults(): UniversalSearchResult[] {
  const entities: PersonalEntity[] = [
    ...getTasks().map((task) => taskToEntity(task)),
    ...getNotes().map((note) => noteToEntity(note)),
    ...getTransactions().map((transaction) =>
      transactionToEntity(transaction),
    ),
    ...getCars().map((car) => carToEntity(car)),
    ...getQuickCaptures().map((capture) => quickCaptureToEntity(capture)),
  ];
  const activities = activitiesFromEntities(getLocalActivitySourceEntities());
  const memories = rankMemoryCandidates(
    [
      ...entitiesToMemoryCandidates(entities),
      ...activitiesToMemoryCandidates(activities),
    ],
    {
      entities,
      activities,
    },
  ).map((rankedMemory) => rankedMemory.candidate);

  return createUniversalSearchResults({
    entities,
    activities,
    memories,
  });
}

export function searchUniversalResults(
  results: readonly UniversalSearchResult[],
  query: string,
): UniversalSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  return results.filter((result) =>
    result.searchableText.includes(normalizedQuery),
  );
}

export function getUniversalSearchGroupLabel(
  type: UniversalSearchResultType,
): string {
  return (
    UNIVERSAL_SEARCH_GROUPS.find((group) => group.key === type)?.label ?? type
  );
}
