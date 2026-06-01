"use client";

import { useEffect, useId } from "react";

import { Button } from "@/components/ui/Button";

type ConfirmDialogTone = "danger" | "default";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: ConfirmDialogTone;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirming?: boolean;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone,
  onConfirm,
  onCancel,
  confirming = false,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && !confirming) {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [confirming, onCancel, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-zinc-950/55 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm dark:bg-black/65 sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !confirming) {
          onCancel();
        }
      }}
      role="presentation"
    >
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xl shadow-zinc-950/15 dark:border-zinc-800/80 dark:bg-zinc-950 dark:shadow-black/40"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div>
          <h2
            className="text-base font-semibold tracking-tight text-zinc-950 dark:text-white"
            id={titleId}
          >
            {title}
          </h2>
          <p
            className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400"
            id={descriptionId}
          >
            {description}
          </p>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            className="w-full sm:w-auto"
            disabled={confirming}
            onClick={onCancel}
            type="button"
            variant="secondary"
          >
            {cancelLabel}
          </Button>
          <Button
            className="w-full sm:w-auto"
            disabled={confirming}
            onClick={() => {
              void onConfirm();
            }}
            type="button"
            variant={tone === "danger" ? "danger" : "primary"}
          >
            {confirming ? "Working..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
