import Link from "next/link";
import { redirect } from "next/navigation";
import MySpotsList from "@/components/spots/MySpotsList";
import { T } from "@/components/T";
import { createClient } from "@/lib/supabase/server";
import { listSpotsByUser } from "@/services/spots";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export default async function MySpotsPage() {
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/spots/mine");
  }

  const spots = await listSpotsByUser(user.id);

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--sand)]">
        <T k="mySpotsTitle" />
      </h1>
      <p className="mt-2 mb-8 text-[var(--sand-muted)]">
        <T k="mySpotsSubtitle" />
      </p>
      <MySpotsList
        spots={spots.map((spot) => ({
          id: spot.id,
          name: spot.name,
          region: spot.region,
          createdAt: spot.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
