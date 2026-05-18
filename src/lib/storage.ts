export const STORAGE_KEYS = {
    tasks: "personal-os.tasks",
    notes: "personal-os.notes",
    financeTransactions: "personal-os.finance.transactions",
    cars: "personal-os.cars",
    quickCaptures: "personal-os.quick-captures",
    theme: "personal-os.theme",
  } as const;
  
  export function isBrowser(): boolean {
    return typeof window !== "undefined";
  }
  
  export function safeReadStorage<T>(
    key: string,
    fallback: T,
  ): T {
    if (!isBrowser()) {
      return fallback;
    }
  
    try {
      const item = window.localStorage.getItem(key);
  
      if (!item) {
        return fallback;
      }
  
      return JSON.parse(item) as T;
    } catch {
      return fallback;
    }
  }
  
  export function safeWriteStorage<T>(
    key: string,
    value: T,
  ): void {
    if (!isBrowser()) {
      return;
    }
  
    try {
      window.localStorage.setItem(
        key,
        JSON.stringify(value),
      );
    } catch {
      // ignore storage write errors
    }
  }