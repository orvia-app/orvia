import type {
  MemoryCandidate,
  MemoryIndexEntry,
  MemoryItem,
  MemorySourceRef,
} from "@/lib/memory/types";

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getMemorySourceEntity(source: MemorySourceRef) {
  switch (source.type) {
    case "task":
    case "note":
    case "inbox":
    case "activity":
      return source.entity;
    case "manual":
      return undefined;
  }
}

export function memoryToIndexEntry(memory: MemoryItem): MemoryIndexEntry {
  const entity = getMemorySourceEntity(memory.source);
  const searchableText = normalizeSearchText(
    [
      memory.title,
      memory.content,
      memory.sourceType,
      memory.importance,
      entity?.title,
      memory.metadata.tags?.join(" "),
    ]
      .filter((part): part is string => Boolean(part))
      .join(" "),
  );

  return {
    id: memory.id,
    title: memory.title,
    content: memory.content,
    searchableText,
    importance: memory.importance,
    sourceType: memory.sourceType,
    entity,
    vector: memory.metadata.vector,
    memory,
  };
}

export function createMemoryIndex(
  memories: readonly MemoryItem[],
): MemoryIndexEntry[] {
  return memories.map((memory) => memoryToIndexEntry(memory));
}

export function createMemoryIndexFromCandidates(
  candidates: readonly MemoryCandidate[],
): MemoryIndexEntry[] {
  return createMemoryIndex(candidates);
}

export function searchMemoryIndex(
  entries: readonly MemoryIndexEntry[],
  query: string,
): MemoryIndexEntry[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  return entries.filter((entry) =>
    entry.searchableText.includes(normalizedQuery),
  );
}
