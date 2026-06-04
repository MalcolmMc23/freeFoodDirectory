import Link from "next/link";
import type { CitySlug } from "../lib/cities";
import { getLocationScheduleSummary } from "../lib/location-schedule";
import type { Location } from "../lib/types";
import { SUPPORTED_CITIES } from "../lib/cities";
import { getNeighborhoodByLocation, getNeighborhoodUrl, getNeighborhoodsByCity } from "../lib/neighborhoods";
import styles from "./location-list.module.css";

type Props = {
  locations: Location[];
  heading?: string;
  ariaLabel?: string;
  neighborhoodCitySlugs?: CitySlug[];
};

export function LocationList({
  locations,
  heading = `${locations.length} free food locations in our system`,
  ariaLabel = "All free food locations in our system",
  neighborhoodCitySlugs = SUPPORTED_CITIES.map((city) => city.slug),
}: Props) {
  const neighborhoodGroups = neighborhoodCitySlugs
    .map((citySlug) => {
      const neighborhoods = getNeighborhoodsByCity(citySlug).filter((neighborhood) =>
        locations.some((loc) => loc.postalCode && neighborhood.zips.includes(loc.postalCode)),
      );

      if (!neighborhoods.length) return null;

      const city = SUPPORTED_CITIES.find((entry) => entry.slug === citySlug);
      return {
        cityName: city?.name ?? citySlug,
        neighborhoods,
      };
    })
    .filter((group): group is NonNullable<typeof group> => group !== null);

  return (
    <section className={styles.section} aria-label={ariaLabel}>
      {neighborhoodGroups.length > 0 && (
        <div className={styles.neighborhoods}>
          {neighborhoodGroups.map((group) => (
            <div key={group.cityName} className={styles.neighborhoodGroup}>
              <h2 className={styles.neighborhoodHeading}>Browse {group.cityName} by neighborhood</h2>
              <ul className={styles.neighborhoodList}>
                {group.neighborhoods.map((neighborhood) => (
                  <li key={`${neighborhood.citySlug}-${neighborhood.slug}`}>
                    <Link href={getNeighborhoodUrl(neighborhood)} className={styles.neighborhoodLink}>
                      {neighborhood.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <h2 className={styles.heading}>{heading}</h2>
      <ul className={styles.list}>
        {locations.map((loc) => {
          const neighborhood = getNeighborhoodByLocation(loc);
          const scheduleSummary = getLocationScheduleSummary(loc);
          return (
            <li key={loc.id} className={styles.item}>
              <span className={styles.name}>{loc.name}</span>
              <span className={styles.meta}>
                {loc.addressLine}
                {neighborhood ? ` · ${neighborhood.name}` : ""}
                {scheduleSummary ? ` · ${scheduleSummary}` : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
