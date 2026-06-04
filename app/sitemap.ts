import type { MetadataRoute } from "next";
import { ALL_NEIGHBORHOODS, getNeighborhoodUrl } from "../lib/neighborhoods";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://freefoodmaps.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://freefoodmaps.com/faq",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: "https://freefoodmaps.com/sources",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://freefoodmaps.com/automations",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...ALL_NEIGHBORHOODS.map((n) => ({
      url: `https://freefoodmaps.com${getNeighborhoodUrl(n)}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
