import { revalidatePath } from "next/cache";
import { JERUSALEM_SUNSET_GUIDE } from "@/lib/guides/jerusalem-sunset";
import { NORTH_GOLAN_SUNSET_GUIDE } from "@/lib/guides/north-golan-sunset";
import { WINTER_COAST_SUNSET_GUIDE } from "@/lib/guides/winter-coast-sunset";
import { REGIONS_INDEX, SUNSET_REGIONS, regionPath } from "@/lib/regions";
import { isSpotSlug, spotPublicPath } from "@/lib/spot-slug";

/**
 * Public HTML is cached for this many seconds (`export const revalidate = 600`
 * on each public page; the literal has to stay inline for Next to read it).
 * Writes should call `revalidatePublishedSpots` so visitors do not wait out the window.
 */
export const PUBLIC_PAGE_REVALIDATE_SECONDS = 600;

function revalidatePageAndSocialImages(path: string) {
  revalidatePath(path);
  const base = path === "/" ? "" : path;
  revalidatePath(`${base}/opengraph-image`);
  revalidatePath(`${base}/twitter-image`);
}

export type PublishedSpotCacheKey = {
  id: string;
  slug: string;
};

/** Drop cached public HTML, social images, the sitemap, and llms.txt after a spot or its photos change. */
export function revalidatePublishedSpots(spot?: PublishedSpotCacheKey) {
  revalidatePageAndSocialImages("/");
  revalidatePageAndSocialImages("/about");
  revalidatePageAndSocialImages(REGIONS_INDEX.path);
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
  revalidatePath(JERUSALEM_SUNSET_GUIDE.path);
  revalidatePath(NORTH_GOLAN_SUNSET_GUIDE.path);
  revalidatePath(WINTER_COAST_SUNSET_GUIDE.path);
  for (const region of SUNSET_REGIONS) {
    revalidatePageAndSocialImages(regionPath(region.slug));
  }
  if (!spot) return;
  // The canonical page, plus the opengraph-image and twitter-image paths under it.
  if (isSpotSlug(spot.slug)) revalidatePageAndSocialImages(spotPublicPath(spot.slug));
  // The legacy id URL is a 308. Drop a cached copy of that redirect too.
  if (spot.id !== spot.slug && /^[A-Za-z0-9_-]{1,80}$/.test(spot.id)) {
    revalidatePageAndSocialImages(`/spots/${spot.id}`);
  }
}
