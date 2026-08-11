import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SpotForm from "@/components/spots/SpotForm";
import { T } from "@/components/T";
import { createClient } from "@/lib/supabase/server";
import { getSpotById } from "@/services/spots";

type PageProps = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export default async function EditSpotPage({ params }: PageProps) {
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

  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/spots/${encodeURIComponent(id)}/edit`);
  }

  const spot = await getSpotById(id);
  if (!spot) notFound();

  if (spot.createdById !== user.id) {
    redirect(`/spots/${id}`);
  }

  return (
    <div className="mx-auto w-full max-w-xl px-5 py-10">
      <Link
        href="/spots/mine"
        className="text-sm text-[var(--sand-muted)] transition hover:text-[var(--sand)]"
      >
        ← <T k="mySpotsTitle" />
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[var(--sand)]">
        <T k="editSpotTitle" />
      </h1>
      <p className="mt-2 mb-8 text-[var(--sand-muted)]">
        <T k="editSpotSubtitle" />
      </p>
      <SpotForm
        initial={{
          id: spot.id,
          name: spot.name,
          description: spot.description,
          region: spot.region,
          lat: spot.lat,
          lng: spot.lng,
          photoUrl: spot.photoUrl,
        }}
      />
    </div>
  );
}
