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
    code === "refresh_token_already_used" ||
    (typeof message === "string" &&
      /^(invalid refresh token(?::.*)?|refresh token not found|refresh token is not valid|refresh_token_not_found)[.!]?$/.test(message))
  );
}

export function isSupabaseAuthSessionMissingError(error: unknown): boolean {
  const name = getErrorName(error);
  const message = getErrorMessage(error)?.toLowerCase();
  const code = getErrorCode(error);

  return (
    code === "session_not_found" ||
    code === "session_expired" ||
    name === "AuthSessionMissingError" ||
    (typeof message === "string" &&
      /^(auth session missing|missing auth session|session_not_found)[.!]?$/.test(message))
  );
}

export function isExpectedSupabaseSignedOutError(error: unknown): boolean {
  return (
    isInvalidSupabaseRefreshTokenError(error) ||
    isSupabaseAuthSessionMissingError(error)
  );
}
