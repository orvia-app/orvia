import { NextResponse } from "next/server";

import {
  getSupabaseServerClient,
  type SupabaseNoteInsert,
  type SupabaseNoteRow,
} from "@/lib/supabase";
import { NOTE_TYPES, type NoteType } from "@/lib/notes";
import { authenticateApiRequest } from "@/server/api/auth";

const NOTE_TITLE_MAX_LENGTH = 240;
const NOTE_CONTENT_MAX_LENGTH = 20000;
const NOTE_TAG_MAX_COUNT = 25;
const NOTE_TAG_MAX_LENGTH = 64;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{ id: string }>;
};

type UpdateNoteBody = {
  title?: unknown;
  content?: unknown;
  type?: unknown;
  tags?: unknown;
  metadata?: unknown;
};

type ParsedNoteUpdate =
  | { ok: true; payload: Partial<SupabaseNoteInsert> }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseNoteTitle(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const title = value.trim();

  if (title.length === 0 || title.length > NOTE_TITLE_MAX_LENGTH) {
    return undefined;
  }

  return title;
}

function parseNoteContent(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const content = value.trim();

  if (content.length === 0) {
    return null;
  }

  if (content.length > NOTE_CONTENT_MAX_LENGTH) {
    return undefined;
  }

  return content;
}

function isNoteType(value: unknown): value is NoteType {
  return typeof value === "string" && NOTE_TYPES.includes(value as NoteType);
}

function parseTags(value: unknown): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.length > NOTE_TAG_MAX_COUNT) {
    return undefined;
  }

  const tags: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") {
      return undefined;
    }

    const tag = item.trim();

    if (tag.length === 0 || tag.length > NOTE_TAG_MAX_LENGTH) {
      return undefined;
    }

    if (!tags.includes(tag)) {
      tags.push(tag);
    }
  }

  return tags;
}

function parseMetadata(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  return value;
}

function parseUpdateNotePayload(body: UpdateNoteBody): ParsedNoteUpdate {
  const payload: Partial<SupabaseNoteInsert> = {};

  if (body.title !== undefined) {
    const title = parseNoteTitle(body.title);

    if (!title) {
      return {
        ok: false,
        error: `Title must be a non-empty string up to ${NOTE_TITLE_MAX_LENGTH} characters.`,
      };
    }

    payload.title = title;
  }

  if (body.content !== undefined) {
    const content = parseNoteContent(body.content);

    if (content === undefined) {
      return {
        ok: false,
        error: `Content must be a string, null, or ${NOTE_CONTENT_MAX_LENGTH} characters or fewer.`,
      };
    }

    payload.content = content;
  }

  if (body.type !== undefined) {
    if (!isNoteType(body.type)) {
      return {
        ok: false,
        error: "Type must be one of: note, idea, book, course, link.",
      };
    }

    payload.type = body.type;
  }

  if (body.tags !== undefined) {
    const tags = parseTags(body.tags);

    if (!tags) {
      return {
        ok: false,
        error: "Tags must be an array of non-empty strings.",
      };
    }

    payload.tags = tags;
  }

  if (body.metadata !== undefined) {
    const metadata = parseMetadata(body.metadata);

    if (!metadata) {
      return {
        ok: false,
        error: "Metadata must be a JSON object.",
      };
    }

    payload.metadata = metadata;
  }

  if (Object.keys(payload).length === 0) {
    return { ok: false, error: "At least one field is required." };
  }

  return { ok: true, payload };
}

async function getNoteId(context: RouteContext): Promise<string | null> {
  const { id } = await context.params;

  return UUID_PATTERN.test(id) ? id : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const noteId = await getNoteId(context);

  if (!noteId) {
    return NextResponse.json(
      { ok: false, error: "Note not found." },
      { status: 404 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      { ok: false, error: "Request body must be a JSON object." },
      { status: 400 },
    );
  }

  const parsedPayload = parseUpdateNotePayload(body);

  if (!parsedPayload.ok) {
    return NextResponse.json(
      { ok: false, error: parsedPayload.error },
      { status: 400 },
    );
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("notes")
    .update(parsedPayload.payload)
    .eq("id", noteId)
    .eq("user_id", auth.userId)
    .is("deleted_at", null)
    .select("*")
    .returns<SupabaseNoteRow>()
    .maybeSingle();

  if (error) {
    console.error("Failed to update note in Supabase.", error.message);

    return NextResponse.json(
      { ok: false, error: "Failed to update note." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "Note not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, note: data }, { status: 200 });
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await authenticateApiRequest(request);

  if (!auth.ok) {
    return auth.response;
  }

  const noteId = await getNoteId(context);

  if (!noteId) {
    return NextResponse.json(
      { ok: false, error: "Note not found." },
      { status: 404 },
    );
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("notes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", noteId)
    .eq("user_id", auth.userId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to soft delete note in Supabase.", error.message);

    return NextResponse.json(
      { ok: false, error: "Failed to delete note." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "Note not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
