import { revalidatePath } from "next/cache";
import { SUNSET_REGIONS, regionPath } from "@/lib/regions";

/** Drop cached public HTML and the sitemap after a spot is created, edited, or removed. */
export function revalidatePublishedSpots(spotId?: string) {
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/sitemap.xml");
  for (const region of SUNSET_REGIONS) {
    revalidatePath(regionPath(region.slug));
  }
  if (spotId) revalidatePath(`/spots/${spotId}`);
}
