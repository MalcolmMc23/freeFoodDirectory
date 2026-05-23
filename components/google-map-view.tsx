"use client";

import { useEffect, useRef, useState } from "react";
import { formatLocationAddress, type Location } from "../lib/types";
import styles from "./google-map-view.module.css";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const SAN_FRANCISCO = { lat: 37.7749, lng: -122.4194 };
const SF_BOUNDS = { north: 37.970, south: 37.660, west: -122.560, east: -122.300 };
const CA_BOUNDS = { north: 42.1, south: 32.5, west: -124.5, east: -113.9 };

declare global {
  interface Window {
    __googleMapsInit?: () => void;
    __googleMapsLoader?: Promise<void>;
    google: {
      maps: {
        Map: new (el: HTMLElement, opts: object) => {
          addListener: (event: string, cb: () => void) => void;
          getZoom: () => number;
        };
        Marker: new (opts: { map: object; position: { lat: number; lng: number }; title?: string; icon?: object | string; clickable?: boolean }) => {
          addListener: (event: string, cb: () => void) => void;
          setMap: (map: object | null) => void;
        };
        InfoWindow: new (opts: { content: string }) => {
          open: (opts: { anchor: object; map: object }) => void;
          close: () => void;
        };
        Polygon: new (opts: object) => object;
      };
    };
  }
}

const loadGoogleMaps = async (apiKey: string) => {
  if (window.google?.maps) return;

  if (window.__googleMapsLoader) return window.__googleMapsLoader;

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

function getTodayName(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

function isOpenToday(loc: Location): boolean {
  if (!loc.distributionDay) return false;
  return loc.distributionDay.toLowerCase() === getTodayName().toLowerCase();
}

function infoWindowContent(loc: Location): string {
  const title = escapeHtml(loc.name);
  const address = escapeHtml(formatLocationAddress(loc));
  const time = loc.distributionTimeText ? escapeHtml(loc.distributionTimeText) : "";
  const openToday = isOpenToday(loc);
  const nextDate = loc.nextDistributionDates[0] ?? null;
  const directionsUrl = googleMapsDirectionsUrl(loc);
  const siteUrl = loc.siteUrl ?? loc.sourceUrl;

  const availabilityColor =
    loc.availabilityStatus?.toLowerCase().includes("waitlist") ? "#e07a5f"
    : loc.availabilityStatus?.toLowerCase().includes("available") ? "#81b29a"
    : "#a4a4ad";

  const statusBadge = openToday
    ? `<div style="display:inline-block;padding:2px 8px;border-radius:4px;background:#81b29a;color:#0e1a14;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:7px">Open Today</div>`
    : nextDate
      ? `<div style="display:inline-block;padding:2px 8px;border-radius:4px;background:#1c1c22;border:1px solid rgba(236,236,239,0.15);color:#6b6b74;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:500;letter-spacing:1px;text-transform:uppercase;margin-bottom:7px">Next: ${escapeHtml(nextDate)}</div>`
      : "";

  const timeRow = time
    ? `<div style="margin-bottom:6px;font-family:'Patrick Hand',sans-serif;font-size:15px;color:#ececef">${time}</div>`
    : "";

  const availRow = loc.availabilityStatus
    ? `<div style="margin-bottom:10px;font-family:'Patrick Hand',sans-serif;font-size:14px;color:${availabilityColor}">${escapeHtml(loc.availabilityStatus)}</div>`
    : "";

  const languages = loc.additionalLanguages.length
    ? `<div style="margin-bottom:10px;font-family:'JetBrains Mono',monospace;font-size:10px;color:#6b6b74;text-transform:uppercase;letter-spacing:1px">${escapeHtml(loc.additionalLanguages.join(" · "))}</div>`
    : "";

  return `
    <div style="min-width:260px;max-width:300px;padding:10px 14px 12px;background:#16161a;color:#ececef;font-family:'Patrick Hand',system-ui,sans-serif">
      ${statusBadge}
      <div style="margin:0 0 4px;font-family:'Patrick Hand',sans-serif;font-size:19px;line-height:1.2;color:#ececef">${title}</div>
      <div style="margin:0 0 10px;font-family:'JetBrains Mono',monospace;font-size:11px;color:#6b6b74;line-height:1.4">${address}</div>
      ${timeRow}
      ${availRow}
      ${languages}
      <div style="display:flex;flex-wrap:wrap;gap:6px;padding-top:10px;border-top:1px dashed rgba(236,236,239,0.15)">
        <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer"
          style="display:inline-flex;align-items:center;padding:8px 14px;border-radius:6px;background:#f3a64a;color:#1a1208;text-decoration:none;font-family:'Patrick Hand',sans-serif;font-size:14px">
          Directions →
        </a>
        ${siteUrl ? `
          <a href="${escapeHtml(siteUrl)}" target="_blank" rel="noopener noreferrer"
            style="display:inline-flex;align-items:center;padding:8px 14px;border-radius:6px;background:transparent;border:1px dashed rgba(236,236,239,0.22);color:#a4a4ad;text-decoration:none;font-family:'Patrick Hand',sans-serif;font-size:14px">
            Website ↗
          </a>
        ` : ""}
      </div>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function googleMapsDirectionsUrl(loc: Location): string {
  const query = encodeURIComponent(`${loc.name}, ${formatLocationAddress(loc)}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

type Props = { locations: Location[] };

export function GoogleMapView({ locations }: Props) {
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

        if (cancelled || !mapRef.current || !window.google?.maps) return;

        const { Map, Marker, InfoWindow } = window.google.maps;

        // Inject CSS to dark-theme the Google Maps InfoWindow chrome
        if (!document.getElementById("gm-iw-dark")) {
          const style = document.createElement("style");
          style.id = "gm-iw-dark";
          style.textContent = `
            .gm-style .gm-style-iw-c {
              background: #16161a !important;
              border: 1.5px dashed rgba(236,236,239,0.22) !important;
              border-radius: 6px !important;
              box-shadow: none !important;
              padding: 0 !important;
            }
            .gm-style .gm-style-iw-d {
              overflow: auto !important;
            }
            .gm-style .gm-style-iw-t::after {
              background: linear-gradient(45deg, #16161a 50%, rgba(0,0,0,0) 51%) !important;
            }
            .gm-style .gm-style-iw button[title="Close"] {
              opacity: 0.5 !important;
              filter: invert(1) !important;
            }
          `;
          document.head.appendChild(style);
        }

        const map = new Map(mapRef.current, {
          center: SAN_FRANCISCO,
          zoom: 13,
          mapTypeId: "roadmap",
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: "greedy",
          keyboardShortcuts: true,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#0e0e10" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#6b6b74" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#0e0e10" }] },
            { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#1c1c22" }] },
            { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
            { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#16161a" }] },
            { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#14141a" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#1c1c22" }] },
            { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0e0e10" }] },
            { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#6b6b74" }] },
            { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#1c1c22" }] },
            { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#242430" }] },
            { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#16161a" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#080810" }] },
            { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#6b6b74" }] },
          ],
        });

        let openWindow: InstanceType<typeof InfoWindow> | null = null;
        const mappableLocations = locations.filter(hasCoordinates);

        // Tapping the map (outside any marker) dismisses the open popup.
        // Marker clicks don't propagate to the map, so pin taps still work.
        map.addListener("click", () => {
          openWindow?.close();
          openWindow = null;
        });

        for (const loc of mappableLocations) {
          const openNow = isOpenToday(loc);
          const marker = new Marker({
            map,
            position: { lat: loc.lat, lng: loc.lng },
            title: loc.name,
            icon: {
              path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z",
              fillColor: openNow ? "#81b29a" : "#f3a64a",
              fillOpacity: 1,
              strokeColor: openNow ? "#4a8c6f" : "#c47d28",
              strokeWeight: 1.5,
              scale: 1.6,
              anchor: { x: 12, y: 24 },
            },
          });

          const infoWindow = new InfoWindow({
            content: infoWindowContent(loc),
          });

          marker.addListener("click", () => {
            openWindow?.close();
            infoWindow.open({ anchor: marker, map });
            openWindow = infoWindow;
          });
        }
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
  }, [locations]);

  return (
    <section className={styles.page}>
      <div ref={mapRef} className={styles.map} />
      {error ? <div className={styles.error}>{error}</div> : null}
    </section>
  );
}

function hasCoordinates(loc: Location): loc is Location & { lat: number; lng: number } {
  return typeof loc.lat === "number" && typeof loc.lng === "number";
}
