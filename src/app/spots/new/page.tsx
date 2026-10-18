import type { Metadata } from "next";
import Link from "next/link";
import SpotForm from "@/components/spots/SpotForm";
import { T } from "@/components/T";
import { dictionary } from "@/lib/i18n/dictionaries";
import { noIndexRobots } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: dictionary.shareSpotTitle,
  robots: noIndexRobots,
};

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

  let user: { id: string } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // A failed session check stays signed out. The create API still requires a user.
    user = null;
  }

  return (
    <div className="mx-auto w-full max-w-xl px-5 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--sand)]">
        <T k="shareSpotTitle" />
      </h1>
      <p className="mt-2 text-[var(--sand-muted)]">
        <T k="shareSpotSubtitle" />
      </p>
      {user ? null : (
        <p className="mt-3 text-sm leading-relaxed text-[var(--sand-muted)]">
          <T k="shareSpotSignInNote" />
        </p>
      )}
      <div className="mt-8">
        <SpotForm signedIn={Boolean(user)} />
      </div>
    </div>
  );
}
