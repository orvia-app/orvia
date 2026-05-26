"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { X } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getNotes,
  NOTE_TYPES,
  saveNotes,
  type Note,
  type NoteType,
} from "@/lib/notes";
import {
  getEntityContext,
  getLocalContextEntities,
  getRelatedContextSubtitle,
  type EntityContext,
} from "@/lib/memory/context";

type FilterValue = "all" | NoteType;

type NoteFormState = {
  title: string;
  content: string;
  type: NoteType;
};

type NoteContextById = Record<string, EntityContext>;

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "All", value: "all" },
  { label: "Notes", value: "note" },
  { label: "Ideas", value: "idea" },
  { label: "Books", value: "book" },
  { label: "Courses", value: "course" },
  { label: "Links", value: "link" },
];

const EMPTY_FORM: NoteFormState = {
  title: "",
  content: "",
  type: "note",
};

function getTypeBadgeLabel(type: NoteType): string {
  switch (type) {
    case "note":
      return "Note";

    case "idea":
      return "Idea";

    case "book":
      return "Book";

    case "course":
      return "Course";

    case "link":
      return "Link";
  }
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteContextById, setNoteContextById] = useState<NoteContextById>({});
  const [typeFilter, setTypeFilter] = useState<FilterValue>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<NoteFormState>(EMPTY_FORM);

  useEffect(() => {
    const nextNotes = getNotes();
    const entities = getLocalContextEntities();

    setNotes(nextNotes);
    setNoteContextById(
      Object.fromEntries(
        entities
          .filter((entity) => entity.type === "note")
          .map((entity) => [
            entity.sourceId,
            getEntityContext(entity, entities),
          ]),
      ),
    );
  }, []);

  const filteredNotes = useMemo(() => {
    if (typeFilter === "all") {
      return notes;
    }

    return notes.filter((note) => note.type === typeFilter);
  }, [notes, typeFilter]);

  function openModal(): void {
    setModalOpen(true);
  }

  function closeModal(): void {
    setModalOpen(false);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const title = form.title.trim();
    const content = form.content.trim();

    if (!title || !content) {
      return;
    }

    const newNote: Note = {
      id: crypto.randomUUID(),
      title,
      content,
      type: form.type,
    };

    const nextNotes = [newNote, ...notes];

    setNotes(nextNotes);
    saveNotes(nextNotes);
    const entities = getLocalContextEntities();
    setNoteContextById(
      Object.fromEntries(
        entities
          .filter((entity) => entity.type === "note")
          .map((entity) => [
            entity.sourceId,
            getEntityContext(entity, entities),
          ]),
      ),
    );
    closeModal();
  }

  return (
    <AppShell>
      <main className="px-4 py-6 sm:p-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                Notes
              </h1>

              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-500 sm:text-base">
                Capture ideas, books, courses, and useful knowledge.
              </p>
            </div>

            <button
              type="button"
              onClick={openModal}
              className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm shadow-zinc-950/[0.03] ring-1 ring-zinc-200/80 transition hover:bg-zinc-50 hover:ring-zinc-300 dark:bg-zinc-950 dark:text-zinc-200 dark:shadow-none dark:ring-zinc-800 dark:hover:bg-zinc-900 dark:hover:ring-zinc-700"
            >
              + New Note
            </button>
          </div>

          <div className="app-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            {FILTERS.map(({ label, value }) => {
              const active = typeFilter === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTypeFilter(value)}
                  className={
                    active
                      ? "rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-950"
                      : "rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-950 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {filteredNotes.map((note) => {
              const context = noteContextById[note.id];

              return (
                <article
                  key={note.id}
                  className="rounded-2xl bg-white p-5 shadow-sm shadow-zinc-950/[0.025] ring-1 ring-zinc-200/70 transition hover:bg-zinc-50/70 hover:ring-zinc-300 dark:bg-zinc-950 dark:shadow-none dark:ring-zinc-800/70 dark:hover:bg-zinc-900/70 dark:hover:ring-zinc-700 sm:p-6"
                >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold text-zinc-950 dark:text-white sm:text-xl">
                    {note.title}
                  </h2>

                  <Badge className="shrink-0">
                    {getTypeBadgeLabel(note.type)}
                  </Badge>
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
                        Connected context
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
                      Connected to
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
                </article>
              );
            })}
          </div>

          {filteredNotes.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                title="No notes here"
                description="Create a note or switch filters to see saved knowledge."
              />
            </div>
          ) : null}
        </div>
      </main>

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
                New note
              </h2>

              <button
                type="button"
                aria-label="Close"
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
                  Title <span className="text-red-400">*</span>
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
                  placeholder="Note title"
                />
              </div>

              <div>
                <label
                  htmlFor="note-content"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Content <span className="text-red-400">*</span>
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
                  placeholder="Write anything worth remembering..."
                />
              </div>

              <div>
                <label
                  htmlFor="note-type"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Type
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
                      {getTypeBadgeLabel(type)}
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
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
