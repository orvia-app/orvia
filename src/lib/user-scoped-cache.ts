import {
  getUserScopedStorageKey,
  type UserScopedStorageDomain,
} from "@/core/storage/keys";
import { safeReadStorage, safeWriteStorage } from "@/lib/storage";

type Validator<T> = (value: unknown) => value is T;

function normalizeUserId(userId: string | undefined): string | null {
  const normalized = userId?.trim();

  return normalized ? normalized : null;
}

export function readUserScopedList<T>({
  domain,
  userId,
  validate,
}: {
  domain: UserScopedStorageDomain;
  userId?: string;
  validate: Validator<T>;
}): T[] {
  const normalizedUserId = normalizeUserId(userId);

  if (!normalizedUserId) {
    return [];
  }

  const value = safeReadStorage<unknown>(
    getUserScopedStorageKey(normalizedUserId, domain),
    [],
  );

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(validate);
}

export function writeUserScopedList<T>({
  domain,
  items,
  userId,
}: {
  domain: UserScopedStorageDomain;
  items: readonly T[];
  userId?: string;
}): void {
  const normalizedUserId = normalizeUserId(userId);

  if (!normalizedUserId) {
    return;
  }

  safeWriteStorage(getUserScopedStorageKey(normalizedUserId, domain), items);
}

