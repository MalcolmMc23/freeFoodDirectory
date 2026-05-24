export type Location = {
  id: string;
  slug: string;
  name: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string | null;
  lat: number | null;
  lng: number | null;
  geocodeStatus: "pending" | "success" | "failed";
  category: string | null;
  distributionDay: string | null;
  nextDistributionDates: string[];
  distributionTimeText: string | null;
  availabilityStatus: string | null;
  enrollmentFrequency: string | null;
  enrollmentTimeText: string | null;
  additionalLanguages: string[];
  additionalInfo: string[];
  zipCodesServed: string[];
  outsideZipCode: boolean;
  phone: string | null;
  sourceUrl: string | null;
  siteUrl: string | null;
  active: boolean;
  lastScrapedAt: string | null;
  lastChangedAt: string | null;
};

export function formatLocationAddress(location: Pick<Location, "addressLine" | "city" | "state" | "postalCode">): string {
  const region = [location.city, location.state].filter(Boolean).join(", ");
  return [location.addressLine, [region, location.postalCode].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}
