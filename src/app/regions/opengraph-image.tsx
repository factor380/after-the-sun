import { REGIONS_INDEX } from "@/lib/regions";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

export const alt = REGIONS_INDEX.title;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 600;
export const runtime = "nodejs";

/** Short region list from `REGIONS_INDEX.description`, kept to one or two lines on the card. */
const subtitle =
  "תל אביב–יפו · ירושלים · חיפה והצפון · השרון · יהודה · שומרון · הדרום";

export default function RegionsOpenGraphImage() {
  return renderOgCard({
    title: REGIONS_INDEX.title,
    subtitle,
    subtitleFontSize: 30,
  });
}
