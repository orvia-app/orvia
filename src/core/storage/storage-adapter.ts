export type StorageReadOptions<T> = {
  key: string;
  fallback: T;
};

export type StorageWriteOptions<T> = {
  key: string;
  value: T;
};

export type StorageEntry<T> = {
  key: string;
  fallback: T;
};

export interface StorageAdapter {
  get<T>(options: StorageReadOptions<T>): T;
  set<T>(options: StorageWriteOptions<T>): void;
  remove(key: string): void;
  readMany<T>(entries: readonly StorageEntry<T>[]): Record<string, T>;
}

export function isBrowserStorageAvailable(): boolean {
  return typeof window !== "undefined" && "localStorage" in window;
}

export function parseStoredJson<T>(rawValue: string | null, fallback: T): T {
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

export function stringifyStoredJson(value: unknown): string | null {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}
