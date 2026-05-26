import { createLocalEntityRepository } from "@/core/repositories/local-json-repository";
import { STORAGE_KEYS } from "@/lib/storage";

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

export const quickCaptureRepository =
  createLocalEntityRepository<QuickCapture>({
    key: STORAGE_KEYS.quickCaptures,
    validate: isQuickCapture,
  });

export function getQuickCaptures(): QuickCapture[] {
  return quickCaptureRepository.list();
}

export function saveQuickCaptures(captures: QuickCapture[]): void {
  quickCaptureRepository.save(captures);
}

export function createQuickCapture(capture: QuickCapture): QuickCapture[] {
  const captures = getQuickCaptures();
  const nextCaptures = [...captures, capture];

  saveQuickCaptures(nextCaptures);

  return nextCaptures;
}
