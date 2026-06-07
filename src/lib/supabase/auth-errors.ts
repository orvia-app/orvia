function getErrorMessage(error: unknown): string | null {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return null;
}

function getErrorName(error: unknown): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    typeof error.name === "string"
  ) {
    return error.name;
  }

  return null;
}

function getErrorCode(error: unknown): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return null;
}

export function isInvalidSupabaseRefreshTokenError(error: unknown): boolean {
  const message = getErrorMessage(error)?.toLowerCase();
  const code = getErrorCode(error);

  return (
    code === "refresh_token_not_found" ||
    message?.includes("invalid refresh token") === true ||
    message?.includes("refresh token not found") === true ||
    message?.includes("refresh token is not valid") === true ||
    message?.includes("refresh_token_not_found") === true
  );
}

export function isSupabaseAuthSessionMissingError(error: unknown): boolean {
  const name = getErrorName(error);
  const message = getErrorMessage(error)?.toLowerCase();
  const code = getErrorCode(error);

  return (
    code === "session_not_found" ||
    name === "AuthSessionMissingError" ||
    message?.includes("auth session missing") === true ||
    message?.includes("missing auth session") === true ||
    message?.includes("session_not_found") === true
  );
}

export function isExpectedSupabaseSignedOutError(error: unknown): boolean {
  return (
    isInvalidSupabaseRefreshTokenError(error) ||
    isSupabaseAuthSessionMissingError(error)
  );
}
