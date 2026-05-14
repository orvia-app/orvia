"use client";

import { useEffect, useState, type FormEvent } from "react";

import { AppShell } from "@/components/AppShell";

type NoteType = "note" | "idea" | "book" | "course" | "link";

type Note = {
  id: string;
  title: string;
  content: string;
  type: NoteType;
};

const NOTES_STORAGE_KEY = "personal-os.notes";

const NOTE_TYPES: NoteType[] = ["note", "idea", "book", "course", "link"];

function isNoteType(value: unknown): value is NoteType {
  return (
    typeof value === "string" &&
    (NOTE_TYPES as readonly string[]).includes(value)
  );
}

function isNoteRecord(value: unknown): value is Note {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.content === "string" &&
    isNoteType(o.type)
  );
}

function parseNotesFromStorage(raw: string): Note[] | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data) || !data.every(isNoteRecord)) return null;
    return data;
  } catch {
    return null;
  }
}

type FilterValue = "all" | NoteType;

const initialNotes: Note[] = [
  {
    id: "1",
    title: "Personal OS idea",
    content: "Add AI weekly review and Telegram reminders.",
    type: "idea",
  },
  {
    id: "2",
    title: "DevOps course",
    content: "Track Docker, Kubernetes, CI/CD learning progress.",
    type: "course",
  },
  {
    id: "3",
    title: "Book list",
    content: "Atomic Habits, Deep Work, The Psychology of Money.",
    type: "book",
  },
];

const filters: { label: string; value: FilterValue }[] = [
  { label: "All", value: "all" },
  { label: "Notes", value: "note" },
  { label: "Ideas", value: "idea" },
  { label: "Books", value: "book" },
  { label: "Courses", value: "course" },
  { label: "Links", value: "link" },
];

function typeBadgeLabel(type: NoteType): string {
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

const emptyForm = {
  title: "",
  content: "",
  type: "note" as NoteType,
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [storageReady, setStorageReady] = useState(false);
  const [typeFilter, setTypeFilter] = useState<FilterValue>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(NOTES_STORAGE_KEY);
      if (raw) {
        const parsed = parseNotesFromStorage(raw);
        if (parsed) setNotes(parsed);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !storageReady) return;
    try {
      window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    } catch {
      /* ignore quota / private mode */
    }
  }, [notes, storageReady]);

  const filtered =
    typeFilter === "all"
      ? notes
      : notes.filter((n) => n.type === typeFilter);

  function openModal() {
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm(emptyForm);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const title = form.title.trim();
    const content = form.content.trim();
    if (!title || !content) return;

    const newNote: Note = {
      id: Date.now().toString(),
      title,
      content,
      type: form.type,
    };

    setNotes((prev) => [...prev, newNote]);
    closeModal();
  }

  return (
    <AppShell>
      <div className="p-6 sm:p-10">
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
            {filters.map(({ label, value }) => {
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

          <div className="mt-8 space-y-4">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-100/80 px-6 py-14 text-center dark:border-zinc-800 dark:bg-zinc-950/50">
                <p className="text-sm text-zinc-600 dark:text-zinc-500">
                  No notes match this filter.
                </p>
              </div>
            ) : (
              filtered.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-zinc-950 dark:text-white sm:text-xl">
                        {note.title}
                      </h2>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
                        {note.content}
                      </p>
                    </div>
                    <span className="inline-flex w-fit shrink-0 rounded-full bg-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 sm:text-sm">
                      {typeBadgeLabel(note.type)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/70 p-4 dark:bg-black/70 sm:items-center"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-note-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                  placeholder="Short title"
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
                  rows={5}
                  value={form.content}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, content: e.target.value }))
                  }
                  className="mt-1.5 w-full resize-y rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                  placeholder="Write it down…"
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
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      type: e.target.value as NoteType,
                    }))
                  }
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-black dark:text-white dark:focus:border-zinc-600 dark:focus:ring-zinc-600"
                >
                  <option value="note">note</option>
                  <option value="idea">idea</option>
                  <option value="book">book</option>
                  <option value="course">course</option>
                  <option value="link">link</option>
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
