import { listStorageKeys } from "@/core/storage/keys";
import {
  markLocalDataResetCompleted,
  safeRemoveStorage,
  STORAGE_KEYS,
} from "@/lib/storage";

export type PersonalOsStorageKeyName = keyof typeof STORAGE_KEYS;

export type PersonalOsStorageKey =
  (typeof STORAGE_KEYS)[PersonalOsStorageKeyName];

export function listPersonalOsStorageKeys(): PersonalOsStorageKey[] {
  return listStorageKeys();
}

export function resetLocalPersonalOsData(): void {
  listPersonalOsStorageKeys().forEach((key) => safeRemoveStorage(key));
  markLocalDataResetCompleted();
}
