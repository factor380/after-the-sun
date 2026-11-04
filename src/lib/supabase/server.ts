import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isE2ETestHarnessEnabled } from "@/lib/e2e/guard";
import type { ServerSupabase } from "@/lib/e2e/server-supabase";

export async function createClient(): Promise<ServerSupabase> {
  if (isE2ETestHarnessEnabled()) {
    const { createHarnessSupabase } = await import("@/lib/e2e/harness-supabase");
    return createHarnessSupabase();
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component - middleware will refresh the session.
          }
        },
      },
    },
  ) as unknown as ServerSupabase;
}
