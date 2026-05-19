"use client";

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
      <h1 className={styles.title}>Free Food Directory</h1>
      <button className={styles.button} onClick={() => setShowMap(true)}>
        Show Map
      </button>
    </main>
  );
}
