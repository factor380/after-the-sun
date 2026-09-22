import { revalidatePath } from "next/cache";

/** Drop cached public HTML and the sitemap after a spot is created, edited, or removed. */
export function revalidatePublishedSpots(spotId?: string) {
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  if (spotId) revalidatePath(`/spots/${spotId}`);
}
