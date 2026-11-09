import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Storage client that bypasses RLS. Used only to put an anonymous suggestion
 * photo under `suggestions/`. Returns null when the secret is unset so the
 * rest of the suggestion flow still works.
 */
export function createServiceRoleClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
