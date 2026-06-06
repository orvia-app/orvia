"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { X } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { useAuthSession } from "@/components/auth/useAuthSession";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Page, PageHeader } from "@/components/ui/Page";
import {
  recordNoteCreatedActivity,
  recordNoteDeletedActivity,
  recordNoteUpdatedActivity,
} from "@/lib/activity-recording";
import {
  NOTE_TYPES,
  saveNotes,
  type Note,
  type NoteType,
} from "@/lib/notes";
import {
  createNoteFromPrimarySource,
  deleteNoteViaApi,
  loadNotesFromPrimarySourceWithBoundary,
  saveCachedNotesForOwner,
  type NoteSourceById,
  type PrimaryNoteSource,
  updateNoteViaApi,
} from "@/lib/notes-api";
import {
  getContextEntitiesFromRecords,
  getEntityContext,
  getRelatedContextSubtitle,
  type EntityContext,
} from "@/lib/memory/context";
import type { TranslationKey } from "@/lib/i18n";

type FilterValue = "all" | NoteType;

type NoteFormState = {
  title: string;
  content: string;
  type: NoteType;
};

type NoteContextById = Record<string, EntityContext>;

function buildNoteContextById(notes: readonly Note[]): NoteContextById {
  const entities = getContextEntitiesFromRecords({ notes });

  return Object.fromEntries(
    entities
      .filter((entity) => entity.type === "note")
      .map((entity) => [
        entity.sourceId,
        getEntityContext(entity, entities),
      ]),
  );
}

const FILTERS: { labelKey: TranslationKey; value: FilterValue }[] = [
  { labelKey: "notes.filterAll", value: "all" },
  { labelKey: "notes.typeNote", value: "note" },
  { labelKey: "notes.typeIdea", value: "idea" },
  { labelKey: "notes.typeBook", value: "book" },
  { labelKey: "notes.typeCourse", value: "course" },
  { labelKey: "notes.typeLink", value: "link" },
];

const EMPTY_FORM: NoteFormState = {
  title: "",
  content: "",
  type: "note",
};

function noteTypeLabelKey(type: NoteType): TranslationKey {
  switch (type) {
    case "note":
      return "notes.typeNote";

    case "idea":
      return "notes.typeIdea";

    case "book":
      return "notes.typeBook";

    case "course":
      return "notes.typeCourse";

    case "link":
      return "notes.typeLink";
  }
}

function noteSourceLabelKey(source: PrimaryNoteSource): TranslationKey {
  if (source === "cloud") {
    return "source.cloud";
  }

  if (source === "local-fallback") {
    return "source.localFallback";
  }

  return "source.localOnly";
}

export default function NotesPage() {
  const { session } = useAuthSession();
  const { t } = useI18n();
  const accessToken = session?.access_token;
  const ownerId = session?.user.id;
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteSource, setNoteSource] = useState<PrimaryNoteSource>("local-only");
  const [noteSourcesById, setNoteSourcesById] = useState<NoteSourceById>({});
  const [noteContextById, setNoteContextById] = useState<NoteContextById>({});
  const [typeFilter, setTypeFilter] = useState<FilterValue>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<NoteFormState>(EMPTY_FORM);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<NoteFormState>(EMPTY_FORM);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [pendingNoteIds, setPendingNoteIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [noteActionError, setNoteActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadNotes(): Promise<void> {
      const result = await loadNotesFromPrimarySourceWithBoundary({
        accessToken,
        ownerId,
      });

      if (!active) {
        return;
      }

      setNotes(result.notes);
      setNoteSource(result.source);
      setNoteSourcesById(result.noteSources);
      setNoteContextById(buildNoteContextById(result.notes));
    }

    void loadNotes();

    return () => {
      active = false;
    };
  }, [accessToken, ownerId]);

  const filteredNotes = useMemo(() => {
    if (typeFilter === "all") {
      return notes;
    }

    return notes.filter((note) => note.type === typeFilter);
  }, [notes, typeFilter]);
  const noteBoundaryMessage = accessToken
    ? noteSource === "local-fallback"
      ? t("source.notesFallback")
      : t("notes.accountMessage")
    : t("source.notesDevice");

  function openModal(): void {
    setModalOpen(true);
  }

  function closeModal(): void {
    setModalOpen(false);
    setForm(EMPTY_FORM);
  }

  function syncNotes(
    nextNotes: Note[],
    sourceOverrides: NoteSourceById = {},
  ): void {
    if (accessToken) {
      saveCachedNotesForOwner(ownerId, nextNotes);
    } else {
      saveNotes(nextNotes);
    }
    setNotes(nextNotes);
    setNoteSourcesById((currentSources) => {
      const nextSources: NoteSourceById = {};
      const defaultSource: PrimaryNoteSource = accessToken
        ? noteSource === "local-fallback"
          ? "local-fallback"
          : "cloud"
        : "local-only";

      for (const note of nextNotes) {
        nextSources[note.id] =
          sourceOverrides[note.id] ?? currentSources[note.id] ?? defaultSource;
      }

      return nextSources;
    });

    setNoteContextById(buildNoteContextById(nextNotes));
  }

  function setNotePending(noteId: string, pending: boolean): void {
    setPendingNoteIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (pending) {
        nextIds.add(noteId);
      } else {
        nextIds.delete(noteId);
      }

      return nextIds;
    });
  }

  function startEditingNote(note: Note): void {
    setNoteActionError(null);
    setEditingNoteId(note.id);
    setEditForm({
      title: note.title,
      content: note.content,
      type: note.type,
    });
  }

  function cancelEditingNote(): void {
    setEditingNoteId(null);
    setEditForm(EMPTY_FORM);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const title = form.title.trim();
    const content = form.content.trim();

    if (!title || !content) {
      return;
    }

    const result = await createNoteFromPrimarySource(
      {
        title,
        content,
        type: form.type,
      },
      { accessToken, ownerId },
    );

    syncNotes(
      [result.note, ...notes.filter((note) => note.id !== result.note.id)],
      {
        [result.note.id]:
          result.source === "api"
            ? "cloud"
            : accessToken
              ? "local-fallback"
              : "local-only",
      },
    );
    closeModal();

    if (accessToken && result.source === "api") {
      void recordNoteCreatedActivity(result.note, { accessToken });
    } else if (accessToken && result.source === "local") {
      setNoteActionError(t("notes.createFallback"));
    }
  }

  async function saveNoteEdits(note: Note): Promise<void> {
    if (pendingNoteIds.has(note.id)) {
      return;
    }

    const title = editForm.title.trim();
    const content = editForm.content.trim();

    if (!title || !content) {
      return;
    }

    setNoteActionError(null);
    setNotePending(note.id, true);

    try {
      const updatedNote = accessToken
        ? await updateNoteViaApi(
            note.id,
            {
              title,
              content,
              type: editForm.type,
            },
            { accessToken, ownerId },
          )
        : {
            ...note,
            title,
            content,
            type: editForm.type,
          };

      const nextNotes = notes.map((currentNote) =>
        currentNote.id === note.id ? updatedNote : currentNote,
      );

      syncNotes(nextNotes);
      cancelEditingNote();

      if (accessToken) {
        void recordNoteUpdatedActivity(updatedNote, { accessToken });
      }
    } catch {
      const fallbackNote: Note = {
        ...note,
        title,
        content,
        type: editForm.type,
      };
      const nextNotes = notes.map((currentNote) =>
        currentNote.id === note.id ? fallbackNote : currentNote,
      );

      syncNotes(nextNotes, { [note.id]: "local-fallback" });
      cancelEditingNote();
      setNoteActionError(t("notes.updateFallback"));
    } finally {
      setNotePending(note.id, false);
    }
  }

  async function confirmDeleteNote(): Promise<void> {
    const note = noteToDelete;

    if (!note || pendingNoteIds.has(note.id)) {
      return;
    }

    setNoteActionError(null);
    setNotePending(note.id, true);

    try {
      if (accessToken) {
        await deleteNoteViaApi(note.id, { accessToken, ownerId });
      }

      syncNotes(notes.filter((currentNote) => currentNote.id !== note.id));

      if (accessToken) {
        void recordNoteDeletedActivity(note, { accessToken });
      }
    } catch {
      syncNotes(notes.filter((currentNote) => currentNote.id !== note.id));
      setNoteActionError(t("notes.deleteFallback"));
    } finally {
      setNotePending(note.id, false);
      setNoteToDelete(null);
      if (editingNoteId === note.id) {
        cancelEditingNote();
      }
    }
  }

  return (
    <AppShell>
      <Page>
        <PageHeader
          eyebrow={t("notes.eyebrow")}
          title={t("notes.title")}
          description={t("notes.description")}
          actions={
            <Button type="button" onClick={openModal} variant="secondary">
              {t("notes.new")}
            </Button>
          }
        />

          <Card
            variant={noteSource === "local-fallback" ? "secondary" : "ghost"}
            className="mt-5 p-3 text-sm text-zinc-600 dark:text-zinc-400"
          >
            {noteBoundaryMessage}
          </Card>

          <div className="app-scrollbar -mx-4 mt-7 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            {FILTERS.map(({ labelKey, value }) => {
              const active = typeFilter === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTypeFilter(value)}
                  className={
                    active
                      ? "rounded-xl bg-violet-800 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-violet-950/10 dark:bg-violet-600/85"
                      : "rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm shadow-zinc-950/[0.02] ring-1 ring-zinc-200/80 transition hover:bg-violet-50/70 hover:text-violet-800 hover:ring-violet-200/70 dark:bg-zinc-900/60 dark:text-zinc-400 dark:ring-zinc-800 dark:hover:bg-violet-500/10 dark:hover:text-violet-200 dark:hover:ring-violet-500/20"
                  }
                >
                  {t(labelKey)}
                </button>
              );
            })}
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {noteActionError ? (
              <p
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200 md:col-span-2"
                role="status"
              >
                {noteActionError}
              </p>
            ) : null}

            {filteredNotes.map((note) => {
              const context = noteContextById[note.id];
              const editing = editingNoteId === note.id;
              const notePending = pendingNoteIds.has(note.id);

              return (
                <article
                  key={note.id}
                  className="rounded-2xl bg-white/90 p-5 shadow-sm shadow-zinc-950/[0.035] ring-1 ring-zinc-200/75 transition hover:bg-white hover:ring-violet-200/65 dark:bg-zinc-900/70 dark:shadow-none dark:ring-zinc-800/75 dark:hover:bg-zinc-900 dark:hover:ring-violet-500/20 sm:p-5"
                >
                  {editing ? (
                    <form
                      className="space-y-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void saveNoteEdits(note);
                      }}
                    >
                      <div>
                        <label
                          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                          htmlFor={`edit-note-title-${note.id}`}
                        >
                          {t("common.title")} <span className="text-red-400">*</span>
                        </label>
                        <input
                          className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 disabled:opacity-60 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                          disabled={notePending}
                          id={`edit-note-title-${note.id}`}
                          onChange={(event) =>
                            setEditForm((currentForm) => ({
                              ...currentForm,
                              title: event.target.value,
                            }))
                          }
                          required
                          value={editForm.title}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                          htmlFor={`edit-note-content-${note.id}`}
                        >
                          {t("common.content")} <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          className="mt-1.5 w-full resize-y rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 disabled:opacity-60 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                          disabled={notePending}
                          id={`edit-note-content-${note.id}`}
                          onChange={(event) =>
                            setEditForm((currentForm) => ({
                              ...currentForm,
                              content: event.target.value,
                            }))
                          }
                          required
                          rows={5}
                          value={editForm.content}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                          htmlFor={`edit-note-type-${note.id}`}
                        >
                          {t("common.type")}
                        </label>
                        <select
                          className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 disabled:opacity-60 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                          disabled={notePending}
                          id={`edit-note-type-${note.id}`}
                          onChange={(event) =>
                            setEditForm((currentForm) => ({
                              ...currentForm,
                              type: event.target.value as NoteType,
                            }))
                          }
                          value={editForm.type}
                        >
                          {NOTE_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {t(noteTypeLabelKey(type))}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                        <Button
                          className="w-full sm:w-auto"
                          disabled={notePending}
                          onClick={cancelEditingNote}
                          variant="secondary"
                        >
                          {t("common.cancel")}
                        </Button>
                        <Button
                          className="w-full sm:w-auto"
                          disabled={notePending}
                          type="submit"
                        >
                          {notePending ? t("common.saving") : t("common.saveChanges")}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <h2 className="text-lg font-semibold text-zinc-950 dark:text-white sm:text-xl">
                          {note.title}
                        </h2>

                        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                          <Badge>{t(noteTypeLabelKey(note.type))}</Badge>
                          <Badge className="bg-zinc-100/80 text-zinc-500 ring-zinc-200/70 dark:bg-zinc-900/75 dark:text-zinc-400 dark:ring-zinc-800/80">
                            {t(noteSourceLabelKey(noteSourcesById[note.id] ?? noteSource))}
                          </Badge>
                        </div>
                      </div>
                      {context ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {context.labels.slice(0, 2).map((label) => (
                            <span
                              key={label}
                              className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200/80 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800"
                            >
                              {label}
                            </span>
                          ))}
                          {context.relatedCount > 0 ? (
                            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900/70 dark:text-zinc-400">
                              {t("notes.connectedContext")}
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-600 dark:text-zinc-400 sm:text-base">
                        {note.content}
                      </p>
                      {context && context.relatedItems.length > 0 ? (
                        <div className="mt-4 rounded-xl bg-zinc-100/60 px-3 py-2.5 ring-1 ring-inset ring-zinc-200/60 dark:bg-zinc-900/35 dark:ring-zinc-800/70">
                          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                            {t("notes.connectedTo")}
                          </p>
                          <div className="mt-2 space-y-1.5">
                            {context.relatedItems.slice(0, 2).map((item) => (
                              <p
                                key={item.entity.id}
                                className="truncate text-sm text-zinc-700 dark:text-zinc-300"
                              >
                                {item.entity.title}
                                <span className="text-zinc-400 dark:text-zinc-600">
                                  {" "}
                                  · {getRelatedContextSubtitle(item)}
                                </span>
                              </p>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-5 flex flex-col gap-2 border-t border-zinc-200/70 pt-3.5 dark:border-zinc-800/70 sm:flex-row sm:justify-end">
                        <Button
                          className="w-full px-3 py-1.5 text-xs sm:w-auto"
                          disabled={notePending}
                          onClick={() => startEditingNote(note)}
                          variant="secondary"
                        >
                          {t("common.edit")}
                        </Button>
                        <Button
                          className="w-full border border-red-200/70 px-3 py-1.5 text-xs text-red-700 shadow-none hover:bg-red-50 hover:text-red-800 hover:ring-red-200/70 dark:border-red-500/20 dark:text-red-300 dark:hover:bg-red-500/10 dark:hover:text-red-200 dark:hover:ring-red-500/25 sm:w-auto"
                          disabled={notePending}
                          onClick={() => setNoteToDelete(note)}
                          variant="ghost"
                        >
                          {t("common.delete")}
                        </Button>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>

          {filteredNotes.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                title={t("notes.emptyTitle")}
                description={t("notes.emptyDescription")}
              />
            </div>
          ) : null}
      </Page>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/70 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:bg-black/70 sm:items-center sm:p-4"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-note-title"
            className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 sm:max-h-[90vh] sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2
                id="new-note-title"
                className="text-lg font-semibold text-zinc-950 dark:text-white"
              >
                {t("notes.newNote")}
              </h2>

              <button
                type="button"
                aria-label={t("common.close")}
                onClick={closeModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/70 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white dark:focus-visible:ring-zinc-600"
              >
                <X className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2.25} />
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="note-title"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {t("common.title")} <span className="text-red-400">*</span>
                </label>

                <input
                  id="note-title"
                  required
                  value={form.title}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      title: event.target.value,
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                  placeholder={t("notes.titlePlaceholder")}
                />
              </div>

              <div>
                <label
                  htmlFor="note-content"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {t("common.content")} <span className="text-red-400">*</span>
                </label>

                <textarea
                  id="note-content"
                  required
                  rows={6}
                  value={form.content}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      content: event.target.value,
                    }))
                  }
                  className="mt-1.5 w-full resize-y rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                  placeholder={t("notes.contentPlaceholder")}
                />
              </div>

              <div>
                <label
                  htmlFor="note-type"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {t("common.type")}
                </label>

                <select
                  id="note-type"
                  value={form.type}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      type: event.target.value as NoteType,
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                >
                  {NOTE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t(noteTypeLabelKey(type))}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-zinc-300 bg-transparent px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  {t("common.cancel")}
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                >
                  {t("common.create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        cancelLabel={t("common.cancel")}
        confirmLabel={t("notes.deleteNote")}
        confirming={noteToDelete ? pendingNoteIds.has(noteToDelete.id) : false}
        description={
          noteToDelete
            ? t("notes.deleteDescription").replace("{title}", noteToDelete.title)
            : t("notes.deleteFallbackDescription")
        }
        onCancel={() => {
          if (!noteToDelete || !pendingNoteIds.has(noteToDelete.id)) {
            setNoteToDelete(null);
          }
        }}
        onConfirm={confirmDeleteNote}
        open={noteToDelete !== null}
        title={t("notes.deleteTitle")}
        tone="danger"
      />
    </AppShell>
  );
}
