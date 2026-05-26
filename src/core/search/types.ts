import type { ContextLabel } from "@/lib/memory/context";

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
  contextLabels?: readonly ContextLabel[];
  relatedCount?: number;
  contextualScore?: number;
};

export const UNIVERSAL_SEARCH_GROUPS: readonly UniversalSearchGroup[] = [
  { key: "entity", label: "Entities" },
  { key: "activity", label: "Activity" },
  { key: "memory", label: "Memory" },
] as const;
