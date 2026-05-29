import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getRequiredServerEnv } from "@/env/server";

export type SupabaseTaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high" | "critical";
  workspace_id: string | null;
  due_date: string | null;
  created_at: string;
  [key: string]: unknown;
};

export type SupabaseTaskInsert = {
  title: string;
  description?: string | null;
  status?: SupabaseTaskRow["status"];
  priority?: SupabaseTaskRow["priority"];
  workspace_id?: string | null;
  due_date?: string | null;
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
