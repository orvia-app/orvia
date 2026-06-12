"use client";

import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";

import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import {
  submitFeedbackViaApi,
  type FeedbackMetadata,
  type FeedbackType,
} from "@/lib/feedback-api";
import type { TranslationKey } from "@/lib/i18n";

const FEEDBACK_MESSAGE_MAX_LENGTH = 5000;

const feedbackTypeOptions: {
  labelKey: TranslationKey;
  value: FeedbackType;
}[] = [
  { value: "general", labelKey: "feedback.typeGeneral" },
  { value: "bug", labelKey: "feedback.typeBug" },
  { value: "idea", labelKey: "feedback.typeIdea" },
  { value: "confusing", labelKey: "feedback.typeConfusing" },
  { value: "missing_feature", labelKey: "feedback.typeMissingFeature" },
];

type FeedbackDialogProps = {
  accessToken?: string;
  initialType?: FeedbackType;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  source: FeedbackMetadata["source"];
};

export function FeedbackDialog({
  accessToken,
  initialType = "general",
  onOpenChange,
  open,
  source,
}: FeedbackDialogProps) {
  const { locale, t } = useI18n();
  const titleId = useId();
  const descriptionId = useId();
  const [type, setType] = useState<FeedbackType>(initialType);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setType(initialType);
    setMessage("");
    setSubmitError(null);
    setSubmitted(false);

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && !submitting) {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [initialType, onOpenChange, open, submitting]);

  if (!open) {
    return null;
  }

  const trimmedMessage = message.trim();
  const messageIsValid =
    trimmedMessage.length > 0 &&
    trimmedMessage.length <= FEEDBACK_MESSAGE_MAX_LENGTH;
  const submitDisabled = submitting || submitted || !accessToken || !messageIsValid;

  async function handleSubmit(): Promise<void> {
    if (!accessToken || !messageIsValid || submitting) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await submitFeedbackViaApi(
        {
          type,
          message: trimmedMessage,
          metadata: {
            locale,
            route:
              typeof window === "undefined"
                ? undefined
                : window.location.pathname,
            source,
          },
        },
        { accessToken },
      );
      setMessage("");
      setSubmitted(true);
    } catch {
      setSubmitError(t("feedback.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-zinc-950/55 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm dark:bg-black/65 sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onOpenChange(false);
        }
      }}
      role="presentation"
    >
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xl shadow-zinc-950/15 dark:border-zinc-800/80 dark:bg-zinc-950 dark:shadow-black/40"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-base font-semibold tracking-tight text-zinc-950 dark:text-white"
              id={titleId}
            >
              {t("feedback.title")}
            </h2>
            <p
              className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400"
              id={descriptionId}
            >
              {t("feedback.description")}
            </p>
          </div>
          <button
            type="button"
            aria-label={t("common.close")}
            disabled={submitting}
            onClick={() => onOpenChange(false)}
            className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-500 ring-1 ring-zinc-200/80 transition hover:bg-zinc-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-400 dark:ring-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-violet-200"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {submitted ? (
          <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20">
            {t("feedback.success")}
          </div>
        ) : (
          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
          >
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                {t("feedback.typeLabel")}
              </span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as FeedbackType)}
                className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-400/30 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-violet-500/40"
              >
                {feedbackTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                {t("feedback.messageLabel")}
              </span>
              <textarea
                value={message}
                onChange={(event) => {
                  setMessage(event.target.value);
                  setSubmitError(null);
                }}
                maxLength={FEEDBACK_MESSAGE_MAX_LENGTH}
                placeholder={t("feedback.placeholder")}
                className="mt-2 min-h-36 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-400/30 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-600 dark:focus:border-violet-500/40"
              />
            </label>

            <div className="flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-500">
              <span>{t("feedback.privacyNote")}</span>
              <span>
                {message.length}/{FEEDBACK_MESSAGE_MAX_LENGTH}
              </span>
            </div>

            {!accessToken ? (
              <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200/80 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/20">
                {t("feedback.signInRequired")}
              </p>
            ) : null}

            {submitError ? (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200/80 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-500/20">
                {submitError}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                className="w-full sm:w-auto"
                disabled={submitting}
                onClick={() => onOpenChange(false)}
                type="button"
                variant="secondary"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="w-full sm:w-auto"
                disabled={submitDisabled}
                type="submit"
              >
                {submitting ? t("feedback.submitting") : t("feedback.submit")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
