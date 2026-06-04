export type CitySlug = "san-francisco" | "los-angeles" | "new-york-city";

export type CityMeta = {
  slug: CitySlug;
  name: string;
};

export const SUPPORTED_CITIES: CityMeta[] = [
  { slug: "san-francisco", name: "San Francisco" },
  { slug: "los-angeles", name: "Los Angeles" },
  { slug: "new-york-city", name: "New York City" },
];

export function getCityBySlug(slug: string): CityMeta | undefined {
  return SUPPORTED_CITIES.find((city) => city.slug === slug);
}
