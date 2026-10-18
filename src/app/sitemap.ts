import type { MetadataRoute } from "next";
import { SUNSET_REGIONS, regionPath, spotMatchesRegion } from "@/lib/regions";
import { getSiteUrl } from "@/lib/seo";
import { listSpots } from "@/services/spots";

/** Read spots from the database on each fetch so lastmod is not frozen at deploy. */
export const dynamic = "force-dynamic";

/**
 * Bump when public HTML or JSON-LD changes without a database write.
 * Spot edits newer than this still win, so Google is not told every deploy is a content change.
 */
const PUBLIC_MARKUP_REVISION = new Date("2026-09-22T18:00:00.000Z");
/** About copy, region pages, and their social images were updated on this date. */
const REGION_PAGES_PUBLISHED = new Date("2026-10-18T17:00:00.000Z");

function lastModified(updatedAt: Date): Date {
  return updatedAt > PUBLIC_MARKUP_REVISION ? updatedAt : PUBLIC_MARKUP_REVISION;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  let spots: {
    id: string;
    region: string | null;
    createdAt: Date;
    updatedAt: Date;
    photoUrl: string | null;
    photos?: { url: string }[];
  }[] = [];

  try {
    spots = await listSpots();
  } catch {
    // Region and home URLs stay listed; spot URLs are omitted when the database is unreachable.
  }

  const spotEntries: MetadataRoute.Sitemap = spots.map((spot) => {
    const cover = spot.photoUrl ?? spot.photos?.[0]?.url;
    const updatedAt = spot.updatedAt ?? spot.createdAt;
    return {
      url: `${baseUrl}/spots/${spot.id}`,
      lastModified: lastModified(updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      ...(cover ? { images: [cover] } : {}),
    };
  });

  const newest = spots.reduce<Date | null>((latest, spot) => {
    const updatedAt = spot.updatedAt ?? spot.createdAt;
    if (!latest || updatedAt > latest) return updatedAt;
    return latest;
  }, null);

  const aboutStamp =
    newest && newest > REGION_PAGES_PUBLISHED ? newest : REGION_PAGES_PUBLISHED;

  const regionEntries: MetadataRoute.Sitemap = SUNSET_REGIONS.map((region) => {
    const newestInRegion = spots.reduce<Date | null>((latest, spot) => {
      if (!spotMatchesRegion(spot.region, region)) return latest;
      const updatedAt = spot.updatedAt ?? spot.createdAt;
      if (!latest || updatedAt > latest) return updatedAt;
      return latest;
    }, null);
    const stamp =
      newestInRegion && newestInRegion > REGION_PAGES_PUBLISHED
        ? newestInRegion
        : REGION_PAGES_PUBLISHED;

    return {
      url: `${baseUrl}${regionPath(region.slug)}`,
      lastModified: lastModified(stamp),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    };
  });

  return [
    {
      url: baseUrl,
      ...(newest ? { lastModified: lastModified(newest) } : {}),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: lastModified(aboutStamp),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...regionEntries,
    ...spotEntries,
  ];
}
