type SupabaseDiagnosticError = {
  code?: string;
  details?: string | null;
  hint?: string | null;
  message: string;
};

type SupabaseQueryContext = Record<
  string,
  boolean | number | string | null | undefined
>;

export function logSupabaseQueryError(
  message: string,
  error: SupabaseDiagnosticError,
  context: SupabaseQueryContext,
): void {
  console.error(message, {
    code: error.code ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
    message: error.message,
    ...context,
  });
}
