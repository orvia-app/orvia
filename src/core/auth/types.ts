export type AuthProvider = "email" | "oauth" | "anonymous";

export type AuthSessionStatus =
  | "anonymous"
  | "authenticated"
  | "expired"
  | "signed-out";

export type AuthUserId = `user:${string}`;

export type AuthWorkspaceRole = "owner" | "admin" | "member" | "viewer";

export type AuthUserProfile = {
  id: AuthUserId;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  timezone?: string;
  locale?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthSession = {
  status: AuthSessionStatus;
  user?: AuthUserProfile;
  provider?: AuthProvider;
  issuedAt?: string;
  expiresAt?: string;
};

export type WorkspaceMembership = {
  userId: AuthUserId;
  workspaceId: string;
  role: AuthWorkspaceRole;
  createdAt?: string;
  updatedAt?: string;
};

export type AccountDeletionRequest = {
  userId: AuthUserId;
  requestedAt: string;
  confirmedAt?: string;
  scheduledDeletionAt?: string;
  status: "requested" | "confirmed" | "cancelled" | "completed";
};
