import {
  parseInboxInput,
  type InboxPreviewResult,
} from "@/lib/inbox";
import type {
  CaptureInput,
  CapturePipelineResult,
  CapturePipelineStage,
} from "@/core/capture/types";

function normalizeCaptureText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

export function runDeterministicCapturePipeline(
  input: CaptureInput,
): CapturePipelineResult<InboxPreviewResult> {
  const normalizedText = normalizeCaptureText(input.text);
  const preview = parseInboxInput(normalizedText);
  const stages: readonly CapturePipelineStage[] = [
    "normalize",
    "classify",
    "enrich",
    "suggest",
    "preview",
  ];

  return {
    input,
    normalizedText,
    preview,
    stages,
  };
}
