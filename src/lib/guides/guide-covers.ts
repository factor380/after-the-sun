import { allowStaticDataFallback } from "@/lib/static-data-fallback";
import { spotCoverUrl } from "@/lib/spot-cover";

/**
 * Cover photo for each guide spot. The spots service is imported inside the
 * try so a missing database at build time does not fail module init.
 */
export async function loadGuideCoverMap(): Promise<Map<string, string>> {
  try {
    const { listSpots } = await import("@/services/spots");
    const spots = await listSpots();
    const covers = new Map<string, string>();
    for (const spot of spots) {
      const cover = spotCoverUrl(spot);
      if (cover) covers.set(spot.id, cover);
    }
    return covers;
  } catch (error) {
    if (!allowStaticDataFallback()) throw error;
    return new Map();
  }
}
