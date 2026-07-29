import Link from "next/link";
import { redirect } from "next/navigation";
import SpotForm from "@/components/spots/SpotForm";
import { createClient } from "@/lib/supabase/server";

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
        Configure Supabase in <code className="text-[var(--sand)]">.env</code>{" "}
        before adding spots.{" "}
        <Link href="/" className="text-[var(--ember)] underline">
          Back home
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/spots/new");
  }

  return (
    <div className="mx-auto w-full max-w-xl px-5 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--sand)]">
        Share a sunset spot
      </h1>
      <p className="mt-2 mb-8 text-[var(--sand-muted)]">
        Name it, describe the vibe, and pin it on the map.
      </p>
      <SpotForm />
    </div>
  );
}
