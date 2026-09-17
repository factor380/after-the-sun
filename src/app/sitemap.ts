import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";
import { listSpots } from "@/services/spots";

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
    return {
      url: `${baseUrl}/spots/${spot.id}`,
      lastModified: spot.updatedAt ?? spot.createdAt,
      changeFrequency: "weekly",
      priority: 0.8,
      ...(cover ? { images: [cover] } : {}),
    };
  });

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...spotEntries,
  ];
}
