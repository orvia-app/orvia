import { requireSupabaseBrowserConfig } from "@/lib/supabase/config";
import type {
  SupabaseBrowserClientFactory,
  SupabaseBrowserConfig,
} from "@/lib/supabase/types";

export function createSupabaseBrowserClient<TClient>(
  factory: SupabaseBrowserClientFactory<TClient>,
  config: SupabaseBrowserConfig = requireSupabaseBrowserConfig(),
): TClient {
  return factory(config);
}
