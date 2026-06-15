"use client";

import { useEffect, useRef, useState } from "react";
import { formatLocationAddress, type Location } from "../lib/types";
import styles from "./google-map-view.module.css";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export type LatLng = { lat: number; lng: number };

export const SAN_FRANCISCO: LatLng = { lat: 37.7749, lng: -122.4194 };
export const LOS_ANGELES: LatLng = { lat: 34.0522, lng: -118.2437 };
export const NEW_YORK: LatLng = { lat: 40.7128, lng: -74.006 };
export const SEATTLE: LatLng = { lat: 47.6062, lng: -122.3321 };
export const LAS_VEGAS: LatLng = { lat: 36.1699, lng: -115.1398 };
export const HOUSTON: LatLng = { lat: 29.7604, lng: -95.3698 };
export const NEW_JERSEY: LatLng = { lat: 40.7357, lng: -74.1724 };

// Pin palette per city, matched to the "Show <City> Map" buttons.
// Open-now stays green everywhere — universal "good to go" signal.
const PIN_OPEN = { fill: "#81b29a", stroke: "#4a8c6f" } as const;
const PIN_SF_CLOSED = { fill: "#f3a64a", stroke: "#c47d28" } as const;
const PIN_LA_CLOSED = { fill: "#5fb6ec", stroke: "#3a8ec4" } as const;
const PIN_NY_CLOSED = { fill: "#e26d6d", stroke: "#b54848" } as const;
const PIN_SEA_CLOSED = { fill: "#a87fd1", stroke: "#7a52a6" } as const;
const PIN_VEGAS_CLOSED = { fill: "#e571c0", stroke: "#b04694" } as const;
const PIN_HOUSTON_CLOSED = { fill: "#5fc7b8", stroke: "#3a9385" } as const;
const PIN_NJ_CLOSED = { fill: "#5b73d1", stroke: "#3a4ea1" } as const;

// City regions are inferred from coordinates. Checked in order:
// Houston bbox (TX coast) → NJ bbox (everything west of the Hudson) →
// east-coast lng band is NY → north of ~45°N is Seattle → the inland NV
// band (-116..-114) is Vegas → south of ~36°N is LA → everything else SF.
// Houston + NJ are checked first because they sit east of -100°W and
// would otherwise fall into the NY bucket.
const LA_REGION_MAX_LAT = 36;
const SEA_REGION_MIN_LAT = 45;
const EAST_COAST_LNG_MAX = -100;
const VEGAS_LNG_MIN = -116;
const VEGAS_LNG_MAX = -114;
const HOUSTON_LAT_MIN = 29;
const HOUSTON_LAT_MAX = 31;
const HOUSTON_LNG_MIN = -96;
const HOUSTON_LNG_MAX = -94;
// NJ bbox stops at -74.0 so anything east of the Hudson (NYC proper)
// still resolves to PIN_NY_CLOSED.
const NJ_LAT_MIN = 38.9;
const NJ_LAT_MAX = 41.4;
const NJ_LNG_MIN = -75.6;
const NJ_LNG_MAX = -74.0;

function pinPalette(loc: Location, openNow: boolean): { fill: string; stroke: string } {
  if (openNow) return PIN_OPEN;
  const lat = loc.lat;
  const lng = loc.lng;
  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    lat >= HOUSTON_LAT_MIN && lat <= HOUSTON_LAT_MAX &&
    lng >= HOUSTON_LNG_MIN && lng <= HOUSTON_LNG_MAX
  ) return PIN_HOUSTON_CLOSED;
  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    lat >= NJ_LAT_MIN && lat <= NJ_LAT_MAX &&
    lng >= NJ_LNG_MIN && lng <= NJ_LNG_MAX
  ) return PIN_NJ_CLOSED;
  if (typeof lng === "number" && lng > EAST_COAST_LNG_MAX) return PIN_NY_CLOSED;
  if (typeof lat === "number" && lat >= SEA_REGION_MIN_LAT) return PIN_SEA_CLOSED;
  if (typeof lng === "number" && lng >= VEGAS_LNG_MIN && lng <= VEGAS_LNG_MAX) return PIN_VEGAS_CLOSED;
  const isLA = typeof lat === "number" && lat < LA_REGION_MAX_LAT;
  return isLA ? PIN_LA_CLOSED : PIN_SF_CLOSED;
}

type GeoFeature = { getProperty: (key: string) => unknown };
type GeoStyle = object;

type GoogleMapsDataLayer = {
  loadGeoJson: (url: string) => void;
  setStyle: (style: GeoStyle | ((feature: GeoFeature) => GeoStyle)) => void;
  overrideStyle: (feature: GeoFeature, style: GeoStyle) => void;
  revertStyle: (feature?: GeoFeature) => void;
  addListener: (event: string, cb: (e: { feature: GeoFeature }) => void) => void;
  setMap: (map: object | null) => void;
};

declare global {
  interface Window {
    __googleMapsInit?: () => void;
    __googleMapsLoader?: Promise<void>;
    openCommunityNotes?: (locationId: string, name: string) => void;
    google: {
      maps: {
        Map: new (el: HTMLElement, opts: object) => {
          addListener: (event: string, cb: () => void) => void;
          getZoom: () => number;
          data: GoogleMapsDataLayer;
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
        Data: new (opts: { map: object }) => GoogleMapsDataLayer;
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

function getTodayNameSF(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long", timeZone: "America/Los_Angeles" });
}

function getCurrentMinutesSF(): number {
  const sfTime = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  return sfTime.getHours() * 60 + sfTime.getMinutes();
}

function parseTimeToMinutes(t: string): number | null {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!m) return null;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const period = m[3].toLowerCase();
  if (period === "pm" && h !== 12) h += 12;
  if (period === "am" && h === 12) h = 0;
  return h * 60 + min;
}

function isCurrentlyOpen(loc: Location): boolean {
  if (!loc.distributionDay) return false;
  const day = loc.distributionDay.toLowerCase();
  const isEveryDay = day === "daily" || day === "every day" || day === "monday-sunday" || day === "monday - sunday";
  if (!isEveryDay && day !== getTodayNameSF().toLowerCase()) return false;

  if (!loc.distributionTimeText) return true;

  const now = getCurrentMinutesSF();
  // Normalize en-dash (–) and non-breaking hyphen (‐) to regular hyphen
  const normalized = loc.distributionTimeText.replace(/[–‐]/g, "-");
  const slots = normalized.split(",");
  for (const slot of slots) {
    const parts = slot.trim().split(/\s*-\s*/);
    if (parts.length >= 2) {
      const start = parseTimeToMinutes(parts[0]);
      const end = parseTimeToMinutes(parts[parts.length - 1]);
      if (start !== null && end !== null && now >= start && now < end) return true;
    }
  }
  return false;
}

function infoWindowContent(loc: Location): string {
  const title = escapeHtml(loc.name);
  const address = escapeHtml(formatLocationAddress(loc));
  const time = loc.distributionTimeText ? escapeHtml(loc.distributionTimeText) : "";
  const openToday = isCurrentlyOpen(loc);
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

  const phoneRow = loc.phone
    ? `<a href="tel:${escapeHtml(loc.phone)}" style="display:flex;align-items:center;gap:6px;margin-bottom:8px;font-size:12px;color:#a4a4ad;text-decoration:none"><span>📞</span><span>${escapeHtml(loc.phone)}</span></a>`
    : "";

  const nameJson = JSON.stringify(loc.name).replaceAll('"', '&quot;');
  const communityNotesButton = `
    <button
      onclick="window.openCommunityNotes('${loc.id}',${nameJson})"
      style="display:flex;align-items:center;gap:10px;width:100%;padding:13px 4px;margin-top:4px;background:transparent;border:0;border-top:1px dashed rgba(236,236,239,0.15);color:#ececef;font-family:'Patrick Hand',system-ui,sans-serif;font-size:16px;cursor:pointer;text-align:left">
      <span>💬</span><span style="flex:1">Community notes</span><span style="font-size:13px">→</span>
    </button>`;

  return `
    <div style="min-width:260px;max-width:300px;padding:12px 14px 12px;background:#16161a;color:#ececef;font-family:'Patrick Hand',system-ui,sans-serif;position:relative">
      <button onclick="window.__closeInfoWindow()" style="position:absolute;top:14px;right:14px;background:none;border:none;cursor:pointer;color:#6b6b74;font-size:18px;line-height:1;padding:0;margin:0" aria-label="Close">✕</button>
      <div style="margin-bottom:10px;padding-right:24px">
        ${openBadge.replace(' style="', ' style="margin-bottom:0;')}
      </div>
      <div style="margin:0 0 4px;font-size:19px;line-height:1.2;color:#ececef;font-weight:600">${title}</div>
      <div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:6px;font-size:12px;color:#6b6b74;line-height:1.4">
        <span>📍</span><span>${address}</span>
      </div>
      ${phoneRow}
      ${timeRow}
      ${availRow}
      ${languages}
      ${scheduleDropdown}
      ${communityNotesButton}
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

// Neon palette for per-neighborhood hover tinting. Picked for high contrast
// against the dark map and against each other.
const NEON_PALETTE = [
  "#39ff14", // neon green
  "#ff073a", // neon red
  "#00f5ff", // neon cyan
  "#ff00ff", // magenta
  "#ffff00", // yellow
  "#ff6ec7", // hot pink
  "#9d00ff", // electric purple
  "#ff7f00", // neon orange
  "#00ff9f", // mint
  "#7df9ff", // electric blue
  "#ccff00", // chartreuse
  "#ff5e00", // safety orange
] as const;

// FNV-1a — small, dependency-free, stable across reloads so every
// neighborhood always gets the same color.
function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function neonColorFor(key: string): string {
  return NEON_PALETTE[hashString(key) % NEON_PALETTE.length];
}

// Ambient twinkle cadence — gentle "city is alive" feel without being chaotic.
const TWINKLE_INTERVAL_MS = 850;
const TWINKLE_DURATION_MS = 1200;

/**
 * Invisible by default. On hover, the hovered neighborhood reveals its own
 * deterministic neon color (dimmer than full neon so it sits comfortably on
 * the dark map). Also starts an ambient twinkle: every ~850ms a random
 * feature briefly glows in its neon color and fades back, like a skyline at
 * night. Returns a cleanup function that stops the twinkle on unmount.
 */
function addNeonNeighborhoodOverlay(
  layer: GoogleMapsDataLayer,
  geojsonUrl: string,
  nameKey: string = "nhood",
): () => void {
  layer.loadGeoJson(geojsonUrl);
  layer.setStyle({ strokeOpacity: 0, fillOpacity: 0 });
  layer.addListener("mouseover", (e) => {
    const name = String(e.feature.getProperty(nameKey) ?? "");
    const color = neonColorFor(name);
    layer.overrideStyle(e.feature, {
      strokeColor: color,
      strokeWeight: 2,
      strokeOpacity: 0.75,
      fillColor: color,
      fillOpacity: 0.1,
    });
  });
  layer.addListener("mouseout", () => {
    layer.revertStyle();
  });

  // Collect features as they finish loading so the twinkle has a pool to
  // draw from. The "addfeature" event fires once per polygon parsed.
  const features: GeoFeature[] = [];
  layer.addListener("addfeature", (e) => {
    features.push(e.feature);
  });

  // Respect prefers-reduced-motion — no ambient animation for those users.
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return () => {};

  const interval = window.setInterval(() => {
    if (features.length === 0) return;
    const feature = features[Math.floor(Math.random() * features.length)];
    const name = String(feature.getProperty(nameKey) ?? "");
    const color = neonColorFor(name);
    layer.overrideStyle(feature, {
      strokeColor: color,
      strokeWeight: 1.5,
      strokeOpacity: 0.55,
      fillColor: color,
      fillOpacity: 0.06,
    });
    window.setTimeout(() => {
      layer.revertStyle(feature);
    }, TWINKLE_DURATION_MS);
  }, TWINKLE_INTERVAL_MS);

  return () => window.clearInterval(interval);
}

type MarkerEntry = {
  marker: ReturnType<typeof window.google.maps.Marker["prototype"]["constructor"]> & {
    setMap: (map: object | null) => void;
  };
  openNow: boolean;
};

type Props = {
  locations: Location[];
  /** Where the map first centers. Map is shared — user can pan to either city. */
  initialCenter?: LatLng;
  /** Initial zoom level. LA needs a wider view (11) than SF (13). */
  initialZoom?: number;
};

export function GoogleMapView({
  locations,
  initialCenter = SAN_FRANCISCO,
  initialZoom = 13,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<ReturnType<typeof window.google.maps.Map["prototype"]["constructor"]> & {
    addListener: (event: string, cb: () => void) => void;
    data: GoogleMapsDataLayer;
  } | null>(null);
  const markersRef = useRef<MarkerEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterOpenOnly, setFilterOpenOnly] = useState(false);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError("Missing Google Maps API key.");
      return;
    }

    let cancelled = false;
    const overlayCleanups: Array<() => void> = [];

    const initializeMap = async () => {
      try {
        await loadGoogleMaps(GOOGLE_MAPS_API_KEY);

        if (cancelled || !mapRef.current || !window.google?.maps) return;

        const { Map, Marker, InfoWindow, Data } = window.google.maps;

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
          center: initialCenter,
          zoom: initialZoom,
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
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a1622" }] },
            { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#6b6b74" }] },
          ],
        });

        mapInstanceRef.current = map as typeof mapInstanceRef.current;

        // All seven regions use the same hover-only neon palette + ambient
        // twinkle. SF features are keyed on `nhood`; the rest use `name`.
        // (NJ shows counties since it's a state-wide view, not a single city.)
        // Cleanup functions stop the twinkle intervals on unmount.
        overlayCleanups.push(
          addNeonNeighborhoodOverlay(new Data({ map }), "/sf-neighborhoods.geojson"),
          addNeonNeighborhoodOverlay(new Data({ map }), "/la-neighborhoods.geojson", "name"),
          addNeonNeighborhoodOverlay(new Data({ map }), "/nyc-neighborhoods.geojson", "name"),
          addNeonNeighborhoodOverlay(new Data({ map }), "/seattle-neighborhoods.geojson", "name"),
          addNeonNeighborhoodOverlay(new Data({ map }), "/las-vegas-neighborhoods.geojson", "name"),
          addNeonNeighborhoodOverlay(new Data({ map }), "/houston-neighborhoods.geojson", "name"),
          addNeonNeighborhoodOverlay(new Data({ map }), "/new-jersey-counties.geojson", "name"),
        );

        let openWindow: InstanceType<typeof InfoWindow> | null = null;
        (window as Window & { __closeInfoWindow?: () => void }).__closeInfoWindow = () => {
          openWindow?.close();
          openWindow = null;
        };
        const mappableLocations = locations.filter(hasCoordinates);

        map.addListener("click", () => {
          openWindow?.close();
          openWindow = null;
        });

        const entries: MarkerEntry[] = [];
        for (const loc of mappableLocations) {
          const openNow = isCurrentlyOpen(loc);
          const palette = pinPalette(loc, openNow);
          const marker = new Marker({
            map,
            position: { lat: loc.lat, lng: loc.lng },
            title: loc.name,
            icon: {
              path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z",
              fillColor: palette.fill,
              fillOpacity: 1,
              strokeColor: palette.stroke,
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

          entries.push({ marker: marker as MarkerEntry["marker"], openNow });
        }
        markersRef.current = entries;
      } catch {
        if (!cancelled) {
          setError("Google Maps could not load. Check the API key and allowed referrers.");
        }
      }
    };

    void initializeMap();

    return () => {
      cancelled = true;
      overlayCleanups.forEach((stop) => stop());
    };
  }, [locations, initialCenter, initialZoom]);

  // Toggle marker visibility when filter changes — no map re-init needed.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    for (const { marker, openNow } of markersRef.current) {
      marker.setMap(filterOpenOnly && !openNow ? null : map);
    }
  }, [filterOpenOnly]);

  return (
    <section className={styles.page}>
      <div ref={mapRef} className={styles.map} />
      <div className={styles.filterBar}>
        <label className={styles.filterLabel}>
          <input
            type="checkbox"
            checked={filterOpenOnly}
            onChange={(e) => setFilterOpenOnly(e.target.checked)}
          />
          Open now
        </label>
      </div>
      {error ? <div className={styles.error}>{error}</div> : null}
    </section>
  );
}

function hasCoordinates(loc: Location): loc is Location & { lat: number; lng: number } {
  return typeof loc.lat === "number" && typeof loc.lng === "number";
}
