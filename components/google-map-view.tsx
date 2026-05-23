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

function infoWindowContent(loc: Location): string {
  const title = escapeHtml(loc.name);
  const address = escapeHtml(formatLocationAddress(loc));
  const category = loc.category ? escapeHtml(formatCategory(loc.category)) : "";
  const day = loc.distributionDay ? escapeHtml(loc.distributionDay) : "";
  const time = loc.distributionTimeText ? escapeHtml(loc.distributionTimeText) : "";
  const availability = loc.availabilityStatus ? escapeHtml(loc.availabilityStatus) : "";
  const enrollmentFrequency = loc.enrollmentFrequency ? escapeHtml(loc.enrollmentFrequency) : "";
  const enrollmentTime = loc.enrollmentTimeText ? escapeHtml(loc.enrollmentTimeText) : "";
  const languages = loc.additionalLanguages.length ? escapeHtml(loc.additionalLanguages.join(", ")) : "";
  const serviceArea = loc.zipCodesServed.length ? escapeHtml(loc.zipCodesServed.join(", ")) : "";
  const nextDistribution = loc.nextDistributionDates.length
    ? loc.nextDistributionDates
        .map((date) => `<div style="margin:0 0 3px">${escapeHtml(date)}</div>`)
        .join("")
    : "";
  const detailItems = loc.additionalInfo;
  const directionsUrl = googleMapsDirectionsUrl(loc);
  const siteUrl = loc.siteUrl ?? loc.sourceUrl;

  const details = detailItems.length
    ? `
      <div style="margin-top:12px">
        <div style="margin:0 0 6px;color:#6b6b74;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:500;letter-spacing:1px;text-transform:uppercase">
          Notes
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${detailItems
            .map(
              (item) => `
                <div style="padding:8px 10px;border:1.5px dashed rgba(236,236,239,0.22);border-radius:6px;background:#1c1c22;color:#a4a4ad;font-family:'Patrick Hand',sans-serif;font-size:13px;line-height:1.4">
                  ${escapeHtml(item)}
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
    `
    : "";

  const rows = [
    infoRow("Day", day),
    infoRow("Next", nextDistribution),
    infoRow("Time", time),
    infoRow("Status", availability),
    infoRow("Enroll", enrollmentFrequency),
    infoRow("Enroll Time", enrollmentTime),
    infoRow("Languages", languages),
    infoRow("Serves", serviceArea),
  ]
    .filter(Boolean)
    .join("");

  return `
    <div style="min-width:280px;max-width:320px;padding:14px;background:#16161a;color:#ececef;font-family:'Patrick Hand',system-ui,sans-serif">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px">
        <div style="flex:1">
          <div style="margin:0 0 4px;font-family:'Patrick Hand',sans-serif;font-size:20px;font-weight:400;line-height:1.15;color:#ececef">
            ${title}
          </div>
          <div style="margin:0;font-family:'JetBrains Mono',monospace;font-size:11px;color:#6b6b74;line-height:1.3">
            ${address}
          </div>
        </div>
        ${
          category
            ? `
              <div style="flex-shrink:0;padding:3px 8px;border-radius:4px;background:transparent;border:1px solid rgba(236,236,239,0.22);color:#a4a4ad;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:500;letter-spacing:1px;text-transform:uppercase">
                ${category}
              </div>
            `
            : ""
        }
      </div>

      ${
        loc.outsideZipCode
          ? `
            <div style="margin-bottom:10px;padding:8px 10px;border-radius:6px;background:#1c1c22;border:1.5px dashed rgba(236,236,239,0.22);color:#6b6b74;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:500;letter-spacing:1px;text-transform:uppercase">
              Outside your zip code
            </div>
          `
          : ""
      }

      <div style="display:flex;flex-direction:column;gap:0;margin-top:4px">
        ${rows}

        <div style="display:grid;grid-template-columns:80px 1fr;gap:8px;padding-top:10px;border-top:1px dashed rgba(236,236,239,0.22);margin-top:4px">
          <div style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:1px;color:#6b6b74;padding-top:2px">
            Actions
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            <a
              href="${directionsUrl}"
              target="_blank"
              rel="noopener noreferrer"
              style="display:inline-flex;align-items:center;padding:8px 12px;border-radius:6px;background:#f3a64a;border:1.5px solid #f3a64a;color:#1a1208;text-decoration:none;font-family:'Patrick Hand',sans-serif;font-size:14px;font-weight:400"
            >
              Directions →
            </a>
            ${
              siteUrl
                ? `
                  <a
                    href="${escapeHtml(siteUrl)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="display:inline-flex;align-items:center;padding:8px 12px;border-radius:6px;background:transparent;border:1.5px dashed rgba(236,236,239,0.22);color:#a4a4ad;text-decoration:none;font-family:'Patrick Hand',sans-serif;font-size:14px;font-weight:400"
                  >
                    Website ↗
                  </a>
                `
                : ""
            }
          </div>
        </div>
      </div>

      ${details}
    </div>
  `;
}

function infoRow(label: string, value: string): string {
  if (!value) return "";

  return `
    <div style="display:grid;grid-template-columns:80px 1fr;gap:8px;padding-top:10px;border-top:1px dashed rgba(236,236,239,0.22);margin-top:4px">
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:1px;color:#6b6b74;padding-top:3px">
        ${escapeHtml(label)}
      </div>
      <div style="font-family:'Patrick Hand',sans-serif;font-size:14px;line-height:1.4;color:#ececef">
        ${value}
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

function formatCategory(category: string): string {
  return category
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function splitDescription(description: string | null): string[] {
  if (!description) return [];

  return description
    .split(/(?:\.\s+)|(?:•)|(?:;\s+)/)
    .map((item) => item.trim())
    .filter(Boolean);
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
          const marker = new Marker({
            map,
            position: { lat: loc.lat, lng: loc.lng },
            title: loc.name,
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
