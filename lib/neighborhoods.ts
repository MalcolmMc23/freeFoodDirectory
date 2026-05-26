export type NeighborhoodMeta = {
  slug: string;
  name: string;
  zips: string[];
  description: string;
};

export const SF_NEIGHBORHOODS: NeighborhoodMeta[] = [
  { slug: "tenderloin", name: "Tenderloin", zips: ["94102"], description: "Free food in the Tenderloin neighborhood of San Francisco" },
  { slug: "soma", name: "SoMa", zips: ["94103", "94107"], description: "Free food in SoMa (South of Market) in San Francisco" },
  { slug: "chinatown", name: "Chinatown & Union Square", zips: ["94108"], description: "Free food in Chinatown and Union Square in San Francisco" },
  { slug: "western-addition", name: "Western Addition & Japantown", zips: ["94115"], description: "Free food in the Western Addition and Japantown neighborhoods of San Francisco" },
  { slug: "mission", name: "Mission District", zips: ["94110"], description: "Free food in the Mission District neighborhood of San Francisco" },
  { slug: "bayview", name: "Bayview & Hunters Point", zips: ["94124"], description: "Free food in Bayview and Hunters Point in San Francisco" },
  { slug: "excelsior", name: "Excelsior & Outer Mission", zips: ["94112"], description: "Free food in the Excelsior and Outer Mission neighborhoods of San Francisco" },
  { slug: "richmond", name: "Richmond District", zips: ["94118", "94121"], description: "Free food in the Richmond District of San Francisco" },
  { slug: "sunset", name: "Sunset District", zips: ["94122", "94116"], description: "Free food in the Sunset District of San Francisco" },
  { slug: "nob-hill", name: "Nob Hill & Russian Hill", zips: ["94109"], description: "Free food in Nob Hill and Russian Hill in San Francisco" },
  { slug: "haight", name: "Haight-Ashbury", zips: ["94117"], description: "Free food in the Haight-Ashbury neighborhood of San Francisco" },
  { slug: "north-beach", name: "North Beach & Chinatown", zips: ["94133"], description: "Free food in North Beach in San Francisco" },
  { slug: "visitacion-valley", name: "Visitacion Valley", zips: ["94134"], description: "Free food in Visitacion Valley in San Francisco" },
];

export function getNeighborhoodBySlug(slug: string): NeighborhoodMeta | undefined {
  return SF_NEIGHBORHOODS.find((n) => n.slug === slug);
}

export function getNeighborhoodByZip(zip: string): NeighborhoodMeta | undefined {
  return SF_NEIGHBORHOODS.find((n) => n.zips.includes(zip));
}
