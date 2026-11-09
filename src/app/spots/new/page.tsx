import type { Metadata } from "next";
import Link from "next/link";
import QuickSpotForm from "@/components/spots/QuickSpotForm";
import { T } from "@/components/T";
import { dictionary } from "@/lib/i18n/dictionaries";
import { profileDisplayName } from "@/lib/profile-name";
import { noIndexRobots } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: dictionary.shareSpotTitle,
  description: dictionary.shareSpotSubtitle,
  alternates: { canonical: "/spots/new" },
  robots: noIndexRobots,
};

/** The form depends on the session. Never cache. */
export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export default async function NewSpotPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-xl px-5 py-12 text-[var(--sand-muted)]">
        <T k="configureSupabase" />{" "}
        <Link href="/" className="text-[var(--ember)] underline">
          <T k="backHome" />
        </Link>
      </div>
    );
  }

  let signedIn = false;
  let displayName: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      signedIn = true;
      displayName = profileDisplayName(data.user.user_metadata);
    }
  } catch {
    signedIn = false;
  }

  return (
    <div className="mx-auto w-full max-w-xl px-5 py-8">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--sand)]">
        <T k="shareSpotTitle" />
      </h1>
      <p className="mt-2 text-[var(--sand-muted)]">
        <T k="shareSpotSubtitle" />
      </p>
      {signedIn ? null : (
        <p className="mt-3 text-sm leading-relaxed text-[var(--sand-muted)]">
          <T k="shareSpotSignInNote" />
        </p>
      )}
      <div className="mt-6">
        <QuickSpotForm signedIn={signedIn} displayName={displayName} />
      </div>
    </div>
  );
}
