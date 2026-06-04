import type { CitySlug } from "./cities";
import type { Location } from "./types";

export type NeighborhoodMeta = {
  citySlug: CitySlug;
  slug: string;
  name: string;
  zips: string[];
  description: string;
};

export const SF_NEIGHBORHOODS: NeighborhoodMeta[] = [
  { citySlug: "san-francisco", slug: "tenderloin", name: "Tenderloin", zips: ["94102"], description: "Free food in the Tenderloin neighborhood of San Francisco" },
  { citySlug: "san-francisco", slug: "soma", name: "SoMa", zips: ["94103", "94107"], description: "Free food in SoMa (South of Market) in San Francisco" },
  { citySlug: "san-francisco", slug: "chinatown", name: "Chinatown & Union Square", zips: ["94108"], description: "Free food in Chinatown and Union Square in San Francisco" },
  { citySlug: "san-francisco", slug: "western-addition", name: "Western Addition & Japantown", zips: ["94115"], description: "Free food in the Western Addition and Japantown neighborhoods of San Francisco" },
  { citySlug: "san-francisco", slug: "mission", name: "Mission District", zips: ["94110"], description: "Free food in the Mission District neighborhood of San Francisco" },
  { citySlug: "san-francisco", slug: "bayview", name: "Bayview & Hunters Point", zips: ["94124"], description: "Free food in Bayview and Hunters Point in San Francisco" },
  { citySlug: "san-francisco", slug: "excelsior", name: "Excelsior & Outer Mission", zips: ["94112"], description: "Free food in the Excelsior and Outer Mission neighborhoods of San Francisco" },
  { citySlug: "san-francisco", slug: "richmond", name: "Richmond District", zips: ["94118", "94121"], description: "Free food in the Richmond District of San Francisco" },
  { citySlug: "san-francisco", slug: "sunset", name: "Sunset District", zips: ["94122", "94116"], description: "Free food in the Sunset District of San Francisco" },
  { citySlug: "san-francisco", slug: "nob-hill", name: "Nob Hill & Russian Hill", zips: ["94109"], description: "Free food in Nob Hill and Russian Hill in San Francisco" },
  { citySlug: "san-francisco", slug: "haight", name: "Haight-Ashbury", zips: ["94117"], description: "Free food in the Haight-Ashbury neighborhood of San Francisco" },
  { citySlug: "san-francisco", slug: "north-beach", name: "North Beach & Chinatown", zips: ["94133"], description: "Free food in North Beach in San Francisco" },
  { citySlug: "san-francisco", slug: "visitacion-valley", name: "Visitacion Valley", zips: ["94134"], description: "Free food in Visitacion Valley in San Francisco" },
];

export const LA_NEIGHBORHOODS: NeighborhoodMeta[] = [
  { citySlug: "los-angeles", slug: "downtown-arts-district", name: "Downtown LA & Arts District", zips: ["90012", "90013", "90014", "90015", "90017", "90021"], description: "Free food in Downtown Los Angeles and the Arts District" },
  { citySlug: "los-angeles", slug: "westlake-pico-union-koreatown", name: "Westlake, Pico-Union & Koreatown", zips: ["90005", "90006", "90010", "90020", "90057"], description: "Free food in Westlake, Pico-Union, and Koreatown in Los Angeles" },
  { citySlug: "los-angeles", slug: "university-park-exposition-park", name: "University Park & Exposition Park", zips: ["90007"], description: "Free food in University Park and Exposition Park in Los Angeles" },
  { citySlug: "los-angeles", slug: "echo-park", name: "Echo Park", zips: ["90026"], description: "Free food in Echo Park in Los Angeles" },
  { citySlug: "los-angeles", slug: "hollywood-los-feliz", name: "Hollywood, Los Feliz & East Hollywood", zips: ["90027", "90028", "90029"], description: "Free food in Hollywood, Los Feliz, and East Hollywood in Los Angeles" },
  { citySlug: "los-angeles", slug: "northeast-la", name: "Northeast LA", zips: ["90031", "90041", "90042", "90065"], description: "Free food in Northeast Los Angeles including Lincoln Heights, Eagle Rock, Highland Park, and Glassell Park" },
  { citySlug: "los-angeles", slug: "boyle-heights-eastside", name: "Boyle Heights & Eastside", zips: ["90023", "90032", "90033", "90063"], description: "Free food in Boyle Heights and the Eastside of Los Angeles" },
  { citySlug: "los-angeles", slug: "west-adams-crenshaw", name: "West Adams, Jefferson Park & Crenshaw", zips: ["90008", "90016", "90018", "90019"], description: "Free food in West Adams, Jefferson Park, and Crenshaw in Los Angeles" },
  { citySlug: "los-angeles", slug: "south-la", name: "South Los Angeles", zips: ["90001", "90003", "90011", "90037", "90043", "90044", "90047", "90058"], description: "Free food in South Los Angeles" },
  { citySlug: "los-angeles", slug: "westside", name: "Westside", zips: ["90025", "90035", "90066"], description: "Free food on the Westside of Los Angeles including Sawtelle, Pico-Robertson, and Mar Vista" },
  { citySlug: "los-angeles", slug: "fairfax-beverly-grove-west-hollywood", name: "Fairfax, Beverly Grove & West Hollywood", zips: ["90046", "90069"], description: "Free food in Fairfax, Beverly Grove, and West Hollywood" },
];

export const NYC_NEIGHBORHOODS: NeighborhoodMeta[] = [
  { citySlug: "new-york-city", slug: "lower-east-side-east-village", name: "Lower East Side & East Village", zips: ["10002", "10003", "10009"], description: "Free food in the Lower East Side and East Village of New York City" },
  { citySlug: "new-york-city", slug: "chelsea-hells-kitchen-midtown", name: "Chelsea, Hell's Kitchen & Midtown", zips: ["10001", "10011", "10018", "10019", "10022", "10036"], description: "Free food in Chelsea, Hell's Kitchen, and Midtown Manhattan" },
  { citySlug: "new-york-city", slug: "upper-east-side", name: "Upper East Side", zips: ["10021", "10075", "10128"], description: "Free food on the Upper East Side of Manhattan" },
  { citySlug: "new-york-city", slug: "upper-west-side-morningside", name: "Upper West Side & Morningside Heights", zips: ["10023", "10024", "10025"], description: "Free food on the Upper West Side and in Morningside Heights" },
  { citySlug: "new-york-city", slug: "harlem", name: "Harlem", zips: ["10026", "10027", "10029", "10030", "10035", "10037"], description: "Free food in Harlem and East Harlem in New York City" },
  { citySlug: "new-york-city", slug: "washington-heights-inwood", name: "Washington Heights & Inwood", zips: ["10031", "10032", "10033", "10034"], description: "Free food in Washington Heights and Inwood" },
  { citySlug: "new-york-city", slug: "south-bronx", name: "South Bronx", zips: ["10451", "10454", "10455", "10456", "10459", "10460", "10474"], description: "Free food in the South Bronx" },
  { citySlug: "new-york-city", slug: "west-bronx", name: "West Bronx", zips: ["10457", "10458", "10463", "10468"], description: "Free food in the West Bronx including Fordham and University Heights" },
  { citySlug: "new-york-city", slug: "north-east-bronx", name: "North & East Bronx", zips: ["10461", "10466", "10467", "10469", "10475"], description: "Free food in the North and East Bronx" },
  { citySlug: "new-york-city", slug: "rockaways", name: "Far Rockaway & Arverne", zips: ["11691", "11692"], description: "Free food in Far Rockaway and Arverne, Queens" },
  { citySlug: "new-york-city", slug: "staten-island-north-shore", name: "Staten Island North Shore", zips: ["10301", "10302", "10303", "10304"], description: "Free food on Staten Island's North Shore" },
  { citySlug: "new-york-city", slug: "staten-island-south-west", name: "Staten Island South & West", zips: ["10309", "10314"], description: "Free food in the South and West parts of Staten Island" },
];

export const ALL_NEIGHBORHOODS: NeighborhoodMeta[] = [
  ...SF_NEIGHBORHOODS,
  ...LA_NEIGHBORHOODS,
  ...NYC_NEIGHBORHOODS,
];

export function getNeighborhoodsByCity(citySlug: CitySlug): NeighborhoodMeta[] {
  return ALL_NEIGHBORHOODS.filter((neighborhood) => neighborhood.citySlug === citySlug);
}

export function getNeighborhoodByCityAndSlug(citySlug: string, slug: string): NeighborhoodMeta | undefined {
  return ALL_NEIGHBORHOODS.find(
    (neighborhood) => neighborhood.citySlug === citySlug && neighborhood.slug === slug,
  );
}

export function getNeighborhoodByZip(zip: string, citySlug?: CitySlug): NeighborhoodMeta | undefined {
  return ALL_NEIGHBORHOODS.find((neighborhood) => {
    if (citySlug && neighborhood.citySlug !== citySlug) return false;
    return neighborhood.zips.includes(zip);
  });
}

export function getNeighborhoodByLocation(location: Pick<Location, "postalCode">, citySlug?: CitySlug): NeighborhoodMeta | undefined {
  if (!location.postalCode) return undefined;
  return getNeighborhoodByZip(location.postalCode, citySlug);
}

export function getNeighborhoodUrl(neighborhood: Pick<NeighborhoodMeta, "citySlug" | "slug">): string {
  return `/${neighborhood.citySlug}/neighborhood/${neighborhood.slug}`;
}
