import { SHFELA_SOUTH_SUNSET_GUIDE } from "@/lib/guides/shfela-south-sunset";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

export const alt = `${SHFELA_SOUTH_SUNSET_GUIDE.title} — ${SHFELA_SOUTH_SUNSET_GUIDE.regionName}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const runtime = "nodejs";
export const revalidate = 600;

export default function ShfelaSouthSunsetOpenGraphImage() {
  return renderOgCard({
    title: SHFELA_SOUTH_SUNSET_GUIDE.title,
    subtitle: SHFELA_SOUTH_SUNSET_GUIDE.regionName,
  });
}
