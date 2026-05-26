export const STORAGE_KEYS = {
  tasks: "personal-os.tasks",
  notes: "personal-os.notes",
  financeTransactions: "personal-os.finance.transactions",
  cars: "personal-os.cars",
  quickCaptures: "personal-os.quick-captures",
  theme: "personal-os.theme",
  localResetCompleted: "personal-os.local-reset-completed",
  onboardingCompleted: "personal-os.onboarding.completed",
  commandHistory: "personal-os.command-history",
} as const;

export type StorageKeyName = keyof typeof STORAGE_KEYS;

export type StorageKey = (typeof STORAGE_KEYS)[StorageKeyName];

export function listStorageKeys(): StorageKey[] {
  return Object.values(STORAGE_KEYS);
}
