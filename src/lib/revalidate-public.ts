import { revalidatePath } from "next/cache";
import { JERUSALEM_SUNSET_GUIDE } from "@/lib/guides/jerusalem-sunset";
import { SUNSET_REGIONS, regionPath } from "@/lib/regions";

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

/** Drop cached public HTML, social images, the sitemap, and llms.txt after a spot or its photos change. */
export function revalidatePublishedSpots(spotId?: string) {
  revalidatePageAndSocialImages("/");
  revalidatePageAndSocialImages("/about");
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
  revalidatePath(JERUSALEM_SUNSET_GUIDE.path);
  for (const region of SUNSET_REGIONS) {
    revalidatePageAndSocialImages(regionPath(region.slug));
  }
  // Spot share cards are metadata on the page, not a separate image route.
  if (spotId) revalidatePath(`/spots/${spotId}`);
}
