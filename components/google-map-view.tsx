"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./google-map-view.module.css";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const SAN_FRANCISCO = { lat: 37.7749, lng: -122.4194 };

declare global {
  interface Window {
    __googleMapsInit?: () => void;
    __googleMapsLoader?: Promise<void>;
    google?: {
      maps: {
        Map: new (
          element: HTMLElement,
          options: Record<string, unknown>
        ) => unknown;
      };
    };
  }
}

const loadGoogleMaps = async (apiKey: string) => {
  if (window.google?.maps) {
    return;
  }

  if (window.__googleMapsLoader) {
    return window.__googleMapsLoader;
  }

  window.__googleMapsLoader = new Promise<void>((resolve, reject) => {
    window.__googleMapsInit = () => resolve();

    const script = document.createElement("script");
    script.src =
      "https://maps.googleapis.com/maps/api/js" +
      `?key=${apiKey}&v=weekly&loading=async&callback=__googleMapsInit`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Google Maps failed to load."));
    document.head.appendChild(script);
  });

  return window.__googleMapsLoader;
};

export function GoogleMapView() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError("Missing Google Maps API key.");
      return;
    }

    let cancelled = false;

    const initializeMap = async () => {
      try {
        await loadGoogleMaps(GOOGLE_MAPS_API_KEY);

        if (cancelled || !mapRef.current || !window.google?.maps) {
          return;
        }

        new window.google.maps.Map(mapRef.current, {
          center: SAN_FRANCISCO,
          zoom: 13,
          mapTypeId: "roadmap",
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: "greedy",
          keyboardShortcuts: true
        });
      } catch {
        if (!cancelled) {
          setError("Google Maps could not load. Check the API key and allowed referrers.");
        }
      }
    };

    void initializeMap();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className={styles.page}>
      <div ref={mapRef} className={styles.map} />
      {error ? <div className={styles.error}>{error}</div> : null}
    </section>
  );
}
