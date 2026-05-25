import { safeReadStorage, safeWriteStorage, STORAGE_KEYS } from "@/lib/storage";

export type QuickCapture = {
  id: string;
  text: string;
  createdAt: string;
};

export function isQuickCapture(value: unknown): value is QuickCapture {
  if (!value || typeof value !== "object") {
    return false;
  }

  const capture = value as Partial<QuickCapture>;

  return (
    typeof capture.id === "string" &&
    typeof capture.text === "string" &&
    capture.text.trim().length > 0 &&
    typeof capture.createdAt === "string"
  );
}

export function getQuickCaptures(): QuickCapture[] {
  const storedCaptures = safeReadStorage<unknown[]>(
    STORAGE_KEYS.quickCaptures,
    [],
  );

  return Array.isArray(storedCaptures)
    ? storedCaptures.filter(isQuickCapture)
    : [];
}

export function saveQuickCaptures(captures: QuickCapture[]): void {
  safeWriteStorage(STORAGE_KEYS.quickCaptures, captures);
}

export function createQuickCapture(capture: QuickCapture): QuickCapture[] {
  const captures = getQuickCaptures();
  const nextCaptures = [...captures, capture];

  saveQuickCaptures(nextCaptures);

  return nextCaptures;
}
