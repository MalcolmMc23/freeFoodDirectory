"use client";

import { useEffect, useRef, useState } from "react";
import type { Location } from "../lib/types";
import styles from "./google-map-view.module.css";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const SAN_FRANCISCO = { lat: 37.7749, lng: -122.4194 };

declare global {
  interface Window {
    __googleMapsInit?: () => void;
    __googleMapsLoader?: Promise<void>;
    google: {
      maps: {
        Map: new (el: HTMLElement, opts: object) => object;
        Marker: new (opts: { map: object; position: { lat: number; lng: number }; title?: string }) => {
          addListener: (event: string, cb: () => void) => void;
        };
        InfoWindow: new (opts: { content: string }) => {
          open: (opts: { anchor: object; map: object }) => void;
          close: () => void;
        };
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
  const address = escapeHtml(loc.address);
  const category = escapeHtml(formatCategory(loc.category));
  const hours = loc.hours ? escapeHtml(loc.hours) : "";
  const detailItems = splitDescription(loc.description);
  const directionsUrl = googleMapsDirectionsUrl(loc);
  const details = detailItems.length
    ? `
      <div style="margin-top:16px">
        <div style="margin:0 0 8px;color:#7b8790;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase">
          Notes
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${detailItems
            .map(
              (item) => `
                <div style="padding:10px 12px;border:1px solid #e5ddd0;border-radius:12px;background:#faf6ed;color:#3f3a31;font-size:13px;line-height:1.45">
                  ${escapeHtml(item)}
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
    `
    : "";

  return `
    <div style="min-width:280px;max-width:320px;padding:8px 6px 6px;color:#2c2a26;font-family:Arial,Helvetica,sans-serif">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px">
        <div>
          <div style="margin:0 0 6px;font-size:20px;line-height:1.15;font-weight:700;color:#3f3525">
            ${title}
          </div>
          <div style="margin:0;color:#6f7277;font-size:13px;line-height:1.45">
            ${address}
          </div>
        </div>
        <div style="flex-shrink:0;padding:6px 10px;border-radius:999px;background:#eef4ea;color:#4f8e43;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">
          ${category}
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px">
        ${
          hours
            ? `
              <div style="display:grid;grid-template-columns:92px 1fr;gap:8px;padding-top:10px;border-top:1px solid #ece7dd">
                <div style="color:#4e4a41;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">
                  Hours
                </div>
                <div style="color:#2f2c28;font-size:14px;line-height:1.45;font-weight:600">
                  ${hours}
                </div>
              </div>
            `
            : ""
        }

        <div style="display:grid;grid-template-columns:92px 1fr;gap:8px;padding-top:${hours ? "0" : "10px"};border-top:${hours ? "none" : "1px solid #ece7dd"}">
          <div style="color:#4e4a41;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">
            Address
          </div>
          <div>
            <a
              href="${directionsUrl}"
              target="_blank"
              rel="noopener noreferrer"
              style="display:inline-flex;align-items:center;padding:9px 12px;border-radius:10px;background:#3f3525;color:#fffaf1;text-decoration:none;font-size:13px;font-weight:700"
            >
              Open directions
            </a>
          </div>
        </div>
      </div>

      ${details}
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
  const query = encodeURIComponent(`${loc.name}, ${loc.address}`);
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
            { elementType: "geometry", stylers: [{ color: "#172026" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#9eb0ba" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#172026" }] },
            { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#31414a" }] },
            { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
            { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#1d272d" }] },
            { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#1a252b" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#24333b" }] },
            { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a252c" }] },
            { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#7f939e" }] },
            { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#2a3b44" }] },
            { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#35515d" }] },
            { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#203039" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1419" }] },
            { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#6d8793" }] },
          ],
        });

        let openWindow: InstanceType<typeof InfoWindow> | null = null;

        for (const loc of locations) {
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
