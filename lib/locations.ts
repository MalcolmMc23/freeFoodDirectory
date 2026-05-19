import type { Database } from "./database.types";
import { MOCK_LOCATIONS } from "./mock-locations";
import { createSupabaseServerClient } from "./supabase";
import type { Location } from "./types";

type LocationRow = Pick<
  Database["public"]["Tables"]["locations"]["Row"],
  | "id"
  | "slug"
  | "name"
  | "address_line"
  | "city"
  | "state"
  | "postal_code"
  | "lat"
  | "lng"
  | "geocode_status"
  | "category"
  | "distribution_day"
  | "next_distribution_dates"
  | "distribution_time_text"
  | "availability_status"
  | "enrollment_frequency"
  | "enrollment_time_text"
  | "additional_languages"
  | "additional_info"
  | "zip_codes_served"
  | "outside_zip_code"
  | "source_url"
  | "site_url"
  | "active"
  | "last_scraped_at"
  | "last_changed_at"
>;

export async function getLocations(): Promise<Location[]> {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return MOCK_LOCATIONS;
  }

  const { data, error } = await supabase
    .from("locations")
    .select(
      "id, slug, name, address_line, city, state, postal_code, lat, lng, geocode_status, category, distribution_day, next_distribution_dates, distribution_time_text, availability_status, enrollment_frequency, enrollment_time_text, additional_languages, additional_info, zip_codes_served, outside_zip_code, source_url, site_url, active, last_scraped_at, last_changed_at",
    )
    .eq("active", true)
    .order("name", { ascending: true });

  if (error || !data?.length) {
    return MOCK_LOCATIONS;
  }

  return data.map(mapLocationRow);
}

function mapLocationRow(row: LocationRow): Location {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    addressLine: row.address_line,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    lat: row.lat,
    lng: row.lng,
    geocodeStatus: row.geocode_status,
    category: row.category,
    distributionDay: row.distribution_day,
    nextDistributionDates: row.next_distribution_dates ?? [],
    distributionTimeText: row.distribution_time_text,
    availabilityStatus: row.availability_status,
    enrollmentFrequency: row.enrollment_frequency,
    enrollmentTimeText: row.enrollment_time_text,
    additionalLanguages: row.additional_languages ?? [],
    additionalInfo: row.additional_info ?? [],
    zipCodesServed: row.zip_codes_served ?? [],
    outsideZipCode: row.outside_zip_code,
    sourceUrl: row.source_url,
    siteUrl: row.site_url,
    active: row.active,
    lastScrapedAt: row.last_scraped_at,
    lastChangedAt: row.last_changed_at,
  };
}
