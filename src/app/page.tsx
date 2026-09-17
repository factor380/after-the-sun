import type { Metadata } from "next";
import SpotMapClient from "@/components/map/SpotMapClient";
import { SetupNeededNotice } from "@/components/home/HomeCopy";
import { HomeSpotIndex } from "@/components/home/HomeSpotIndex";
import { SpotList } from "@/components/spots/SpotList";
import JsonLd from "@/components/seo/JsonLd";
import { toPublicSpot } from "@/lib/public-spot";
import { listSpots } from "@/services/spots";
import type { SpotSummary } from "@/types/spot";
import { SpotsDrawer } from "@/components/home/SpotsDrawer";
import { SpotSelectionProvider } from "@/components/home/SpotSelectionProvider";
import { spotsItemListJsonLd, websiteJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

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
    <SpotSelectionProvider>
      <JsonLd data={websiteJsonLd()} />
      {spots.length > 0 ? <JsonLd data={spotsItemListJsonLd(spots)} /> : null}
      <HomeSpotIndex spots={spots} />
      <div className="relative h-full min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0 z-0 isolate">
          <SpotMapClient spots={spots} />
        </div>

        <SpotsDrawer
          spotCount={spots.length}
          setupNeeded={setupNeeded}
          setupNotice={<SetupNeededNotice />}
        >
          <SpotList spots={spots} />
        </SpotsDrawer>
      </div>
    </SpotSelectionProvider>
  );
}
