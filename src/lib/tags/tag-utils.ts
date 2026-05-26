import type { Tag, TagId, TagSource } from "@/lib/tags/types";

const MAX_TAG_LENGTH = 40;
const TAG_SEPARATOR_PATTERN = /[\s_]+/g;
const UNSAFE_TAG_CHARACTER_PATTERN = /[^a-z0-9-/]/g;

function toTagId(slug: string): TagId {
  return `tag:${slug}`;
}

export function normalizeTag(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^#+/, "")
    .replace(TAG_SEPARATOR_PATTERN, "-")
    .replace(UNSAFE_TAG_CHARACTER_PATTERN, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isValidTag(value: string): boolean {
  const normalizedTag = normalizeTag(value);

  return normalizedTag.length > 0 && normalizedTag.length <= MAX_TAG_LENGTH;
}

export function dedupeTags(values: readonly string[]): string[] {
  const seenTags = new Set<string>();
  const tags: string[] = [];

  values.forEach((value) => {
    if (!isValidTag(value)) {
      return;
    }

    const normalizedTag = normalizeTag(value);

    if (seenTags.has(normalizedTag)) {
      return;
    }

    seenTags.add(normalizedTag);
    tags.push(normalizedTag);
  });

  return tags;
}

export function createTag(
  value: string,
  source: TagSource = "manual",
): Tag | null {
  if (!isValidTag(value)) {
    return null;
  }

  const slug = normalizeTag(value);

  return {
    id: toTagId(slug),
    label: slug,
    slug,
    source,
  };
}

export function tagsToSearchText(values: readonly string[] | undefined): string {
  if (!values) {
    return "";
  }

  return dedupeTags(values).join(" ");
}
