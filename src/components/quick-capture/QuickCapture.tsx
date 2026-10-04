"use client";
import { usePresence } from "@/components/ui/usePresence";
import { Input, Textarea } from "@/components/ui/Field";


import { useEffect, useRef, useState, type FormEvent } from "react";
import { CalendarDays, CheckSquare, FileText, Inbox, X } from "lucide-react";

import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { useDialogFocus } from "@/components/ui/useDialogFocus";
import { SuccessToast, useSuccessToast } from "@/components/ui/SuccessToast";
import {
  createCaptureFromPrimarySource,
} from "@/lib/captures-api";
import { notifyCaptureCreated } from "@/lib/capture-events";
import { buildCaptureInput, type CaptureIntent } from "@/lib/capture-intent";
import { captureIntentLabelKeys } from "@/lib/inbox-presentation";

type QuickCaptureProps = {
  accessToken?: string;
  ownerId?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

const captureTypes: {
  value: CaptureIntent;
}[] = [
  {
    value: "auto",
  },
  {
    value: "task",
  },
  {
    value: "note",
  },
  {
    value: "event",
  },
];

export function QuickCapture({
  accessToken,
  ownerId,
  onOpenChange,
  open,
}: QuickCaptureProps) {
  const { t } = useI18n();
  const dialogRef = useDialogFocus(open);
  const { present: overlayPresent, closing: overlayClosing } = usePresence(open);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [captureType, setCaptureType] = useState<CaptureIntent>("auto");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const { toast, showSuccessToast, dismissSuccessToast } = useSuccessToast();

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      titleInputRef.current?.focus();
    });

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  useEffect(() => {
    if (overlayPresent) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setCaptureType("auto");
      setTitle("");
      setDetails("");
      setError(null);
      setSubmitting(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [overlayPresent]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    const input = buildCaptureInput(title, details, captureType);
    if (!input.ok) {
      setError(t(input.error === "required" ? "quickCapture.requiredError" : "quickCapture.tooLong"));
      return;
    }

    submittingRef.current = true;
    setError(null);
    setSubmitting(true);

    try {
      const result = await createCaptureFromPrimarySource(
        input.value,
        { accessToken, ownerId },
      );

      showSuccessToast(
        t("quickCapture.savedCloud"),
        result.source === "cloud" ? undefined : t("quickCapture.savedDevice"),
      );
      setTitle("");
      setDetails("");
      setSubmitting(false);
      submittingRef.current = false;
      notifyCaptureCreated();
      onOpenChange(false);

    } catch {
      setError(t("quickCapture.error"));
      setSubmitting(false);
      submittingRef.current = false;
    }
  }

  return (
    <>
      <SuccessToast toast={toast} onDismiss={dismissSuccessToast} />

      {overlayPresent ? (
        <div
          data-presence={overlayClosing ? "exiting" : "entered"}
          inert={overlayClosing}
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/55 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:bg-black/70 sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onOpenChange(false);
            }
          }}
        >
          <div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-capture-title"
            className="orvia-dialog max-h-[calc(100dvh-2rem)] overflow-y-auto w-full max-w-lg rounded-xl border border-line bg-surface p-5 shadow-2xl shadow-zinc-950/15 dark:shadow-black/40 sm:p-6"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("quickCapture.eyebrow")}
                </p>
                <h2
                  id="quick-capture-title"
                  className="mt-1 text-lg font-semibold text-foreground"
                >
                  {t("quickCapture.title")}
                </h2>
                <p className="mt-1 max-w-sm text-sm leading-5 text-muted">
                  {accessToken
                    ? t("quickCapture.authDescription")
                    : t("quickCapture.localDescription")}
                </p>
              </div>
              <button
                type="button"
                aria-label={t("common.close")}
                onClick={() => onOpenChange(false)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/70 dark:hover:bg-zinc-800 dark:hover:text-white dark:focus-visible:ring-zinc-600"
              >
                <X
                  className="h-4 w-4 shrink-0"
                  aria-hidden
                  strokeWidth={2.25}
                />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {captureTypes.map((type) => {
                const active = captureType === type.value;
                const Icon = type.value === "task" ? CheckSquare : type.value === "note" ? FileText : type.value === "event" ? CalendarDays : Inbox;

                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setCaptureType(type.value)}
                    className={
                      active
                        ? "flex items-center gap-2 rounded-xl bg-accent-soft px-3 py-2.5 text-left text-sm font-medium text-accent"
                        : "flex items-center gap-2 rounded-xl bg-subtle px-3 py-2.5 text-left text-sm font-medium text-muted ring-1 ring-line transition hover:bg-surface hover:text-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-white"
                    }
                    aria-pressed={active}
                    title={t(`quickCapture.${type.value}Description`)}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {t(captureIntentLabelKeys[type.value])}
                  </button>
                );
              })}
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="quick-capture-title-input"
                  className="block text-sm font-medium text-muted"
                >
                  {t("quickCapture.fieldLabel")}{" "}
                  <span className="text-red-400">*</span>
                </label>
                <Input
                  id="quick-capture-title-input"
                  ref={titleInputRef}
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="mt-1.5 w-full"
                  placeholder={
                    t("quickCapture.prompt")
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="quick-capture-details"
                  className="block text-sm font-medium text-muted"
                >
                  {t("quickCapture.detailsLabel")}
                </label>
                <Textarea
                  id="quick-capture-details"
                  rows={4}
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  className="mt-1.5 w-full"
                  placeholder={
                    t("quickCapture.detailsPlaceholder")
                  }
                />
              </div>

              {error ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? t("quickCapture.submitting")
                    : t("quickCapture.submit")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
