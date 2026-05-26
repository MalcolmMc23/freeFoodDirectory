"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Location } from "../lib/types";
import { GoogleMapView } from "./google-map-view";
import styles from "../app/page.module.css";

type Props = {
  locations: Location[];
};

export function HomePageClient({ locations }: Props) {
  const [showMap, setShowMap] = useState(false);

  if (showMap) {
    return (
      <main>
        <GoogleMapView locations={locations} />
      </main>
    );
  }

  return (
    <main className={styles.landing}>
      <Image
        src="/assets/logo_1.png"
        alt="Free Food Maps logo"
        width={120}
        height={120}
        className={styles.logo}
        priority
      />
      <h1 className={styles.title}>Free Food Directory</h1>
      <button className={styles.button} onClick={() => setShowMap(true)}>
        Show Map
      </button>
      <Link href="/faq" className={styles.faqLink}>
        FAQ
      </Link>
    </main>
  );
}
