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

// LA covers a much larger area than SF, so start zoomed out enough to
// include South LA / Compton sites alongside downtown.
const SF_INITIAL_ZOOM = 13;
const LA_INITIAL_ZOOM = 11;

export function HomePageClient({ locations, locationList }: Props) {
  // null = landing; otherwise holds the initial center + zoom for the (shared) map.
  const [mapView, setMapView] = useState<{ center: LatLng; zoom: number } | null>(null);

  if (mapView) {
    return (
      <main style={{ height: "100vh" }}>
        <GoogleMapView
          locations={locations}
          initialCenter={mapView.center}
          initialZoom={mapView.zoom}
        />
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
          <button
            className={styles.button}
            onClick={() => setMapView({ center: SAN_FRANCISCO, zoom: SF_INITIAL_ZOOM })}
          >
            Show SF Map
          </button>
          <button
            className={styles.buttonLa}
            onClick={() => setMapView({ center: LOS_ANGELES, zoom: LA_INITIAL_ZOOM })}
          >
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
