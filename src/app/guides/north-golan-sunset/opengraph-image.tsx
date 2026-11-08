import { NORTH_GOLAN_SUNSET_GUIDE } from "@/lib/guides/north-golan-sunset";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

export const alt = `${NORTH_GOLAN_SUNSET_GUIDE.title} — ${NORTH_GOLAN_SUNSET_GUIDE.regionName}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const runtime = "nodejs";
export const revalidate = 600;

export default function NorthGolanSunsetOpenGraphImage() {
  return renderOgCard({
    title: NORTH_GOLAN_SUNSET_GUIDE.title,
    subtitle: NORTH_GOLAN_SUNSET_GUIDE.regionName,
  });
}
