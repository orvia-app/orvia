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
import type { MemoryCandidate } from "@/lib/memory/types";
import { getNotes } from "@/lib/notes";
import { getQuickCaptures } from "@/lib/quick-captures";
import { getTasks } from "@/lib/tasks";

export type UniversalSearchResultType = "entity" | "activity" | "memory";

export type UniversalSearchGroup = {
  key: UniversalSearchResultType;
  label: string;
};

export type UniversalSearchResult = {
  id: string;
  type: UniversalSearchResultType;
  groupLabel: string;
  badgeLabel: string;
  title: string;
  subtitle: string;
  excerpt: string;
  href?: string;
  searchableText: string;
};

export const UNIVERSAL_SEARCH_GROUPS: readonly UniversalSearchGroup[] = [
  { key: "entity", label: "Entities" },
  { key: "activity", label: "Activity" },
  { key: "memory", label: "Memory" },
] as const;

function compactText(parts: readonly (string | number | undefined)[]): string {
  return parts
    .filter((part): part is string | number => part !== undefined)
    .map((part) => String(part).trim())
    .filter(Boolean)
    .join(" ");
}

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function truncateText(value: string, maxLength = 180): string {
  const trimmed = value.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 3).trim()}...`;
}

function entityToUniversalSearchResult(
  entity: PersonalEntity,
): UniversalSearchResult {
  const searchableEntity = toSearchableEntity(entity);
  const subtitle = getEntitySubtitle(entity);

  return {
    id: `entity:${entity.id}`,
    type: "entity",
    groupLabel: "Entities",
    badgeLabel: getEntityTypeLabel(entity.type),
    title: getEntityTitle(entity),
    subtitle,
    excerpt: truncateText(subtitle || entity.metadata.searchableText),
    href: getEntityUrl(entity),
    searchableText: normalizeSearchText(
      compactText([
        searchableEntity.searchableText,
        searchableEntity.typeLabel,
        entity.metadata.memoryTags?.join(" "),
      ]),
    ),
  };
}

function activityToUniversalSearchResult(
  activity: ActivityItem,
): UniversalSearchResult {
  const subtitle = getActivitySubtitle(activity);

  return {
    id: `activity:${activity.id}`,
    type: "activity",
    groupLabel: "Activity",
    badgeLabel: getActivityEventLabel(activity.eventType),
    title: getActivityTitle(activity),
    subtitle,
    excerpt: truncateText(subtitle),
    href: activity.entity.url,
    searchableText: normalizeSearchText(
      compactText([
        activity.title,
        activity.subtitle,
        activity.eventType,
        activity.entity.title,
        activity.entity.type,
        activity.metadata.workspaceId,
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
): UniversalSearchResult {
  return {
    id: `memory:${memory.id}`,
    type: "memory",
    groupLabel: "Memory",
    badgeLabel: getMemorySourceTypeLabel(memory.sourceType),
    title: memory.title,
    subtitle: getMemoryImportanceLabel(memory.importance),
    excerpt: truncateText(memory.content),
    href: getMemoryHref(memory),
    searchableText: normalizeSearchText(
      compactText([
        memory.title,
        memory.content,
        memory.sourceType,
        memory.importance,
        memory.metadata.tags?.join(" "),
        memory.candidateReason,
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
    ...input.entities.map((entity) => entityToUniversalSearchResult(entity)),
    ...input.activities.map((activity) =>
      activityToUniversalSearchResult(activity),
    ),
    ...input.memories.map((memory) => memoryToUniversalSearchResult(memory)),
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
  const memories = [
    ...entitiesToMemoryCandidates(entities),
    ...activitiesToMemoryCandidates(activities),
  ];

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
