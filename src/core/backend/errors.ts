export type BackendErrorCode =
  | "not-configured"
  | "unauthenticated"
  | "forbidden"
  | "not-found"
  | "validation-error"
  | "conflict"
  | "rate-limited"
  | "provider-error"
  | "unknown";

export type BackendErrorSeverity = "info" | "warning" | "error";

export type BackendError = {
  code: BackendErrorCode;
  message: string;
  severity: BackendErrorSeverity;
  retryable: boolean;
  cause?: unknown;
};

export function createBackendError(
  code: BackendErrorCode,
  message: string,
  options: {
    severity?: BackendErrorSeverity;
    retryable?: boolean;
    cause?: unknown;
  } = {},
): BackendError {
  return {
    code,
    message,
    severity: options.severity ?? "error",
    retryable: options.retryable ?? false,
    cause: options.cause,
  };
}

export function isBackendError(value: unknown): value is BackendError {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<BackendError>;

  return (
    typeof candidate.code === "string" &&
    typeof candidate.message === "string" &&
    typeof candidate.severity === "string" &&
    typeof candidate.retryable === "boolean"
  );
}
