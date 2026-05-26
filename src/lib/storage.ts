import { STORAGE_KEYS } from "@/core/storage/keys";
import { localStorageAdapter } from "@/core/storage/local-storage-adapter";
import { isBrowserStorageAvailable } from "@/core/storage/storage-adapter";

export { STORAGE_KEYS } from "@/core/storage/keys";

export function isBrowser(): boolean {
  return isBrowserStorageAvailable();
}

export function safeReadStorage<T>(
  key: string,
  fallback: T,
): T {
  return localStorageAdapter.get({ key, fallback });
}

export function safeWriteStorage<T>(
  key: string,
  value: T,
): void {
  localStorageAdapter.set({ key, value });
}

export function safeRemoveStorage(key: string): void {
  localStorageAdapter.remove(key);
}

export function hasCompletedLocalDataReset(): boolean {
  return safeReadStorage<unknown>(
    STORAGE_KEYS.localResetCompleted,
    false,
  ) === true;
}

export function markLocalDataResetCompleted(): void {
  safeWriteStorage(STORAGE_KEYS.localResetCompleted, true);
}
