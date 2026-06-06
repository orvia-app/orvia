"use client";

import type { FormEvent, RefObject } from "react";
import { X } from "lucide-react";

import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import type { CommandAction } from "@/lib/commands/types";

type CreatableCommandAction = Extract<
  CommandAction,
  { type: "create-task" } | { type: "create-note" }
>;

type CommandActionDialogProps = {
  action: CreatableCommandAction | null;
  firstFieldRef: RefObject<HTMLInputElement | null>;
  noteContent: string;
  noteTitle: string;
  onClose: () => void;
  onNoteContentChange: (content: string) => void;
  onNoteTitleChange: (title: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTaskTitleChange: (title: string) => void;
  taskTitle: string;
};

export function CommandActionDialog({
  action,
  firstFieldRef,
  noteContent,
  noteTitle,
  onClose,
  onNoteContentChange,
  onNoteTitleChange,
  onSubmit,
  onTaskTitleChange,
  taskTitle,
}: CommandActionDialogProps) {
  const { t } = useI18n();

  if (!action) {
    return null;
  }

  const isTask = action.type === "create-task";
  const title = isTask ? t("command.dialogCreateTask") : t("command.dialogCreateNote");
  const description = isTask
    ? t("command.dialogTaskDescription")
    : t("command.dialogNoteDescription");

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-zinc-950/60 p-4 backdrop-blur-sm dark:bg-black/70 sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        aria-labelledby="command-action-title"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl shadow-zinc-950/15 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/40"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="command-action-title"
              className="text-lg font-semibold text-zinc-950 dark:text-white"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {description}
            </p>
          </div>
          <Button
            aria-label={t("common.close")}
            className="h-8 w-8 p-0 text-zinc-700 hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white"
            onClick={onClose}
            type="button"
            variant="ghost"
          >
            <X className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2.25} />
          </Button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          {isTask ? (
            <div>
              <label
                htmlFor="command-task-title"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {t("common.title")} <span className="text-red-400">*</span>
              </label>
              <input
                id="command-task-title"
                ref={firstFieldRef}
                required
                value={taskTitle}
                onChange={(event) => onTaskTitleChange(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                placeholder={t("tasks.titlePlaceholder")}
              />
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="command-note-title"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {t("common.title")} <span className="text-red-400">*</span>
                </label>
                <input
                  id="command-note-title"
                  ref={firstFieldRef}
                  required
                  value={noteTitle}
                  onChange={(event) => onNoteTitleChange(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                  placeholder={t("notes.titlePlaceholder")}
                />
              </div>
              <div>
                <label
                  htmlFor="command-note-content"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {t("common.content")} <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="command-note-content"
                  required
                  rows={5}
                  value={noteContent}
                  onChange={(event) =>
                    onNoteContentChange(event.target.value)
                  }
                  className="mt-1.5 w-full resize-y rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                  placeholder={t("notes.contentPlaceholder")}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit">
              {isTask ? t("command.dialogCreateTask") : t("command.dialogCreateNote")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
