"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Location } from "../lib/types";
import { GoogleMapView } from "./google-map-view";
import styles from "../app/page.module.css";

type Props = {
  locations: Location[];
  locationList: React.ReactNode;
};

export function HomePageClient({ locations, locationList }: Props) {
  const [showMap, setShowMap] = useState(false);

  if (showMap) {
    return (
      <main style={{ height: "100vh" }}>
        <GoogleMapView locations={locations} />
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
        <h1 className={styles.title}>Find Free Food in San Francisco</h1>
        <button className={styles.button} onClick={() => setShowMap(true)}>
          Show Map
        </button>
        <div className={styles.links}>
          <Link href="/faq" className={styles.faqLink}>FAQ</Link>
          <span className={styles.linkDivider}>·</span>
          <Link href="/sources" className={styles.faqLink}>Sources</Link>
        </div>
      </section>
      {locationList}
    </main>
  );
}
