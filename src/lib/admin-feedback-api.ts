import type {
  SupabaseFeedbackStatus,
  SupabaseFeedbackType,
} from "@/lib/supabase";

export type AdminFeedbackItem = {
  created_at: string;
  id: string;
  message: string;
  status: SupabaseFeedbackStatus;
  type: SupabaseFeedbackType;
  user_id: string;
};

type AdminFeedbackListResponse =
  | { ok: true; feedback: AdminFeedbackItem[] }
  | { ok: false; error?: string };

type AdminFeedbackUpdateResponse =
  | { ok: true; feedback: AdminFeedbackItem }
  | { ok: false; error?: string };

export class AdminFeedbackApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminFeedbackApiError";
    this.status = status;
  }
}

export async function fetchAdminFeedbackViaApi({
  accessToken,
}: {
  accessToken: string;
}): Promise<AdminFeedbackItem[]> {
  const response = await fetch("/api/admin/feedback", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const payload = (await response.json().catch(() => null)) as
    | AdminFeedbackListResponse
    | null;

  if (!payload) {
    throw new AdminFeedbackApiError(
      "Failed to fetch feedback.",
      response.status,
    );
  }

  if (!response.ok || !payload.ok) {
    throw new AdminFeedbackApiError(
      payload.ok ? "Failed to fetch feedback." : (payload.error ?? "Failed to fetch feedback."),
      response.status,
    );
  }

  return payload.feedback;
}

export async function updateAdminFeedbackStatusViaApi(
  id: string,
  status: SupabaseFeedbackStatus,
  {
    accessToken,
  }: {
    accessToken: string;
  },
): Promise<AdminFeedbackItem> {
  const response = await fetch(`/api/admin/feedback/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
  const payload = (await response.json().catch(() => null)) as
    | AdminFeedbackUpdateResponse
    | null;

  if (!payload) {
    throw new AdminFeedbackApiError(
      "Failed to update feedback.",
      response.status,
    );
  }

  if (!response.ok || !payload.ok) {
    throw new AdminFeedbackApiError(
      payload.ok ? "Failed to update feedback." : (payload.error ?? "Failed to update feedback."),
      response.status,
    );
  }

  return payload.feedback;
}
