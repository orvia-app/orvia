import {
  safeReadStorage,
  safeRemoveStorage,
  safeWriteStorage,
  STORAGE_KEYS,
} from "@/lib/storage";

export function hasCompletedOnboarding(): boolean {
  return safeReadStorage<unknown>(
    STORAGE_KEYS.onboardingCompleted,
    false,
  ) === true;
}

export function completeOnboarding(): void {
  safeWriteStorage(STORAGE_KEYS.onboardingCompleted, true);
}

export function resetOnboarding(): void {
  safeRemoveStorage(STORAGE_KEYS.onboardingCompleted);
}
