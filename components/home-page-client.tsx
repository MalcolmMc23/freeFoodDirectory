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

// Single source of truth for the city wheel. Adding a city = one entry.
// `colorVar` is the CSS variable already in globals.css; it sets the wheel
// item's text color so each city keeps its established accent.
type CityOption = {
  label: string;
  center: LatLng;
  zoom: number;
  colorVar: string;
};

const CITIES: CityOption[] = [
  { label: "San Francisco", center: SAN_FRANCISCO, zoom: 13, colorVar: "--accent" },
  { label: "Los Angeles", center: LOS_ANGELES, zoom: 11, colorVar: "--accent-la" },
  { label: "New York City", center: NEW_YORK, zoom: 11, colorVar: "--accent-ny" },
  { label: "Seattle", center: SEATTLE, zoom: 11, colorVar: "--accent-sea" },
  { label: "Las Vegas", center: LAS_VEGAS, zoom: 11, colorVar: "--accent-vegas" },
  { label: "Houston", center: HOUSTON, zoom: 11, colorVar: "--accent-houston" },
  { label: "New Jersey", center: NEW_JERSEY, zoom: 9, colorVar: "--accent-nj" },
];

// Wheel geometry — kept here (not CSS) because the JS transform math depends on it.
const ITEM_H = 60;
const VISIBLE_ITEMS = 5; // viewport shows ~5 rows; outer rows are faded + tilted.
const WHEEL_H = ITEM_H * VISIBLE_ITEMS;
const CENTER_PAD = (WHEEL_H - ITEM_H) / 2; // lets the first/last item snap to center.
const DEG_PER_ITEM = 22; // visual tilt per row of distance from center.

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
        <CommunityNotesHost />
      </main>
    );
  }

  const pickCity = (city: CityOption) => {
    setMapView({ center: city.center, zoom: city.zoom });
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
        <CityWheel onPick={pickCity} />
        <p className={styles.wheelHint}>scroll to spin · tap to open</p>

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

/**
 * Vertical 3D picker — iOS "drum" / wheel-of-fortune feel.
 * Native scroll handles wheel/touch/momentum + scroll-snap snaps to a row.
 * Each row's rotateX + opacity + scale is recomputed from its distance to the
 * scroll center, producing the cylinder illusion. Clicking a row opens that
 * city's map (which row gets the click is usually the centered one because
 * scroll-snap parks it there).
 */
function CityWheel({ onPick }: { onPick: (city: CityOption) => void }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const rafPending = useRef(false);

  // rAF-throttle scroll → state so transforms stay buttery during fast spins.
  const handleScroll = () => {
    if (rafPending.current) return;
    rafPending.current = true;
    requestAnimationFrame(() => {
      if (scrollRef.current) setScrollTop(scrollRef.current.scrollTop);
      rafPending.current = false;
    });
  };

  // Keyboard arrows nudge the wheel by one row.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      if (document.activeElement !== el && !el.contains(document.activeElement)) return;
      e.preventDefault();
      const delta = e.key === "ArrowDown" ? ITEM_H : -ITEM_H;
      el.scrollTo({ top: el.scrollTop + delta, behavior: "smooth" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={styles.wheel}>
      <div className={styles.wheelBand} aria-hidden="true" />
      <div
        ref={scrollRef}
        className={styles.wheelScroll}
        onScroll={handleScroll}
        style={{ height: WHEEL_H }}
        tabIndex={0}
        role="listbox"
        aria-label="Pick a city"
      >
        <div style={{ height: CENTER_PAD }} aria-hidden="true" />
        {CITIES.map((city, i) => {
          const distance = (i * ITEM_H - scrollTop) / ITEM_H;
          // Clamp so items more than 3 rows away don't flip past 90°.
          const clamped = Math.max(-3, Math.min(3, distance));
          const angle = clamped * DEG_PER_ITEM;
          const opacity = Math.max(0.18, 1 - Math.abs(distance) * 0.32);
          const scale = Math.max(0.7, 1 - Math.abs(distance) * 0.08);
          return (
            <button
              key={city.label}
              type="button"
              className={styles.wheelItem}
              role="option"
              aria-selected={Math.abs(distance) < 0.5}
              style={{
                height: ITEM_H,
                color: `var(${city.colorVar})`,
                transform: `rotateX(${-angle}deg) scale(${scale})`,
                opacity,
              }}
              onClick={() => onPick(city)}
            >
              {city.label}
            </button>
          );
        })}
        <div style={{ height: CENTER_PAD }} aria-hidden="true" />
      </div>
      <div className={styles.wheelFade} aria-hidden="true" />
    </div>
  );
}
