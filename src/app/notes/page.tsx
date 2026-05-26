"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getNotes,
  NOTE_TYPES,
  saveNotes,
  type Note,
  type NoteType,
} from "@/lib/notes";

type FilterValue = "all" | NoteType;

type NoteFormState = {
  title: string;
  content: string;
  type: NoteType;
};

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
  const [typeFilter, setTypeFilter] = useState<FilterValue>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<NoteFormState>(EMPTY_FORM);

  useEffect(() => {
    setNotes(getNotes());
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
    closeModal();
  }

  return (
    <AppShell>
      <main className="p-6 sm:p-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                Notes
              </h1>

              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-500 sm:text-base">
                Capture ideas, books, courses, and useful knowledge.
              </p>
            </div>

            <button
              type="button"
              onClick={openModal}
              className="shrink-0 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              + New Note
            </button>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
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
                      : "rounded-xl bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-300 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {filteredNotes.map((note) => (
              <article
                key={note.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold text-zinc-950 dark:text-white sm:text-xl">
                    {note.title}
                  </h2>

                  <span className="shrink-0 rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {getTypeBadgeLabel(note.type)}
                  </span>
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-600 dark:text-zinc-400 sm:text-base">
                  {note.content}
                </p>
              </article>
            ))}
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/70 p-4 dark:bg-black/70 sm:items-center"
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
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
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
                onClick={closeModal}
                className="rounded-lg px-2 py-1 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                Close
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

              <div className="flex justify-end gap-3 pt-2">
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
