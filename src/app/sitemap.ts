import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";
import { listSpots } from "@/services/spots";

/** Read spots from the database on each fetch so lastmod is not frozen at deploy. */
export const dynamic = "force-dynamic";

/**
 * Bump when public HTML or JSON-LD changes without a database write.
 * Spot edits newer than this still win, so Google is not told every deploy is a content change.
 */
const PUBLIC_MARKUP_REVISION = new Date("2026-09-22T18:00:00.000Z");

function lastModified(updatedAt: Date): Date {
  return updatedAt > PUBLIC_MARKUP_REVISION ? updatedAt : PUBLIC_MARKUP_REVISION;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  let spots: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    photoUrl: string | null;
    photos?: { url: string }[];
  }[] = [];

  try {
    spots = await listSpots();
  } catch {
    // fallback to home only if the database is unreachable
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

  const aboutPublished = new Date("2026-10-05T16:00:00.000Z");
  const aboutLastModified =
    newest && newest > aboutPublished ? lastModified(newest) : aboutPublished;

  return [
    {
      url: baseUrl,
      ...(newest ? { lastModified: lastModified(newest) } : {}),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: aboutLastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...spotEntries,
  ];
}
