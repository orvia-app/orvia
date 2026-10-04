"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";

import { useI18n } from "@/components/i18n/I18nProvider";

type SuccessToastState = {
  id: number;
  message: string;
  detail?: string;
};

export const SUCCESS_TOAST_DURATION_MS = 4000;

export function useSuccessToast() {
  const nextId = useRef(0);
  const [toast, setToast] = useState<SuccessToastState | null>(null);

  const showSuccessToast = useCallback((message: string, detail?: string) => {
    nextId.current += 1;
    setToast({ id: nextId.current, message, detail });
  }, []);
  const dismissSuccessToast = useCallback(() => setToast(null), []);

  return { toast, showSuccessToast, dismissSuccessToast };
}

export function SuccessToast({
  toast,
  onDismiss,
}: {
  toast: SuccessToastState | null;
  onDismiss: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onDismiss, SUCCESS_TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-4 right-4 z-[80] mx-auto max-w-sm sm:left-auto sm:mx-0 lg:bottom-[calc(1rem+env(safe-area-inset-bottom))]"
    >
      {toast ? (
        <div
          key={toast.id}
          className="orvia-success-toast pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-foreground shadow-lg shadow-zinc-950/10 dark:shadow-black/30"
        >
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
            <Check className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={2.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-5">{toast.message}</p>
            {toast.detail ? <p className="mt-1 text-xs leading-5 text-muted">{toast.detail}</p> : null}
          </div>
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={onDismiss}
            className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
