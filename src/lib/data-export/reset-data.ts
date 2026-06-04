import {
  getOrviaStoragePrefix,
  listStorageKeys,
} from "@/core/storage/keys";
import {
  isBrowser,
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

  if (isBrowser()) {
    const orviaStoragePrefix = getOrviaStoragePrefix();
    const orviaStorageKeys: string[] = [];

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);

      if (key?.startsWith(orviaStoragePrefix)) {
        orviaStorageKeys.push(key);
      }
    }

    orviaStorageKeys.forEach((key) => safeRemoveStorage(key));
  }
}
