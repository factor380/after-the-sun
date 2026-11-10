import { redirect } from "next/navigation";
import { adminWriteDecision, type AdminPrincipal } from "@/lib/admin";
import type { ServerSupabase } from "@/lib/e2e/server-supabase";
import { createClient } from "@/lib/supabase/server";

export async function readAdminRequest(): Promise<{
  supabase: ServerSupabase;
  user: AdminPrincipal | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return { supabase, user: null };
  return {
    supabase,
    user: { id: user.id, email: user.email ?? null },
  };
}

/**
 * Page gate. Signed-out visitors go to Google sign-in. Signed-in non-admins
 * fall through so the page can render a Hebrew refusal without the spot.
 */
export async function requireAdminPage(
  nextPath: string,
): Promise<{ ok: true; userId: string } | { ok: false }> {
  const { user } = await readAdminRequest();
  const decision = adminWriteDecision(user);
  if (decision.ok) return { ok: true, userId: decision.userId };
  if (decision.reason === "signed-out") {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return { ok: false };
}
