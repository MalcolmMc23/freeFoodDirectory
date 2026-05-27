"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Location } from "../lib/types";
import { GoogleMapView, SAN_FRANCISCO, LOS_ANGELES, type LatLng } from "./google-map-view";
import styles from "../app/page.module.css";

type Props = {
  locations: Location[];
  locationList: React.ReactNode;
};

export function HomePageClient({ locations, locationList }: Props) {
  // null = landing; otherwise holds the initial center for the (single, shared) map.
  const [mapCenter, setMapCenter] = useState<LatLng | null>(null);

  if (mapCenter) {
    return (
      <main style={{ height: "100vh" }}>
        <GoogleMapView locations={locations} initialCenter={mapCenter} />
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.landing}>
        <Image
          src="/assets/logo_transparent_background.png"
          alt="Free Food Maps logo"
          width={120}
          height={120}
          className={styles.logo}
          priority
        />
        <h1 className={styles.title}>Find Free Food</h1>
        <div className={styles.buttonGroup}>
          <button className={styles.button} onClick={() => setMapCenter(SAN_FRANCISCO)}>
            Show SF Map
          </button>
          <button className={styles.buttonLa} onClick={() => setMapCenter(LOS_ANGELES)}>
            Show LA Map
          </button>
        </div>
        <div className={styles.links}>
          <Link href="/faq" className={styles.faqLink}>FAQ</Link>
          <span className={styles.linkDivider}>·</span>
          <Link href="/sources" className={styles.faqLink}>Sources</Link>
          <span className={styles.linkDivider}>·</span>
          <Link href="/automations" className={styles.faqLink}>Automations</Link>
        </div>
      </section>
      {locationList}
    </main>
  );
}
