"use client";

import { useState, type CSSProperties } from "react";
import { notesStore, useNotes, orderedNotes, timeAgo, type Note } from "./notes-store";

export function CommunityNotes({ locationId }: { locationId: string }) {
  const notes = useNotes(locationId);
  const ordered = orderedNotes(notes);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", color: "var(--ink)" }}>
      <div style={{ flexShrink: 0, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontFamily: "var(--hand)", fontSize: 22, fontWeight: 400, lineHeight: 1.1 }}>
            Community notes
          </h2>
          <span style={eyebrow}>↓ TOP LIKED</span>
        </div>
        <span style={{ ...eyebrow, display: "block", marginTop: 3 }}>
          COMMUNITY NOTES · {notes.length}
        </span>
      </div>

      {ordered.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {ordered.map((n) => (
            <NoteCard key={n.id} note={n} locationId={locationId} />
          ))}
        </div>
      )}

      <div style={{ marginTop: "auto", flexShrink: 0 }}>
        <Composer locationId={locationId} />
      </div>
    </div>
  );
}

function NoteCard({ note, locationId }: { note: Note; locationId: string }) {
  const mine = note.justPosted;
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 6,
        border: mine ? "1.5px solid var(--accent)" : "1.5px dashed var(--stroke)",
        background: mine ? "rgba(243,166,74,0.06)" : "var(--panel-2)",
      }}
    >
      {mine && (
        <div style={{ ...eyebrow, color: "var(--accent)", marginBottom: 4 }}>✓ YOUR NOTE</div>
      )}
      <div style={{ fontFamily: "var(--hand)", fontSize: 16, lineHeight: 1.35, color: "var(--ink)" }}>
        {note.text}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
        <HelpfulButton note={note} locationId={locationId} />
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-mute)" }}>
          {timeAgo(note.createdAt)}
        </span>
      </div>
    </div>
  );
}

function HelpfulButton({ note, locationId }: { note: Note; locationId: string }) {
  const liked = !!note.helpfulByMe;
  return (
    <button
      type="button"
      onClick={() => notesStore.toggleHelpful(locationId, note.id)}
      aria-pressed={liked}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "transparent",
        border: 0,
        padding: "5px 2px",
        minHeight: 32,
        cursor: "pointer",
        fontFamily: "var(--mono)",
        fontSize: 12,
        color: liked ? "var(--accent)" : "var(--ink-dim)",
      }}
    >
      <span style={{ fontSize: 14, filter: liked ? "none" : "grayscale(0.35)", opacity: liked ? 1 : 0.85 }}>
        👍
      </span>
      <span>{note.helpful}</span>
      <span style={{ fontFamily: "var(--hand)", fontSize: 13 }}>helpful</span>
    </button>
  );
}

function Composer({ locationId }: { locationId: string }) {
  const [value, setValue] = useState("");
  const post = () => {
    if (!value.trim()) return;
    notesStore.add(locationId, value);
    setValue("");
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 14,
        borderRadius: 6,
        border: "1.5px dashed var(--stroke)",
        background: "var(--panel)",
      }}
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") post();
        }}
        placeholder="Leave a note for the next person who comes here…"
        rows={2}
        style={{
          width: "100%",
          resize: "none",
          border: 0,
          outline: "none",
          background: "transparent",
          color: "var(--ink)",
          fontFamily: "var(--hand)",
          fontSize: 16,
          lineHeight: 1.4,
          minHeight: 46,
          padding: 0,
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <span style={{ ...eyebrow, letterSpacing: 0.5 }}>NO NAME · NO LOGIN · ANONYMOUS</span>
        <button
          type="button"
          onClick={post}
          disabled={!value.trim()}
          style={{
            padding: "10px 18px",
            borderRadius: 6,
            border: "1.5px solid var(--accent)",
            background: "var(--accent)",
            color: "var(--accent-ink)",
            fontFamily: "var(--hand)",
            fontSize: 16,
            fontWeight: 700,
            cursor: value.trim() ? "pointer" : "default",
            opacity: value.trim() ? 1 : 0.4,
          }}
        >
          Post note
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        padding: "28px 18px",
        borderRadius: 6,
        border: "1.5px dashed var(--stroke)",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginBottom: 14,
      }}
    >
      <div style={eyebrow}>NO NOTES YET</div>
      <div style={{ fontFamily: "var(--hand)", fontSize: 18, lineHeight: 1.35 }}>
        Be the first to leave a note for the next person who stops by.
      </div>
      <div style={{ fontFamily: "var(--hand)", fontSize: 14, lineHeight: 1.4, color: "var(--ink-dim)" }}>
        What did you find? Was it stocked? Anything helpful to know.
      </div>
    </div>
  );
}

const eyebrow: CSSProperties = {
  fontFamily: "var(--mono)",
  fontSize: 10,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  color: "var(--ink-mute)",
};
