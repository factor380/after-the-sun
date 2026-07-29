import SpotMapClient from "@/components/map/SpotMapClient";
import {
  HomeBrand,
  HomeTagline,
  SetupNeededNotice,
  SpotsHeading,
} from "@/components/home/HomeCopy";
import { SpotList } from "@/components/spots/SpotList";
import { toPublicSpot } from "@/lib/public-spot";
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
      spots: spots.map(toPublicSpot),
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
            <HomeBrand />
          </h1>
          <p className="mt-1 max-w-md text-sm text-[var(--sand-muted)]">
            <HomeTagline />
          </p>
        </div>
      </section>

      <aside className="flex min-h-0 w-full flex-1 flex-col overflow-hidden border-t border-white/10 bg-[var(--dusk-deep)]/80 px-4 py-4 backdrop-blur-sm md:px-5 md:py-5 lg:w-[380px] lg:shrink-0 lg:border-s lg:border-t-0 lg:px-6 lg:py-6">
        <div className="mb-3 hidden shrink-0 lg:mb-4 lg:block">
          <h1 className="font-[family-name:var(--font-display)] text-4xl leading-tight text-[var(--sand)]">
            <HomeBrand />
          </h1>
          <p className="mt-2 text-[var(--sand-muted)]">
            <HomeTagline />
          </p>
        </div>

        {setupNeeded ? (
          <div className="mb-3 shrink-0 rounded-sm border border-[var(--ember)]/40 bg-black/20 p-3 text-sm text-[var(--sand-muted)] lg:mb-4">
            <SetupNeededNotice />
          </div>
        ) : null}

        <h2 className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sand-muted)]">
          <SpotsHeading count={spots.length} />
        </h2>
        <div className="min-h-0 flex-1">
          <SpotList spots={spots} />
        </div>
      </aside>
    </div>
  );
}
