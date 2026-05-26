export type CaptureSource = "manual" | "command" | "inbox" | "import";

export type CapturePipelineStage =
  | "normalize"
  | "classify"
  | "enrich"
  | "suggest"
  | "preview"
  | "persist";

export type CaptureInput = {
  text: string;
  source: CaptureSource;
  capturedAt?: string;
};

export type CapturePipelineResult<TPreview> = {
  input: CaptureInput;
  normalizedText: string;
  preview: TPreview;
  stages: readonly CapturePipelineStage[];
};
