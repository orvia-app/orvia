export type FeedbackType =
  | "bug"
  | "idea"
  | "confusing"
  | "missing_feature"
  | "general";

export type FeedbackMetadata = {
  locale?: "en" | "ua";
  route?: string;
  source?: "app_shell" | "settings";
  theme?: "dark" | "light" | "system";
};

export type SubmitFeedbackInput = {
  type: FeedbackType;
  message: string;
  metadata?: FeedbackMetadata;
};

export type SubmitFeedbackResult = {
  id: string;
  type: FeedbackType;
  status: "new" | "reviewed" | "planned" | "closed";
  created_at: string;
};

type SubmitFeedbackResponse =
  | { ok: true; feedback: SubmitFeedbackResult }
  | { ok: false; error?: string };

export async function submitFeedbackViaApi(
  input: SubmitFeedbackInput,
  { accessToken }: { accessToken: string },
): Promise<SubmitFeedbackResult> {
  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const payload = (await response.json().catch(() => null)) as
    | SubmitFeedbackResponse
    | null;

  if (!payload) {
    throw new Error("Failed to send feedback.");
  }

  if (!response.ok || !payload.ok) {
    throw new Error(payload.ok ? "Failed to send feedback." : payload.error);
  }

  return payload.feedback;
}
