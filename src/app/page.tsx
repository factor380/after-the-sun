import SpotMapClient from "@/components/map/SpotMapClient";
import { SpotList } from "@/components/spots/SpotList";
import { listSpots } from "@/services/spots";
import type { SpotSummary } from "@/types/spot";

export const dynamic = "force-dynamic";

async function loadSpots(): Promise<{
  spots: SpotSummary[];
  setupNeeded: boolean;
}> {
  try {
    const spots = await listSpots();
    return {
      spots: spots.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        lat: s.lat,
        lng: s.lng,
        region: s.region,
        photoUrl: s.photoUrl,
        createdById: s.createdById,
        createdAt: s.createdAt.toISOString(),
      })),
      setupNeeded: false,
    };
  } catch {
    return { spots: [], setupNeeded: true };
  }
}

export default async function HomePage() {
  const { spots, setupNeeded } = await loadSpots();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <section className="relative min-h-0 w-full flex-[1.35] lg:flex-1">
        <div className="absolute inset-0">
          <SpotMapClient spots={spots} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[var(--dusk-deep)]/90 to-transparent p-4 md:p-6 lg:hidden">
          <h1 className="font-[family-name:var(--font-display)] text-2xl text-[var(--sand)] md:text-3xl">
            After the Sun
          </h1>
          <p className="mt-1 max-w-md text-sm text-[var(--sand-muted)]">
            Sunset spots shared across Israel — find yours on the map.
          </p>
        </div>
      </section>

      <aside className="flex min-h-0 w-full flex-1 flex-col overflow-hidden border-t border-white/10 bg-[var(--dusk-deep)]/80 px-4 py-4 backdrop-blur-sm md:px-5 md:py-5 lg:w-[380px] lg:shrink-0 lg:border-l lg:border-t-0 lg:px-6 lg:py-6">
        <div className="mb-3 hidden shrink-0 lg:mb-4 lg:block">
          <h1 className="font-[family-name:var(--font-display)] text-4xl leading-tight text-[var(--sand)]">
            After the Sun
          </h1>
          <p className="mt-2 text-[var(--sand-muted)]">
            Sunset spots shared across Israel — find yours on the map.
          </p>
        </div>

        {setupNeeded ? (
          <div className="mb-3 shrink-0 rounded-sm border border-[var(--ember)]/40 bg-black/20 p-3 text-sm text-[var(--sand-muted)] lg:mb-4">
            Connect Supabase in <code className="text-[var(--sand)]">.env</code>{" "}
            (see <code className="text-[var(--sand)]">.env.example</code>), then
            run <code className="text-[var(--sand)]">npx prisma db push</code>{" "}
            and <code className="text-[var(--sand)]">npm run db:seed</code>.
          </div>
        ) : null}

        <h2 className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sand-muted)]">
          Spots ({spots.length})
        </h2>
        <div className="min-h-0 flex-1">
          <SpotList spots={spots} />
        </div>
      </aside>
    </div>
  );
}
