"use client";

import { useState } from "react";
import { GoogleMapView } from "../components/google-map-view";
// TODO: replace MOCK_LOCATIONS with a Supabase fetch once connected
import { MOCK_LOCATIONS } from "../lib/mock-locations";
import styles from "./page.module.css";

export default function HomePage() {
  const [showMap, setShowMap] = useState(false);

  if (showMap) {
    return (
      <main>
        <GoogleMapView locations={MOCK_LOCATIONS} />
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
