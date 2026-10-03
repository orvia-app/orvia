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
  planned_start: string | null;
  estimated_duration_minutes: number | null;
  plan_day: string | null;
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
  planned_start?: string | null;
  estimated_duration_minutes?: number | null;
  plan_day?: string | null;
};

export type SupabasePlanningPreferencesRow = {
  user_id: string;
  planning_timezone: string;
  enabled_weekdays: number[];
  local_start_time: string;
  local_end_time: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type SupabasePlanningPreferencesInsert = Pick<
  SupabasePlanningPreferencesRow,
  "user_id" | "planning_timezone" | "enabled_weekdays" | "local_start_time" | "local_end_time"
> & Partial<Pick<SupabasePlanningPreferencesRow, "version">>;

export type SupabaseTaskPlanBlockRow = {
  id: string;
  user_id: string;
  task_id: string;
  start_at: string;
  end_at: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type SupabaseTaskPlanBlockInsert = Pick<
  SupabaseTaskPlanBlockRow,
  "id" | "user_id" | "task_id" | "start_at" | "end_at"
>;

export type SupabaseEventRow = {
  id: string;
  user_id: string;
  title: string;
  timezone: string;
  busy: boolean;
  all_day: boolean;
  start_at: string | null;
  end_at: string | null;
  start_date: string | null;
  end_date_exclusive: string | null;
  lifecycle_status: "active" | "archived" | "deleted";
  created_at: string;
  updated_at: string;
};

export type SupabaseEventInsert = Omit<SupabaseEventRow, "created_at" | "updated_at">;

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
  | "task_completed"
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

export type SupabaseFeedbackType =
  | "bug"
  | "idea"
  | "confusing"
  | "missing_feature"
  | "general";

export type SupabaseFeedbackStatus =
  | "new"
  | "reviewed"
  | "planned"
  | "closed";

export type SupabaseFeedbackRow = {
  id: string;
  user_id: string;
  type: SupabaseFeedbackType;
  message: string;
  status: SupabaseFeedbackStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  [key: string]: unknown;
};

export type SupabaseFeedbackInsert = {
  user_id?: string;
  type?: SupabaseFeedbackType;
  message: string;
  status?: SupabaseFeedbackStatus;
  metadata?: Record<string, unknown>;
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
      orvia_events: {
        Row: SupabaseEventRow;
        Insert: SupabaseEventInsert;
        Update: Partial<SupabaseEventInsert>;
        Relationships: [];
      };
      planning_preferences: {
        Row: SupabasePlanningPreferencesRow;
        Insert: SupabasePlanningPreferencesInsert;
        Update: Partial<SupabasePlanningPreferencesInsert>;
        Relationships: [];
      };
      task_plan_blocks: {
        Row: SupabaseTaskPlanBlockRow;
        Insert: SupabaseTaskPlanBlockInsert;
        Update: Partial<SupabaseTaskPlanBlockInsert> & { version?: number };
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
      feedback: {
        Row: SupabaseFeedbackRow;
        Insert: SupabaseFeedbackInsert;
        Update: Partial<SupabaseFeedbackInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      ingest_beta_analytics: {
        Args: { p_id: string; p_event_name: string; p_anonymous_id: string; p_session_id: string; p_locale: string; p_user_id: string | null };
        Returns: boolean;
      };
      beta_analytics_report: { Args: { p_days: number }; Returns: unknown };
    };
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
