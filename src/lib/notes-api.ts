import { NOTE_TYPES, type Note, type NoteType } from "@/lib/notes";

type ApiNoteRow = {
  id?: unknown;
  title?: unknown;
  content?: unknown;
  type?: unknown;
};

type CreateNoteApiResponse = {
  ok?: unknown;
  note?: unknown;
  error?: unknown;
};

type ListNotesApiResponse = {
  ok?: unknown;
  notes?: unknown;
  error?: unknown;
};

export type CreateNoteApiInput = {
  title: string;
  content?: string | null;
  type?: NoteType;
  tags?: string[];
  metadata?: Record<string, unknown>;
};

export type NotesApiRequestOptions = {
  accessToken?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNoteType(value: unknown): value is NoteType {
  return typeof value === "string" && NOTE_TYPES.includes(value as NoteType);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function getAuthorizationHeaders(
  options: NotesApiRequestOptions = {},
): HeadersInit | undefined {
  const accessToken = options.accessToken?.trim();

  if (!accessToken) {
    return undefined;
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

function mapApiNoteToNote(row: ApiNoteRow): Note | null {
  const id = optionalString(row.id);
  const title = optionalString(row.title);

  if (!id || !title) {
    return null;
  }

  return {
    id,
    title,
    content: optionalString(row.content) ?? "",
    type: isNoteType(row.type) ? row.type : "note",
  };
}

function parseCreateNoteResponse(value: unknown): Note | null {
  if (!isRecord(value)) {
    return null;
  }

  const response: CreateNoteApiResponse = value;

  if (response.ok !== true || !isRecord(response.note)) {
    return null;
  }

  return mapApiNoteToNote(response.note);
}

function parseListNotesResponse(value: unknown): Note[] | null {
  if (!isRecord(value)) {
    return null;
  }

  const response: ListNotesApiResponse = value;

  if (response.ok !== true || !Array.isArray(response.notes)) {
    return null;
  }

  const mappedNotes = response.notes.map((note) =>
    isRecord(note) ? mapApiNoteToNote(note) : null,
  );

  if (mappedNotes.some((note) => note === null)) {
    return null;
  }

  const notesById = new Map<string, Note>();

  for (const note of mappedNotes) {
    if (note && !notesById.has(note.id)) {
      notesById.set(note.id, note);
    }
  }

  return Array.from(notesById.values());
}

export async function fetchNotesViaApi(
  options: NotesApiRequestOptions = {},
): Promise<Note[]> {
  const response = await fetch("/api/notes", {
    method: "GET",
    cache: "no-store",
    headers: getAuthorizationHeaders(options),
  });

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch {
    throw new Error("Notes response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error("Notes request failed.");
  }

  const notes = parseListNotesResponse(responseBody);

  if (!notes) {
    throw new Error("Notes response shape was invalid.");
  }

  return notes;
}

export async function createNoteViaApi(
  input: CreateNoteApiInput,
  options: NotesApiRequestOptions = {},
): Promise<Note> {
  const response = await fetch("/api/notes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthorizationHeaders(options),
    },
    body: JSON.stringify(input),
  });

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch {
    throw new Error("Note create response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error("Note create request failed.");
  }

  const note = parseCreateNoteResponse(responseBody);

  if (!note) {
    throw new Error("Note create response shape was invalid.");
  }

  return note;
}
