import { WINTER_COAST_REGIONS, WINTER_COAST_SUNSET_GUIDE } from "@/lib/guides/winter-coast-sunset";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

const SUBTITLE = WINTER_COAST_REGIONS.map((region) => region.label).join(", ");

export const alt = `${WINTER_COAST_SUNSET_GUIDE.title} — ${SUBTITLE}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const runtime = "nodejs";
export const revalidate = 600;

export default function WinterCoastSunsetOpenGraphImage() {
  return renderOgCard({
    title: WINTER_COAST_SUNSET_GUIDE.title,
    subtitle: SUBTITLE,
    subtitleFontSize: 32,
  });
}
