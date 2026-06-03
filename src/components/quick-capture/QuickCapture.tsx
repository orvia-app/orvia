"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { CheckSquare, FileText, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  createCaptureFromPrimarySource,
  type PrimaryCaptureSource,
} from "@/lib/captures-api";

type QuickCaptureIntent = "task" | "note";

type QuickCaptureProps = {
  accessToken?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

const captureTypes: {
  label: string;
  value: QuickCaptureIntent;
  description: string;
}[] = [
  {
    label: "Task",
    value: "task",
    description: "Capture something likely to become a task.",
  },
  {
    label: "Note",
    value: "note",
    description: "Capture something likely to become a note.",
  },
];

export function QuickCapture({
  accessToken,
  onOpenChange,
  open,
}: QuickCaptureProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [captureType, setCaptureType] = useState<QuickCaptureIntent>("task");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    if (open) {
      return;
    }

    setCaptureType("task");
    setTitle("");
    setDetails("");
    setError(null);
    setStatus(null);
    setSubmitting(false);
  }, [open]);

  if (!open) {
    return null;
  }

  function captureStatusMessage(source: PrimaryCaptureSource): string {
    if (source === "cloud") {
      return "Capture saved to your Inbox.";
    }

    if (source === "local-fallback") {
      return "Sync is unavailable. Capture saved on this device.";
    }

    return "Capture saved on this device.";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedDetails = details.trim();

    if (!trimmedTitle) {
      setError("Add a title to capture this.");
      return;
    }

    setError(null);
    setStatus(null);
    setSubmitting(true);

    try {
      const content = trimmedDetails
        ? `${trimmedTitle}\n\n${trimmedDetails}`
        : trimmedTitle;
      const result = await createCaptureFromPrimarySource(
        {
          content,
          source: "quick_capture",
          status: "inbox",
          metadata: {
            intent: captureType,
            title: trimmedTitle,
          },
        },
        { accessToken },
      );

      setStatus(captureStatusMessage(result.source));

      window.setTimeout(() => onOpenChange(false), 350);
    } catch {
      setError("Could not capture this. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/55 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm dark:bg-black/70 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-capture-title"
        className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl shadow-zinc-950/15 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/40 sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
              Quick Capture
            </p>
            <h2
              id="quick-capture-title"
              className="mt-1 text-lg font-semibold text-zinc-950 dark:text-white"
            >
              Capture anything
            </h2>
            <p className="mt-1 max-w-sm text-sm leading-5 text-zinc-500 dark:text-zinc-500">
              {accessToken
                ? "Captures save to your Inbox. If sync is unavailable, they stay on this device."
                : "Captures are saved on this device until you sign in."}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/70 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white dark:focus-visible:ring-zinc-600"
          >
            <X className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2.25} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {captureTypes.map((type) => {
            const active = captureType === type.value;
            const Icon = type.value === "task" ? CheckSquare : FileText;

            return (
              <button
                key={type.value}
                type="button"
                onClick={() => setCaptureType(type.value)}
                className={
                  active
                    ? "flex items-center gap-2 rounded-xl bg-zinc-950 px-3 py-2.5 text-left text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-950"
                    : "flex items-center gap-2 rounded-xl bg-zinc-100/70 px-3 py-2.5 text-left text-sm font-medium text-zinc-700 ring-1 ring-zinc-200/60 transition hover:bg-white hover:text-zinc-950 dark:bg-zinc-900/45 dark:text-zinc-300 dark:ring-zinc-800/70 dark:hover:bg-zinc-900 dark:hover:text-white"
                }
                aria-pressed={active}
                title={type.description}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {type.label}
              </button>
            );
          })}
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="quick-capture-title-input"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="quick-capture-title-input"
              ref={titleInputRef}
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
              placeholder={
                captureType === "task"
                  ? "Remind me to follow up"
                  : "Idea worth remembering"
              }
            />
          </div>

          <div>
            <label
              htmlFor="quick-capture-details"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Details
            </label>
            <textarea
              id="quick-capture-details"
              rows={4}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              className="mt-1.5 w-full resize-y rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
              placeholder={
                captureType === "task"
                  ? "Optional task context"
                  : "Optional note content"
              }
            />
          </div>

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          {status ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              {status}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Capturing..." : "Capture"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
