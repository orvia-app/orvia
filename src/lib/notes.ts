import {
  hasCompletedLocalDataReset,
  safeReadStorage,
  safeWriteStorage,
  STORAGE_KEYS,
} from "@/lib/storage";

export type NoteType = "note" | "idea" | "book" | "course" | "link";

export type Note = {
  id: string;
  title: string;
  content: string;
  type: NoteType;
};

export const NOTE_TYPES: readonly NoteType[] = [
  "note",
  "idea",
  "book",
  "course",
  "link",
];

export const initialNotes: Note[] = [
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

export function isNote(value: unknown): value is Note {
  if (!value || typeof value !== "object") {
    return false;
  }

  const note = value as Partial<Note>;

  return (
    typeof note.id === "string" &&
    typeof note.title === "string" &&
    note.title.trim().length > 0 &&
    typeof note.content === "string" &&
    note.content.trim().length > 0 &&
    NOTE_TYPES.includes(note.type as NoteType)
  );
}

export function getNotes(): Note[] {
  const storedNotes = safeReadStorage<unknown[]>(
    STORAGE_KEYS.notes,
    [],
  );

  const validNotes = Array.isArray(storedNotes)
    ? storedNotes.filter(isNote)
    : [];

  if (hasCompletedLocalDataReset()) {
    return validNotes;
  }

  return validNotes.length > 0 ? validNotes : initialNotes;
}

export function getStoredNotes(): Note[] {
  const storedNotes = safeReadStorage<unknown[]>(
    STORAGE_KEYS.notes,
    [],
  );

  return Array.isArray(storedNotes) ? storedNotes.filter(isNote) : [];
}

export function saveNotes(notes: Note[]): void {
  safeWriteStorage(STORAGE_KEYS.notes, notes);
}

export function createNote(note: Note): Note[] {
  const notes = getNotes();
  const nextNotes = [note, ...notes];

  saveNotes(nextNotes);

  return nextNotes;
}
