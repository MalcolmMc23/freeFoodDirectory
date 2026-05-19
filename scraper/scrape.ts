import { chromium } from "playwright";
import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE_URL = "https://foodlocator.sfmfoodbank.org/en/sf/94108/urgent/calfresh";
const DATA_DIR = join(__dirname, "data");
const LATEST = join(DATA_DIR, "latest.json");
const PREVIOUS = join(DATA_DIR, "previous.json");
const CHANGES = join(DATA_DIR, "changes.json");
const ENV_FILE = join(__dirname, "..", ".env.local");

type ScrapedLocation = {
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
  sourceUrl: string;
  siteUrl: string | null;
  active: boolean;
};

type RawScrapedLocation = {
  name: string;
  fullAddress: string;
  siteUrl: string | null;
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
};

type SnapshotChange = {
  slug: string;
  field: string;
  from: string;
  to: string;
};

async function scrape(): Promise<ScrapedLocation[]> {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log("Fetching", SOURCE_URL);
  await page.goto(SOURCE_URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);

  const results = await page.evaluate(() => {
    const sections = document.querySelectorAll(".content-div .ng-scope");

    return Array.from(sections)
      .map((section) => {
        const nameEl = section.querySelector("h2.ng-binding");
        if (!nameEl) return null;

        const name = nameEl.childNodes[0]?.textContent?.trim() ?? "";
        const fullAddress =
          section.querySelector("span.text-nowrap.ng-binding")?.textContent?.trim() ?? "";

        const rows = new Map<string, string | string[]>();
        section.querySelectorAll("table.resource-table tbody tr").forEach((row) => {
          const label = row.querySelector("th.ng-binding")?.textContent?.trim();
          if (!label) return;

          const listItems = Array.from(row.querySelectorAll("td ul li"))
            .map((li) => li.textContent?.trim() ?? "")
            .filter(Boolean);

          if (listItems.length > 0) {
            rows.set(label, listItems);
            return;
          }

          const binding = row.querySelector("td.ng-binding")?.textContent?.trim();
          if (binding) {
            rows.set(label, binding);
            return;
          }

          const fallback = row.querySelector("td")?.textContent?.trim();
          if (fallback) rows.set(label, fallback);
        });

        const actionLinks = Array.from(section.querySelectorAll("a"));
        const sitePageLink =
          actionLinks.find((link) => (link.textContent ?? "").toLowerCase().includes("visit site page"))?.getAttribute("href") ??
          null;

        const outsideZipCode = section.textContent?.includes("Outside Your Zip Code") ?? false;

        if (
          name.toLowerCase().includes("you may qualify for the following types of food assistance")
        ) {
          return null;
        }

        return {
          name,
          fullAddress,
          siteUrl: sitePageLink ? new window.URL(sitePageLink, window.location.origin).toString() : null,
          distributionDay: single(rows.get("Distribution Day")),
          nextDistributionDates: many(rows.get("Next Distribution")),
          distributionTimeText: single(rows.get("Distribution Time")),
          availabilityStatus: single(rows.get("Availability")),
          enrollmentFrequency: single(rows.get("Enrollment Frequency")),
          enrollmentTimeText: single(rows.get("Enrollment Time")),
          additionalLanguages: many(rows.get("Additional Languages")),
          additionalInfo: many(rows.get("Additional Information")),
          zipCodesServed: many(rows.get("Zip Codes Served")),
          outsideZipCode,
        };
      })
      .filter(Boolean);

    function single(value: string | string[] | undefined): string | null {
      if (!value) return null;
      return Array.isArray(value) ? value.join(", ") : value;
    }

    function many(value: string | string[] | undefined): string[] {
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    }
  });

  await browser.close();

  return results
    .filter((result): result is RawScrapedLocation => result !== null)
    .map((result) => normalizeScrapedLocation(result))
    .filter((result): result is ScrapedLocation => result !== null);
}

function normalizeScrapedLocation(raw: RawScrapedLocation): ScrapedLocation | null {
  if (!raw.name || !raw.fullAddress) return null;

  const parsedAddress = parseAddress(raw.fullAddress);
  const postalSuffix = parsedAddress.postalCode ?? "sf";

  return {
    slug: slugify(`${raw.name}-${postalSuffix}`),
    name: raw.name,
    addressLine: parsedAddress.addressLine,
    city: parsedAddress.city,
    state: parsedAddress.state,
    postalCode: parsedAddress.postalCode,
    lat: null,
    lng: null,
    geocodeStatus: "pending",
    category: "weekly_groceries",
    distributionDay: raw.distributionDay,
    nextDistributionDates: raw.nextDistributionDates,
    distributionTimeText: raw.distributionTimeText,
    availabilityStatus: raw.availabilityStatus,
    enrollmentFrequency: raw.enrollmentFrequency,
    enrollmentTimeText: raw.enrollmentTimeText,
    additionalLanguages: dedupe(raw.additionalLanguages),
    additionalInfo: dedupe(raw.additionalInfo),
    zipCodesServed: dedupe(raw.zipCodesServed),
    outsideZipCode: raw.outsideZipCode,
    sourceUrl: SOURCE_URL,
    siteUrl: raw.siteUrl,
    active: true,
  };
}

function parseAddress(fullAddress: string) {
  const match = fullAddress.match(/^(.*)\s+San Francisco(?:\s+CA)?\s+(\d{5})$/i);

  if (match) {
    return {
      addressLine: match[1].trim(),
      city: "San Francisco",
      state: "CA",
      postalCode: match[2],
    };
  }

  return {
    addressLine: fullAddress.trim(),
    city: "San Francisco",
    state: "CA",
    postalCode: null,
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value && value !== "-"))];
}

function snapshotHash(location: ScrapedLocation): string {
  return createHash("sha256").update(JSON.stringify(location)).digest("hex");
}

function diff(previous: ScrapedLocation[], current: ScrapedLocation[]) {
  const changes: {
    added: ScrapedLocation[];
    removed: ScrapedLocation[];
    changed: SnapshotChange[];
  } = { added: [], removed: [], changed: [] };

  const previousMap = new Map(previous.map((location) => [location.slug, location] as const));
  const currentMap = new Map(current.map((location) => [location.slug, location] as const));

  for (const [slug, location] of currentMap) {
    if (!previousMap.has(slug)) {
      changes.added.push(location);
      continue;
    }

    const old = previousMap.get(slug)!;
    for (const key of Object.keys(location) as Array<keyof ScrapedLocation>) {
      const before = JSON.stringify(old[key]);
      const after = JSON.stringify(location[key]);
      if (before !== after) {
        changes.changed.push({ slug, field: key, from: before, to: after });
      }
    }
  }

  for (const [slug, location] of previousMap) {
    if (!currentMap.has(slug)) changes.removed.push(location);
  }

  return changes;
}

function loadEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};

  return readFileSync(filePath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .reduce<Record<string, string>>((acc, line) => {
      const idx = line.indexOf("=");
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
      acc[key] = value;
      return acc;
    }, {});
}

async function syncToSupabase(locations: ScrapedLocation[]) {
  const env = { ...loadEnvFile(ENV_FILE), ...process.env };
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const googleMapsApiKey = env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.log("Skipping Supabase sync. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws as unknown as WebSocketLikeConstructor },
  });

  const scrapeTimestamp = new Date().toISOString();
  const { data: existingRows, error: existingError } = await supabase
    .from("locations")
    .select("id, slug, lat, lng, geocode_status, active, name, address_line, city, state, postal_code, category, distribution_day, next_distribution_dates, distribution_time_text, availability_status, enrollment_frequency, enrollment_time_text, additional_languages, additional_info, zip_codes_served, outside_zip_code, source_url, site_url")
    .eq("source_url", SOURCE_URL);

  if (existingError) {
    throw new Error(`Failed to load existing locations: ${existingError.message}`);
  }

  const existingBySlug = new Map((existingRows ?? []).map((row) => [row.slug, row]));

  const enrichedLocations = await Promise.all(
    locations.map((location) => geocodeLocation(location, existingBySlug.get(location.slug), googleMapsApiKey)),
  );

  const rowsToUpsert = enrichedLocations.map((location) => {
    const existing = existingBySlug.get(location.slug);
    const changed = hasLocationChanged(existing, location);

    return {
      slug: location.slug,
      name: location.name,
      address_line: location.addressLine,
      city: location.city,
      state: location.state,
      postal_code: location.postalCode,
      lat: location.lat,
      lng: location.lng,
      geocode_status: location.geocodeStatus,
      category: location.category,
      distribution_day: location.distributionDay,
      next_distribution_dates: location.nextDistributionDates,
      distribution_time_text: location.distributionTimeText,
      availability_status: location.availabilityStatus,
      enrollment_frequency: location.enrollmentFrequency,
      enrollment_time_text: location.enrollmentTimeText,
      additional_languages: location.additionalLanguages,
      additional_info: location.additionalInfo,
      zip_codes_served: location.zipCodesServed,
      outside_zip_code: location.outsideZipCode,
      source_url: location.sourceUrl,
      site_url: location.siteUrl,
      active: true,
      last_scraped_at: scrapeTimestamp,
      last_changed_at: changed ? scrapeTimestamp : null,
    };
  });

  const { data: upsertedRows, error: upsertError } = await supabase
    .from("locations")
    .upsert(rowsToUpsert, { onConflict: "slug", defaultToNull: false })
    .select("id, slug");

  if (upsertError) {
    throw new Error(`Failed to upsert locations: ${upsertError.message}`);
  }

  const locationIds = new Map((upsertedRows ?? []).map((row) => [row.slug, row.id]));
  const snapshots = enrichedLocations.flatMap((location) => {
    const locationId = locationIds.get(location.slug);
    if (!locationId) return [];

    return [
      {
        location_id: locationId,
        snapshot_hash: snapshotHash(location),
        payload_json: location,
      },
    ];
  });

  if (snapshots.length > 0) {
    const { error: snapshotError } = await supabase
      .from("location_snapshots")
      .upsert(snapshots, { onConflict: "location_id,snapshot_hash", ignoreDuplicates: true });

    if (snapshotError) {
      throw new Error(`Failed to store snapshots: ${snapshotError.message}`);
    }
  }

  const currentSlugs = new Set(enrichedLocations.map((location) => location.slug));
  const missingSlugs = (existingRows ?? [])
    .map((row) => row.slug)
    .filter((slug) => !currentSlugs.has(slug));

  if (missingSlugs.length > 0) {
    const { error: deactivateError } = await supabase
      .from("locations")
      .update({ active: false, last_scraped_at: scrapeTimestamp, last_changed_at: scrapeTimestamp })
      .in("slug", missingSlugs);

    if (deactivateError) {
      throw new Error(`Failed to deactivate missing locations: ${deactivateError.message}`);
    }
  }

  console.log(`Synced ${enrichedLocations.length} location(s) to Supabase.`);
}

async function geocodeLocation(
  location: ScrapedLocation,
  existing:
    | {
        address_line: string;
        city: string;
        state: string;
        postal_code: string | null;
        lat: number | null;
        lng: number | null;
        geocode_status: string;
      }
    | undefined,
  apiKey: string | undefined,
): Promise<ScrapedLocation> {
  const existingAddress = existing
    ? normalizeAddressKey(existing.address_line, existing.city, existing.state, existing.postal_code)
    : null;
  const nextAddress = normalizeAddressKey(location.addressLine, location.city, location.state, location.postalCode);

  if (
    existing &&
    existingAddress === nextAddress &&
    typeof existing.lat === "number" &&
    typeof existing.lng === "number"
  ) {
    return {
      ...location,
      lat: existing.lat,
      lng: existing.lng,
      geocodeStatus: existing.geocode_status === "success" ? "success" : "pending",
    };
  }

  if (!apiKey) {
    return {
      ...location,
      geocodeStatus: existing?.geocode_status === "failed" ? "failed" : "pending",
    };
  }

  const address = [location.addressLine, location.city, location.state, location.postalCode]
    .filter(Boolean)
    .join(", ");
  const url =
    "https://maps.googleapis.com/maps/api/geocode/json?" +
    new URLSearchParams({
      address,
      key: apiKey,
    }).toString();

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { ...location, geocodeStatus: "failed" };
    }

    const payload = (await response.json()) as {
      status?: string;
      results?: Array<{ geometry?: { location?: { lat?: number; lng?: number } } }>;
    };

    const point = payload.results?.[0]?.geometry?.location;
    if (payload.status !== "OK" || typeof point?.lat !== "number" || typeof point?.lng !== "number") {
      return { ...location, geocodeStatus: "failed" };
    }

    return {
      ...location,
      lat: point.lat,
      lng: point.lng,
      geocodeStatus: "success",
    };
  } catch {
    return { ...location, geocodeStatus: "failed" };
  }
}

function normalizeAddressKey(addressLine: string, city: string, state: string, postalCode: string | null): string {
  return [addressLine, city, state, postalCode ?? ""]
    .join("|")
    .trim()
    .toLowerCase();
}

function hasLocationChanged(
  existing:
    | {
        name: string;
        address_line: string;
        city: string;
        state: string;
        postal_code: string | null;
        category: string | null;
        distribution_day: string | null;
        next_distribution_dates: string[];
        distribution_time_text: string | null;
        availability_status: string | null;
        enrollment_frequency: string | null;
        enrollment_time_text: string | null;
        additional_languages: string[];
        additional_info: string[];
        zip_codes_served: string[];
        outside_zip_code: boolean;
        source_url: string | null;
        site_url: string | null;
        active: boolean;
      }
    | undefined,
  next: ScrapedLocation,
): boolean {
  if (!existing) return true;

  return JSON.stringify({
    name: existing.name,
    addressLine: existing.address_line,
    city: existing.city,
    state: existing.state,
    postalCode: existing.postal_code,
    category: existing.category,
    distributionDay: existing.distribution_day,
    nextDistributionDates: existing.next_distribution_dates ?? [],
    distributionTimeText: existing.distribution_time_text,
    availabilityStatus: existing.availability_status,
    enrollmentFrequency: existing.enrollment_frequency,
    enrollmentTimeText: existing.enrollment_time_text,
    additionalLanguages: existing.additional_languages ?? [],
    additionalInfo: existing.additional_info ?? [],
    zipCodesServed: existing.zip_codes_served ?? [],
    outsideZipCode: existing.outside_zip_code,
    sourceUrl: existing.source_url,
    siteUrl: existing.site_url,
    active: existing.active,
  }) !== JSON.stringify(next);
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  const current = await scrape();
  console.log(`\nFound ${current.length} food location(s)\n`);
  current.forEach((location, index) => {
    console.log(`[${index + 1}] ${location.name}`);
    console.log(`    Address: ${location.addressLine}, ${location.city}, ${location.state} ${location.postalCode ?? ""}`.trim());
    if (location.distributionDay || location.distributionTimeText) {
      console.log(`    Distribution: ${location.distributionDay ?? "Unknown"} ${location.distributionTimeText ?? ""}`.trim());
    }
    if (location.availabilityStatus) console.log(`    Availability: ${location.availabilityStatus}`);
  });

  if (existsSync(LATEST)) {
    const raw = readFileSync(LATEST, "utf8");
    writeFileSync(PREVIOUS, raw);

    const previous: ScrapedLocation[] = JSON.parse(raw);
    const changes = diff(previous, current);
    const hasChanges =
      changes.added.length || changes.removed.length || changes.changed.length;

    if (hasChanges) {
      writeFileSync(CHANGES, JSON.stringify(changes, null, 2));
      console.log("\n=== CHANGES DETECTED ===");
      changes.added.forEach((location) => console.log(`  + Added:   ${location.slug}`));
      changes.removed.forEach((location) => console.log(`  - Removed: ${location.slug}`));
      changes.changed.forEach((change) =>
        console.log(
          `  ~ Changed: ${change.slug} [${change.field}]\n      was: ${change.from}\n      now: ${change.to}`,
        ),
      );
      console.log(`\nFull diff saved to: ${CHANGES}`);
    } else {
      console.log("\nNo changes detected since last run.");
    }
  } else {
    console.log("First run — no previous snapshot to compare.");
  }

  writeFileSync(LATEST, JSON.stringify(current, null, 2));
  console.log(`Snapshot saved to: ${LATEST}`);

  await syncToSupabase(current);
}

main().catch((err) => {
  console.error("Scrape failed:", err);
  process.exit(1);
});
