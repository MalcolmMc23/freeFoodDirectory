"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Location } from "../lib/types";
import {
  GoogleMapView,
  SAN_FRANCISCO,
  LOS_ANGELES,
  NEW_YORK,
  SEATTLE,
  LAS_VEGAS,
  HOUSTON,
  NEW_JERSEY,
  type LatLng,
} from "./google-map-view";
import { CommunityNotesHost } from "./community-notes/CommunityNotesPanel";
import styles from "../app/page.module.css";

type Props = {
  locations: Location[];
  locationList: React.ReactNode;
};

// Single source of truth for the city menu. Adding a new city = one entry.
// `colorVar` is the CSS variable already defined in globals.css; it drives
// the menu-item text color so each city keeps the accent it had as a button.
type CityOption = {
  label: string;
  center: LatLng;
  zoom: number;
  colorVar: string;
};

// LA-sized cities use zoom 11; SF stays at 13 (denser urban core); NJ is a
// full state so it zooms out to 9.
const CITIES: CityOption[] = [
  { label: "San Francisco", center: SAN_FRANCISCO, zoom: 13, colorVar: "--accent" },
  { label: "Los Angeles", center: LOS_ANGELES, zoom: 11, colorVar: "--accent-la" },
  { label: "New York City", center: NEW_YORK, zoom: 11, colorVar: "--accent-ny" },
  { label: "Seattle", center: SEATTLE, zoom: 11, colorVar: "--accent-sea" },
  { label: "Las Vegas", center: LAS_VEGAS, zoom: 11, colorVar: "--accent-vegas" },
  { label: "Houston", center: HOUSTON, zoom: 11, colorVar: "--accent-houston" },
  { label: "New Jersey", center: NEW_JERSEY, zoom: 9, colorVar: "--accent-nj" },
];

export function HomePageClient({ locations, locationList }: Props) {
  // null = landing; otherwise holds the initial center + zoom for the (shared) map.
  const [mapView, setMapView] = useState<{ center: LatLng; zoom: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click or Escape — standard dropdown UX.
  useEffect(() => {
    if (!menuOpen) return;
    const onDocPointer = (e: MouseEvent) => {
      if (menuWrapRef.current && !menuWrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  if (mapView) {
    return (
      <main style={{ height: "100vh" }}>
        <GoogleMapView
          locations={locations}
          initialCenter={mapView.center}
          initialZoom={mapView.zoom}
        />
        <CommunityNotesHost />
      </main>
    );
  }

  const pickCity = (city: CityOption) => {
    setMapView({ center: city.center, zoom: city.zoom });
    setMenuOpen(false);
  };

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

        <div className={styles.menuWrap} ref={menuWrapRef}>
          <button
            type="button"
            className={styles.menuTrigger}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            Pick a city
            <span
              className={`${styles.menuCaret} ${menuOpen ? styles.menuCaretOpen : ""}`}
              aria-hidden="true"
            >
              ▾
            </span>
          </button>
          {menuOpen && (
            <ul className={styles.menu} role="menu">
              {CITIES.map((city) => (
                <li key={city.label} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.menuItem}
                    style={{ color: `var(${city.colorVar})` }}
                    onClick={() => pickCity(city)}
                  >
                    {city.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
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
