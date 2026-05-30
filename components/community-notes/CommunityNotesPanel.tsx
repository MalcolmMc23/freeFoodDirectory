"use client";

import { useEffect, useState } from "react";
import { CommunityNotes } from "./CommunityNotes";

type PanelState = { locationId: string; name: string } | null;

// Module-level pub/sub so a plain global (callable from the InfoWindow's
// inline onclick HTML string) can drive a React component.
let current: PanelState = null;
const subs = new Set<(s: PanelState) => void>();
function set(state: PanelState) {
  current = state;
  subs.forEach((f) => f(state));
}

export function openCommunityNotes(locationId: string, name: string) {
  set({ locationId, name });
}
export function closeCommunityNotes() {
  set(null);
}

export function CommunityNotesHost() {
  const [state, setState] = useState<PanelState>(current);

  useEffect(() => {
    subs.add(setState);
    (
      window as unknown as { openCommunityNotes?: typeof openCommunityNotes }
    ).openCommunityNotes = openCommunityNotes;
    return () => {
      subs.delete(setState);
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCommunityNotes();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state]);

  const open = !!state;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCommunityNotes}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.22s ease",
          zIndex: 1000,
        }}
      />

      {/* Slide-over panel */}
      <aside
        role="dialog"
        aria-label="Community notes"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(360px, 100vw)",
          background: "var(--panel)",
          borderLeft: "1.5px dashed var(--stroke)",
          boxShadow: "-18px 0 48px rgba(0,0,0,0.5)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(.2,.7,.3,1)",
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {state && (
          <>
            <header
              style={{
                flexShrink: 0,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
                padding: "16px 16px 12px",
                borderBottom: "1px dashed var(--stroke)",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    letterSpacing: 1.2,
                    color: "var(--ink-mute)",
                  }}
                >
                  NOTES FOR
                </div>
                <div
                  style={{
                    fontFamily: "var(--hand)",
                    fontSize: 18,
                    lineHeight: 1.15,
                    color: "var(--ink)",
                  }}
                >
                  {state.name}
                </div>
              </div>
              <button
                type="button"
                onClick={closeCommunityNotes}
                aria-label="Close community notes"
                style={{
                  background: "transparent",
                  border: 0,
                  color: "var(--ink-mute)",
                  fontFamily: "var(--mono)",
                  fontSize: 18,
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: 2,
                }}
              >
                ✕
              </button>
            </header>

            <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 14 }}>
              <CommunityNotes locationId={state.locationId} />
            </div>
          </>
        )}
      </aside>
    </>
  );
}
