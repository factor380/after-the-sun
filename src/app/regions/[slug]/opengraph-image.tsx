import { notFound } from "next/navigation";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";
import { allowStaticDataFallback } from "@/lib/static-data-fallback";
import { filterSpotsForRegion, getRegionBySlug } from "@/lib/regions";
import { listSpots } from "@/services/spots";

export const alt = "נקודות שקיעה לפי אזור";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 600;
export const runtime = "nodejs";

type ImageProps = { params: Promise<{ slug: string }> };

function countLine(count: number): string {
  if (count === 1) return "נקודה אחת";
  if (count === 2) return "שתי נקודות";
  return `${count} נקודות`;
}

export default async function RegionOpenGraphImage({ params }: ImageProps) {
  const { slug } = await params;
  const region = getRegionBySlug(slug);
  if (!region) notFound();

  let subtitle = region.name;
  try {
    const spots = await listSpots();
    subtitle = countLine(filterSpotsForRegion(spots, region).length);
  } catch (error) {
    if (!allowStaticDataFallback()) throw error;
    // Without a database the card still names the region.
  }

  return renderOgCard({
    title: region.title,
    subtitle,
  });
}
