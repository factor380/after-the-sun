import { NextResponse } from "next/server";
import { postGoogleSignInRedirect } from "@/lib/google-identity";
import { profileDisplayName } from "@/lib/profile-name";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/services/spots";

export const dynamic = "force-dynamic";

/**
 * Session cookies are already set by the browser client. This step stores the
 * profile, then returns to the page the user was on (for example /spots/new).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next");
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!configured) {
    return NextResponse.redirect(postGoogleSignInRedirect(origin, next, false));
  }

  let userId: string | null = null;
  let metadata: { full_name?: unknown; name?: unknown } | null = null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return NextResponse.redirect(postGoogleSignInRedirect(origin, next, false));
    }
    userId = data.user.id;
    metadata = data.user.user_metadata ?? null;
  } catch {
    return NextResponse.redirect(postGoogleSignInRedirect(origin, next, false));
  }

  try {
    // Spot create and photo upload call ensureProfile again if this upsert fails.
    await ensureProfile(userId, profileDisplayName(metadata));
  } catch {
    // The session is already valid. Sending the user back to the form matters more.
  }

  return NextResponse.redirect(postGoogleSignInRedirect(origin, next, true));
}
