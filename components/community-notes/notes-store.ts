"use client";

import { useEffect, useSyncExternalStore } from "react";

export type Note = {
  id: string;
  locationId: string;
  text: string;
  helpful: number;
  createdAt: number; // epoch ms
  helpfulByMe?: boolean; // persisted in localStorage so device can't double-vote
  justPosted?: boolean; // local-only: pin to top until data refreshes
};

type Listener = () => void;

const cache = new Map<string, Note[]>();
const listeners = new Map<string, Set<Listener>>();

function notify(locationId: string) {
  listeners.get(locationId)?.forEach((l) => l());
}

function read(locationId: string): Note[] {
  return cache.get(locationId) ?? [];
}

function write(locationId: string, notes: Note[]) {
  cache.set(locationId, notes);
  notify(locationId);
}

function helpfulKey(id: string) {
  return `ffd-helpful:${id}`;
}

function hadVoted(id: string): boolean {
  if (typeof localStorage === "undefined") return false;
  return !!localStorage.getItem(helpfulKey(id));
}

interface ApiComment {
  id: string;
  location_id: string;
  comment_text: string;
  helpful_count: number;
  created_at: string;
}

function toNote(c: ApiComment): Note {
  return {
    id: c.id,
    locationId: c.location_id,
    text: c.comment_text,
    helpful: c.helpful_count,
    createdAt: new Date(c.created_at).getTime(),
    helpfulByMe: hadVoted(c.id),
  };
}

async function fetchAndCache(locationId: string) {
  try {
    const res = await fetch(`/api/comments?locationId=${encodeURIComponent(locationId)}`);
    if (!res.ok) return;
    const { comments } = (await res.json()) as { comments: ApiComment[] };
    write(locationId, comments.map(toNote));
  } catch {
    /* network error — keep whatever is cached */
  }
}

export const notesStore = {
  list(locationId: string): Note[] {
    return read(locationId);
  },

  subscribe(locationId: string, listener: Listener): () => void {
    if (!listeners.has(locationId)) listeners.set(locationId, new Set());
    listeners.get(locationId)!.add(listener);
    return () => listeners.get(locationId)!.delete(listener);
  },

  add(locationId: string, text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const optimistic: Note = {
      id: crypto.randomUUID(),
      locationId,
      text: trimmed,
      helpful: 0,
      createdAt: Date.now(),
      helpfulByMe: false,
      justPosted: true,
    };
    write(locationId, [optimistic, ...read(locationId)]);

    fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location_id: locationId,
        comment_text: trimmed,
        _honeypot: "",
      }),
    })
      .then((r) => r.json())
      .then(({ comment }: { comment?: ApiComment }) => {
        if (comment) {
          write(
            locationId,
            read(locationId).map((n) =>
              n.id === optimistic.id ? { ...toNote(comment), justPosted: true } : n
            )
          );
        }
      })
      .catch(() => {
        // Remove optimistic note on failure
        write(
          locationId,
          read(locationId).filter((n) => n.id !== optimistic.id)
        );
      });
  },

  toggleHelpful(locationId: string, id: string) {
    const notes = read(locationId);
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    const wasLiked = !!note.helpfulByMe;

    // Optimistic UI update
    write(
      locationId,
      notes.map((n) =>
        n.id === id
          ? { ...n, helpfulByMe: !wasLiked, helpful: n.helpful + (wasLiked ? -1 : 1) }
          : n
      )
    );

    if (wasLiked) {
      // Un-like: only local (server only increments, no decrement endpoint)
      localStorage.removeItem(helpfulKey(id));
    } else {
      // Like: persist vote + call server
      localStorage.setItem(helpfulKey(id), "1");
      fetch(`/api/comments/${id}/helpful`, { method: "POST" }).catch(() => {
        // Revert on failure
        localStorage.removeItem(helpfulKey(id));
        write(locationId, notes);
      });
    }
  },
};

/** Sort: most-helpful first; your just-posted note pins to the top. */
export function orderedNotes(notes: Note[]): Note[] {
  const pinned = notes
    .filter((n) => n.justPosted)
    .sort((a, b) => b.createdAt - a.createdAt);
  const rest = notes
    .filter((n) => !n.justPosted)
    .sort((a, b) => b.helpful - a.helpful || b.createdAt - a.createdAt);
  return [...pinned, ...rest];
}

/** "just now" · "5m ago" · "2h ago" · "3 days ago" */
export function timeAgo(ts: number): string {
  const s = (Date.now() - ts) / 1000;
  if (s < 50) return "just now";
  const m = s / 60;
  if (m < 60) return `${Math.max(1, Math.floor(m))}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  const d = h / 24;
  if (d < 7) return `${Math.floor(d)} ${Math.floor(d) === 1 ? "day" : "days"} ago`;
  const w = Math.floor(d / 7);
  return `${w} ${w === 1 ? "week" : "weeks"} ago`;
}

/** React hook — fetches on mount, re-renders whenever notes change. */
export function useNotes(locationId: string): Note[] {
  const notes = useSyncExternalStore(
    (cb) => notesStore.subscribe(locationId, cb),
    () => notesStore.list(locationId),
    () => [] as Note[]
  );

  useEffect(() => {
    void fetchAndCache(locationId);
  }, [locationId]);

  return notes;
}
