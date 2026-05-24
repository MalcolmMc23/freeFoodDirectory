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
  const day = loc.distributionDay.toLowerCase();
  if (day === "daily" || day === "every day" || day === "monday-sunday" || day === "monday - sunday") return true;
  return day === getTodayName().toLowerCase();
}

function infoWindowContent(loc: Location): string {
  const title = escapeHtml(loc.name);
  const address = escapeHtml(formatLocationAddress(loc));
  const time = loc.distributionTimeText ? escapeHtml(loc.distributionTimeText) : "";
  const openToday = isOpenToday(loc);
  const directionsUrl = googleMapsDirectionsUrl(loc);
  const siteUrl = loc.siteUrl ?? loc.sourceUrl;

  const openBadge = openToday
    ? `<div style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;background:#1a2e1f;border:1px solid #4caf6e;color:#4caf6e;font-size:13px;font-weight:700;margin-bottom:10px">
        🟢 Open Now
       </div>`
    : `<div style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;background:#2a1a1a;border:1px solid #e07a5f;color:#e07a5f;font-size:13px;font-weight:700;margin-bottom:10px">
        🔴 Closed
       </div>`;

  const timeSlots = time ? time.split(",").map(s => s.trim()).filter(Boolean) : [];
  const timeRow = timeSlots.length
    ? `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px">
        <span style="font-size:16px;margin-top:2px">⏰</span>
        <div>
          <div style="font-size:10px;color:#6b6b74;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Today</div>
          ${timeSlots.map(s => `<div style="font-size:14px;color:#ececef;line-height:1.6">${s}</div>`).join("")}
        </div>
       </div>`
    : "";

  const availabilityColor =
    loc.availabilityStatus?.toLowerCase().includes("waitlist") ? "#e07a5f"
    : loc.availabilityStatus?.toLowerCase().includes("available") ? "#81b29a"
    : "#a4a4ad";

  const availRow = loc.availabilityStatus
    ? `<div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:6px;font-size:13px;color:${availabilityColor}">
        <span>📋</span><span>${escapeHtml(loc.availabilityStatus)}</span>
       </div>`
    : "";

  const languages = loc.additionalLanguages.length
    ? `<div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:6px;font-size:13px;color:#a4a4ad">
        <span>🌍</span><span>${escapeHtml(loc.additionalLanguages.join(", "))}</span>
       </div>`
    : "";

  const isDaily = loc.distributionDay
    ? ["daily", "every day", "monday-sunday", "monday - sunday"].includes(loc.distributionDay.toLowerCase())
    : false;

  const dayLabel = loc.distributionDay
    ? isDaily
      ? "Open every day"
      : `Usually: ${escapeHtml(loc.distributionDay)}s`
    : null;

  const upcomingDates = loc.nextDistributionDates.slice(0, 5);
  const scheduleRows = isDaily && timeSlots.length
    ? timeSlots.map(s => `<div style="font-size:13px;color:#ececef;line-height:1.8">• ${s}</div>`).join("")
    : upcomingDates.length
      ? upcomingDates.map(d => `<div style="padding:3px 0;font-size:13px;color:#ececef;border-bottom:1px solid rgba(236,236,239,0.07)">📅 ${escapeHtml(d)}</div>`).join("")
      : `<div style="font-size:13px;color:#6b6b74">No upcoming dates listed</div>`;

  const scheduleDropdown = `
    <details style="margin-bottom:10px">
      <summary style="cursor:pointer;font-size:13px;color:#a4a4ad;user-select:none;padding:4px 0;list-style:none;display:flex;align-items:center;gap:4px">
        🗓️ <span>View Schedule</span>
      </summary>
      <div style="margin-top:6px;padding:8px 10px;background:rgba(255,255,255,0.04);border-radius:6px;border:1px solid rgba(236,236,239,0.1)">
        ${dayLabel ? `<div style="font-size:12px;color:#6b6b74;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px">${dayLabel}</div>` : ""}
        ${scheduleRows}
      </div>
    </details>`;

  return `
    <div style="min-width:260px;max-width:300px;padding:12px 14px 12px;background:#16161a;color:#ececef;font-family:'Patrick Hand',system-ui,sans-serif;position:relative">
      <button onclick="window.__closeInfoWindow()" style="position:absolute;top:14px;right:14px;background:none;border:none;cursor:pointer;color:#6b6b74;font-size:18px;line-height:1;padding:0;margin:0" aria-label="Close">✕</button>
      <div style="margin-bottom:10px;padding-right:24px">
        ${openBadge.replace(' style="', ' style="margin-bottom:0;')}
      </div>
      <div style="margin:0 0 4px;font-size:19px;line-height:1.2;color:#ececef;font-weight:600">${title}</div>
      <div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:10px;font-size:12px;color:#6b6b74;line-height:1.4">
        <span>📍</span><span>${address}</span>
      </div>
      ${timeRow}
      ${availRow}
      ${languages}
      ${scheduleDropdown}
      <div style="display:flex;flex-wrap:wrap;gap:6px;padding-top:10px;border-top:1px dashed rgba(236,236,239,0.15)">
        <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer"
          style="display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:6px;background:#f3a64a;color:#1a1208;text-decoration:none;font-size:14px;font-weight:600">
          🗺️ Directions
        </a>
        ${siteUrl ? `
          <a href="${escapeHtml(siteUrl)}" target="_blank" rel="noopener noreferrer"
            style="display:inline-flex;align-items:center;gap:5px;padding:8px 14px;border-radius:6px;background:transparent;border:1px dashed rgba(236,236,239,0.22);color:#a4a4ad;text-decoration:none;font-size:14px">
            🌐 Website
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
            .gm-style .gm-style-iw-chr {
              display: none !important;
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
        (window as Window & { __closeInfoWindow?: () => void }).__closeInfoWindow = () => {
          openWindow?.close();
          openWindow = null;
        };
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
