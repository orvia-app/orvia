import { requireSupabaseServerConfig } from "@/server/supabase/config";
import type {
  SupabaseServerClientFactory,
  SupabaseServerConfig,
} from "@/server/supabase/types";

export function createSupabaseServerClient<TClient>(
  factory: SupabaseServerClientFactory<TClient>,
  config: SupabaseServerConfig = requireSupabaseServerConfig(),
): TClient {
  return factory(config);
}
