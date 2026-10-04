import type { CreateCaptureApiInput } from "@/lib/captures-api";

export type CaptureIntent = "auto" | "task" | "note" | "event";
export type CaptureInputError = "required" | "tooLong";

export function buildCaptureInput(
  title: string,
  details: string,
  intent: CaptureIntent,
): { ok: true; value: CreateCaptureApiInput } | { ok: false; error: CaptureInputError } {
  const trimmedTitle = title.trim();
  const trimmedDetails = details.trim();
  if (!trimmedTitle) return { ok: false, error: "required" };
  const content = trimmedDetails ? `${trimmedTitle}\n\n${trimmedDetails}` : trimmedTitle;
  if (content.length > 10000) return { ok: false, error: "tooLong" };
  return { ok: true, value: {
    content,
    source: "quick_capture",
    status: "inbox",
    metadata: { intent },
  } };
}
