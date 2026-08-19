import type { MetadataRoute } from "next";

const BASE_URL = "https://after-the-sun.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let spots: { id: string; createdAt: string }[] = [];

  try {
    const res = await fetch(`${BASE_URL}/api/spots`, { next: { revalidate: 3600 } });
    if (res.ok) {
      spots = await res.json();
    }
  } catch {
    // fallback to home only if API is unreachable
  }

  const spotEntries: MetadataRoute.Sitemap = spots.map((spot) => ({
    url: `${BASE_URL}/spots/${spot.id}`,
    lastModified: new Date(spot.createdAt),
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
