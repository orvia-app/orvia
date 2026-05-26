import {
  markLocalDataResetCompleted,
  safeRemoveStorage,
  STORAGE_KEYS,
} from "@/lib/storage";

export type PersonalOsStorageKeyName = keyof typeof STORAGE_KEYS;

export type PersonalOsStorageKey =
  (typeof STORAGE_KEYS)[PersonalOsStorageKeyName];

export function listPersonalOsStorageKeys(): PersonalOsStorageKey[] {
  return Object.values(STORAGE_KEYS);
}

export function resetLocalPersonalOsData(): void {
  listPersonalOsStorageKeys().forEach((key) => safeRemoveStorage(key));
  markLocalDataResetCompleted();
}
