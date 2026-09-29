"use client";
import { Input, Textarea } from "@/components/ui/Field";


import { usePresence } from "@/components/ui/usePresence";
import { useDialogFocus } from "@/components/ui/useDialogFocus";

import { useEffect, useState, type FormEvent, type RefObject } from "react";
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
  const dialogRef = useDialogFocus(Boolean(action));

  const { present, closing } = usePresence(Boolean(action));
  const [lastType, setLastType] = useState(action?.type);
  useEffect(() => { if (action) setLastType(action.type); }, [action]);

  if (!present) {
    return null;
  }

  const isTask = (action?.type ?? lastType) === "create-task";
  const title = isTask ? t("command.dialogCreateTask") : t("command.dialogCreateNote");
  const description = isTask
    ? t("command.dialogTaskDescription")
    : t("command.dialogNoteDescription");

  return (
    <div
      data-presence={closing ? "exiting" : "entered"}
      inert={closing}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-zinc-950/60 p-4 dark:bg-black/70 sm:items-center"
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
        className="orvia-dialog max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-line bg-surface p-6 shadow-2xl shadow-zinc-950/15 dark:shadow-black/40"
        role="dialog"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="command-action-title"
              className="text-lg font-semibold text-foreground"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {description}
            </p>
          </div>
          <Button
            aria-label={t("common.close")}
            className="h-8 w-8 p-0 text-zinc-700 hover:text-foreground dark:hover:text-white"
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
                className="block text-sm font-medium text-muted"
              >
                {t("common.title")} <span className="text-red-400">*</span>
              </label>
              <Input
                id="command-task-title"
                ref={firstFieldRef}
                required
                value={taskTitle}
                onChange={(event) => onTaskTitleChange(event.target.value)}
                className="mt-1.5 w-full"
                placeholder={t("tasks.titlePlaceholder")}
              />
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="command-note-title"
                  className="block text-sm font-medium text-muted"
                >
                  {t("common.title")} <span className="text-red-400">*</span>
                </label>
                <Input
                  id="command-note-title"
                  ref={firstFieldRef}
                  required
                  value={noteTitle}
                  onChange={(event) => onNoteTitleChange(event.target.value)}
                  className="mt-1.5 w-full"
                  placeholder={t("notes.titlePlaceholder")}
                />
              </div>
              <div>
                <label
                  htmlFor="command-note-content"
                  className="block text-sm font-medium text-muted"
                >
                  {t("common.content")} <span className="text-red-400">*</span>
                </label>
                <Textarea
                  id="command-note-content"
                  required
                  rows={5}
                  value={noteContent}
                  onChange={(event) =>
                    onNoteContentChange(event.target.value)
                  }
                  className="mt-1.5 w-full"
                  placeholder={t("notes.contentPlaceholder")}
                />
              </div>
            </>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:flex-wrap sm:justify-end">
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
