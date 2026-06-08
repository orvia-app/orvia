import {
  getUserScopedFallbackStorageKey,
  getUserScopedHiddenStorageKey,
  type UserScopedStorageDomain,
} from "@/core/storage/keys";
import { safeReadStorage, safeWriteStorage } from "@/lib/storage";

function normalizeUserId(userId: string | undefined): string | null {
  const normalized = userId?.trim();

  return normalized ? normalized : null;
}

function normalizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const ids: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }

    const id = item.trim();

    if (id && !ids.includes(id)) {
      ids.push(id);
    }
  }

  return ids;
}

function readIdList({
  domain,
  kind,
  userId,
}: {
  domain: UserScopedStorageDomain;
  kind: "fallback" | "hidden";
  userId?: string;
}): string[] {
  const normalizedUserId = normalizeUserId(userId);

  if (!normalizedUserId) {
    return [];
  }

  const key =
    kind === "fallback"
      ? getUserScopedFallbackStorageKey(normalizedUserId, domain)
      : getUserScopedHiddenStorageKey(normalizedUserId, domain);

  return normalizeIds(safeReadStorage<unknown>(key, []));
}

function writeIdList({
  domain,
  ids,
  kind,
  userId,
}: {
  domain: UserScopedStorageDomain;
  ids: readonly string[];
  kind: "fallback" | "hidden";
  userId?: string;
}): void {
  const normalizedUserId = normalizeUserId(userId);

  if (!normalizedUserId) {
    return;
  }

  const key =
    kind === "fallback"
      ? getUserScopedFallbackStorageKey(normalizedUserId, domain)
      : getUserScopedHiddenStorageKey(normalizedUserId, domain);

  safeWriteStorage(key, normalizeIds(ids));
}

function addId({
  domain,
  id,
  kind,
  userId,
}: {
  domain: UserScopedStorageDomain;
  id: string;
  kind: "fallback" | "hidden";
  userId?: string;
}): void {
  const normalizedId = id.trim();

  if (!normalizedId) {
    return;
  }

  const ids = readIdList({ domain, kind, userId });

  if (!ids.includes(normalizedId)) {
    writeIdList({ domain, ids: [...ids, normalizedId], kind, userId });
  }
}

function removeId({
  domain,
  id,
  kind,
  userId,
}: {
  domain: UserScopedStorageDomain;
  id: string;
  kind: "fallback" | "hidden";
  userId?: string;
}): void {
  const normalizedId = id.trim();

  if (!normalizedId) {
    return;
  }

  const ids = readIdList({ domain, kind, userId });
  const nextIds = ids.filter((currentId) => currentId !== normalizedId);

  if (nextIds.length !== ids.length) {
    writeIdList({ domain, ids: nextIds, kind, userId });
  }
}

export function getUserScopedFallbackIds(
  domain: UserScopedStorageDomain,
  userId?: string,
): string[] {
  return readIdList({ domain, kind: "fallback", userId });
}

export function getUserScopedHiddenIds(
  domain: UserScopedStorageDomain,
  userId?: string,
): string[] {
  return readIdList({ domain, kind: "hidden", userId });
}

export function markUserScopedFallbackId(
  domain: UserScopedStorageDomain,
  userId: string | undefined,
  id: string,
): void {
  addId({ domain, id, kind: "fallback", userId });
}

export function unmarkUserScopedFallbackId(
  domain: UserScopedStorageDomain,
  userId: string | undefined,
  id: string,
): void {
  removeId({ domain, id, kind: "fallback", userId });
}

export function markUserScopedHiddenId(
  domain: UserScopedStorageDomain,
  userId: string | undefined,
  id: string,
): void {
  addId({ domain, id, kind: "hidden", userId });
}
