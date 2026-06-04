import Link from "next/link";
import type { Location } from "../lib/types";
import { SF_NEIGHBORHOODS, getNeighborhoodByZip } from "../lib/neighborhoods";
import styles from "./location-list.module.css";

type Props = {
  locations: Location[];
};

export function LocationList({ locations }: Props) {
  const neighborhoodsWithLocations = SF_NEIGHBORHOODS.filter((n) =>
    locations.some((loc) => loc.postalCode && n.zips.includes(loc.postalCode)),
  );

  return (
    <section className={styles.section} aria-label="All free food locations in our system">
      {neighborhoodsWithLocations.length > 0 && (
        <div className={styles.neighborhoods}>
          <h2 className={styles.neighborhoodHeading}>Browse by neighborhood</h2>
          <ul className={styles.neighborhoodList}>
            {neighborhoodsWithLocations.map((n) => (
              <li key={n.slug}>
                <Link href={`/neighborhood/${n.slug}`} className={styles.neighborhoodLink}>
                  {n.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <h2 className={styles.heading}>
        {locations.length} free food locations in our system
      </h2>
      <ul className={styles.list}>
        {locations.map((loc) => {
          const neighborhood = loc.postalCode ? getNeighborhoodByZip(loc.postalCode) : null;
          return (
            <li key={loc.id} className={styles.item}>
              <span className={styles.name}>{loc.name}</span>
              <span className={styles.meta}>
                {loc.addressLine}
                {neighborhood ? ` · ${neighborhood.name}` : ""}
                {loc.distributionTimeText ? ` · ${loc.distributionTimeText}` : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
