import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { buildLlmsTxt, type LlmsSpot } from "@/lib/llms-txt";

/**
 * Cached for 10 minutes, same window as the public pages.
 * The literal has to stay inline for Next to read it.
 * Spot writes also refresh this path through `revalidatePublishedSpots`.
 * GET handlers are dynamic unless a segment config opts them into ISR.
 */
export const dynamic = "force-static";
export const revalidate = 600;

const CONTENT_TYPE = "text/plain; charset=utf-8";

function staticSpotFallback(): boolean {
  return (
    process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD ||
    process.env.NODE_ENV !== "production"
  );
}

/**
 * Published spots are every row `listSpots()` returns. There is no draft flag.
 * Import the service lazily so a missing database at build time stays inside
 * the try/catch and the file can still be served from the static page list.
 */
async function loadPublishedSpots(): Promise<LlmsSpot[]> {
  try {
    const { listSpots } = await import("@/services/spots");
    const spots = await listSpots();
    return spots.map((spot) => ({
      id: spot.id,
      name: spot.name,
      description: spot.description,
      region: spot.region,
    }));
  } catch (error) {
    if (!staticSpotFallback()) throw error;
    return [];
  }
}

export async function GET() {
  const body = buildLlmsTxt(await loadPublishedSpots());
  return new Response(body, {
    headers: {
      "Content-Type": CONTENT_TYPE,
    },
  });
}
