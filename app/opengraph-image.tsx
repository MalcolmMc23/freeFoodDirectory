import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Free Food Maps — find free food in San Francisco";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f0f0f",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#f59e0b",
            marginBottom: 24,
          }}
        >
          San Francisco
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.1,
            marginBottom: 32,
          }}
        >
          Free Food Maps
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#94a3b8",
            maxWidth: 700,
            lineHeight: 1.5,
          }}
        >
          Find free food near you. Food banks, pantries, and meals across San Francisco.
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 80,
            right: 80,
            fontSize: 18,
            color: "#475569",
          }}
        >
          freefoodmaps.com
        </div>
      </div>
    ),
    { ...size },
  );
}
