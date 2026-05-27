import type { AuthSession } from "@/core/auth/types";
import type { BackendError } from "@/core/backend/errors";

export type BackendRuntime = "local" | "server" | "supabase";

export type BackendReadiness =
  | { ready: true; runtime: BackendRuntime }
  | { ready: false; runtime: BackendRuntime; reason: string };

export type BackendResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: BackendError };

export type BackendRequestContext = {
  requestId: string;
  session: AuthSession;
  workspaceId?: string;
};

export type BackendMutationMetadata = {
  actorUserId?: string;
  deviceId?: string;
  requestId?: string;
  source: "local" | "server" | "sync" | "integration" | "ai";
};
