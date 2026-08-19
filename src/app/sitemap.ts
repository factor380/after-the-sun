import type { MetadataRoute } from "next";
import { listSpots } from "@/services/spots";

const BASE_URL = "https://after-the-sun.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const spots = await listSpots();

  const spotEntries: MetadataRoute.Sitemap = spots.map((spot) => ({
    url: `${BASE_URL}/spots/${spot.id}`,
    lastModified: spot.createdAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...spotEntries,
  ];
}
