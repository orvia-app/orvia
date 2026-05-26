import {
  isBrowserStorageAvailable,
  parseStoredJson,
  stringifyStoredJson,
  type StorageAdapter,
  type StorageEntry,
  type StorageReadOptions,
  type StorageWriteOptions,
} from "@/core/storage/storage-adapter";

export function createLocalStorageAdapter(): StorageAdapter {
  function getValue<T>({ key, fallback }: StorageReadOptions<T>): T {
    if (!isBrowserStorageAvailable()) {
      return fallback;
    }

    try {
      return parseStoredJson(window.localStorage.getItem(key), fallback);
    } catch {
      return fallback;
    }
  }

  return {
    get<T>(options: StorageReadOptions<T>): T {
      return getValue(options);
    },

    set<T>({ key, value }: StorageWriteOptions<T>): void {
      if (!isBrowserStorageAvailable()) {
        return;
      }

      const serialized = stringifyStoredJson(value);

      if (serialized === null) {
        return;
      }

      try {
        window.localStorage.setItem(key, serialized);
      } catch {
        // Storage can fail in private mode, quota limits, or locked-down browsers.
      }
    },

    remove(key: string): void {
      if (!isBrowserStorageAvailable()) {
        return;
      }

      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignore storage removal errors so UI flows remain resilient.
      }
    },

    readMany<T>(entries: readonly StorageEntry<T>[]): Record<string, T> {
      return entries.reduce<Record<string, T>>((accumulator, entry) => {
        accumulator[entry.key] = getValue(entry);
        return accumulator;
      }, {});
    },
  };
}

export const localStorageAdapter = createLocalStorageAdapter();
