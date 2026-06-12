export const STORAGE_KEYS = {
  tasks: "personal-os.tasks",
  notes: "personal-os.notes",
  financeTransactions: "personal-os.finance.transactions",
  cars: "personal-os.cars",
  quickCaptures: "personal-os.quick-captures",
  theme: "personal-os.theme",
  language: "personal-os.language",
  localResetCompleted: "personal-os.local-reset-completed",
  onboardingCompleted: "personal-os.onboarding.completed",
  commandHistory: "personal-os.command-history",
  betaAnalyticsAnonymousId: "personal-os.beta-analytics.anonymous-id",
  betaAnalyticsEvents: "personal-os.beta-analytics.events",
} as const;

export type StorageKeyName = keyof typeof STORAGE_KEYS;

export type StorageKey = (typeof STORAGE_KEYS)[StorageKeyName];

export type UserScopedStorageDomain = "tasks" | "notes" | "quick-captures";

const ORVIA_STORAGE_PREFIX = "personal-os.";
const USER_SCOPED_STORAGE_PREFIX = "personal-os.user";

export function listStorageKeys(): StorageKey[] {
  return Object.values(STORAGE_KEYS);
}

export function getUserScopedStorageKey(
  userId: string,
  domain: UserScopedStorageDomain,
): string {
  return `${USER_SCOPED_STORAGE_PREFIX}.${userId}.${domain}`;
}

export function getUserScopedFallbackStorageKey(
  userId: string,
  domain: UserScopedStorageDomain,
): string {
  return `${USER_SCOPED_STORAGE_PREFIX}.${userId}.fallback.${domain}`;
}

export function getUserScopedHiddenStorageKey(
  userId: string,
  domain: UserScopedStorageDomain,
): string {
  return `${USER_SCOPED_STORAGE_PREFIX}.${userId}.hidden.${domain}`;
}

export function getUserScopedStoragePrefix(): string {
  return `${USER_SCOPED_STORAGE_PREFIX}.`;
}

export function getOrviaStoragePrefix(): string {
  return ORVIA_STORAGE_PREFIX;
}
