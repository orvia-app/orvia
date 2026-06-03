import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getRequiredServerEnv } from "@/env/server";

export type SupabaseTaskRow = {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high" | "critical";
  workspace_id: string | null;
  due_date: string | null;
  created_at: string;
  deleted_at: string | null;
  [key: string]: unknown;
};

export type SupabaseTaskInsert = {
  user_id?: string | null;
  title: string;
  description?: string | null;
  status?: SupabaseTaskRow["status"];
  priority?: SupabaseTaskRow["priority"];
  workspace_id?: string | null;
  due_date?: string | null;
  deleted_at?: string | null;
};

export type SupabaseNoteRow = {
  id: string;
  user_id: string | null;
  title: string;
  content: string | null;
  type: "note" | "idea" | "book" | "course" | "link";
  tags: string[];
  source: "local" | "api" | "import" | "telegram" | "system";
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  [key: string]: unknown;
};

export type SupabaseNoteInsert = {
  user_id?: string | null;
  title: string;
  content?: string | null;
  type?: SupabaseNoteRow["type"];
  tags?: string[];
  source?: SupabaseNoteRow["source"];
  metadata?: Record<string, unknown>;
  deleted_at?: string | null;
};

export type SupabaseActivityType =
  | "task_created"
  | "task_updated"
  | "task_deleted"
  | "note_created"
  | "note_updated"
  | "note_deleted"
  | "inbox_processed"
  | "quick_capture_created"
  | "local_import_completed"
  | "system_event";

export type SupabaseActivityEntityType =
  | "task"
  | "note"
  | "inbox"
  | "quick_capture"
  | "sync"
  | "system";

export type SupabaseActivityRow = {
  id: string;
  user_id: string;
  type: SupabaseActivityType;
  entity_type: SupabaseActivityEntityType;
  entity_id: string | null;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
  deleted_at: string | null;
  [key: string]: unknown;
};

export type SupabaseActivityInsert = {
  user_id?: string;
  type: SupabaseActivityType;
  entity_type: SupabaseActivityEntityType;
  entity_id?: string | null;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
  occurred_at?: string;
  deleted_at?: string | null;
};

export type SupabaseCaptureStatus = "inbox" | "processed" | "archived";

export type SupabaseCaptureSource =
  | "quick_capture"
  | "manual"
  | "import"
  | "telegram"
  | "system";

export type SupabaseCaptureRow = {
  id: string;
  user_id: string;
  content: string;
  source: SupabaseCaptureSource;
  status: SupabaseCaptureStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  [key: string]: unknown;
};

export type SupabaseCaptureInsert = {
  user_id?: string;
  content: string;
  source?: SupabaseCaptureSource;
  status?: SupabaseCaptureStatus;
  metadata?: Record<string, unknown>;
  deleted_at?: string | null;
};

export type SupabaseDatabase = {
  public: {
    Tables: {
      tasks: {
        Row: SupabaseTaskRow;
        Insert: SupabaseTaskInsert;
        Update: Partial<SupabaseTaskInsert>;
        Relationships: [];
      };
      notes: {
        Row: SupabaseNoteRow;
        Insert: SupabaseNoteInsert;
        Update: Partial<SupabaseNoteInsert>;
        Relationships: [];
      };
      activities: {
        Row: SupabaseActivityRow;
        Insert: SupabaseActivityInsert;
        Update: Partial<SupabaseActivityInsert>;
        Relationships: [];
      };
      captures: {
        Row: SupabaseCaptureRow;
        Insert: SupabaseCaptureInsert;
        Update: Partial<SupabaseCaptureInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let cachedClient: SupabaseClient<SupabaseDatabase> | null = null;

export function getSupabaseServerClient(): SupabaseClient<SupabaseDatabase> {
  if (cachedClient) {
    return cachedClient;
  }

  const env = getRequiredServerEnv([
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]);
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server configuration is incomplete.");
  }

  cachedClient = createClient<SupabaseDatabase>(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return cachedClient;
}
