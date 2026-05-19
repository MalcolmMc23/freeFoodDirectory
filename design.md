# Design Brief — Free Food Directory

A reference for building the Free Food Directory website. Based on **V1 Classic Sidebar** as the chosen direction. Dark, modern, minimal, with a warm and reassuring tone.

> **Core principle:** every visual choice should communicate *"you belong here, no shame, no questions."* If a pattern feels bureaucratic, cold, or transactional — reject it.

---

## 1. Voice & Tone

| Use | Don't use |
|---|---|
| "You're welcome here." | "Eligible recipients" |
| "No ID, no questions." | "Identification not required" |
| "Take what you need." | "Limited to one per household" |
| "Walk in." | "Intake process" |
| "Verified 2 days ago" | "Last updated 2024-05-14T18:00Z" |

**Rules**
1. Write to a person, not a population. Always second person ("you").
2. Plain English, ~8th grade reading level. No social-services jargon.
3. Lead with what someone can *do right now*, not policies.
4. Never imply the user must prove or justify their need.
5. Numbers in monospace, prose in handwritten — it visually separates *facts* from *warmth*.

---

## 2. Color

All values are exact. Dark-only — no light mode.

### Surface
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0e0e10` | Page background |
| `--panel` | `#16161a` | Cards, callouts, sheet overlays |
| `--panel-2` | `#1c1c22` | Nested surfaces, hover states |

### Ink (text)
| Token | Hex | Use |
|---|---|---|
| `--ink` | `#ececef` | Primary text, headings |
| `--ink-dim` | `#a4a4ad` | Secondary text, descriptions |
| `--ink-mute` | `#6b6b74` | Tertiary, metadata, timestamps |

### Strokes / dividers
| Token | Value | Use |
|---|---|---|
| `--stroke` | `rgba(236, 236, 239, 0.22)` | Default card outlines, dividers |
| `--stroke-strong` | `rgba(236, 236, 239, 0.55)` | Active/emphasized outlines |

### Accent
| Token | Hex | Use |
|---|---|---|
| `--accent` | `#f3a64a` | Warm amber. **Trust + primary CTA only.** Never decorative. |
| `--accent-ink` | `#1a1208` | Text on amber surfaces |

### Status
| Token | Hex | Use |
|---|---|---|
| `--open` | `#6fc78a` | "Open now" indicators |
| `--closed` | `#e07676` | "Closed" indicators |
| `--info` | `#7fb6e6` | Neutral info badges (sparingly) |

### Color rules
- **Amber is sacred.** It marks (a) verification badges, (b) the active selection, (c) the primary CTA. Don't use it for headings, links, or decoration.
- Status colors only appear in badges, pin dots, or one-word labels — never as background fills bigger than a badge.
- Never use pure white (`#fff`) or pure black (`#000`). All neutrals are tinted toward warm gray.
- No gradients anywhere.

---

## 3. Typography

Three fonts, each with a single job.

```html
<link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
```

| Family | Role | Why |
|---|---|---|
| **Patrick Hand** | All headings, body, labels, button text | Warmth. Reads as *a person wrote this*, not a corporation. |
| **JetBrains Mono** | Numbers, addresses, timestamps, badges, metadata | Precision. Signals "verified data." |
| **Inter** | Reserve only for dense UI chrome if Patrick Hand fails (admin tools, dashboards) | Fallback only — never on user-facing copy. |

### Scale (px)

| Use | Size | Family | Weight | Line height |
|---|---|---|---|---|
| Display (rare, e.g. hero) | 40 | Patrick Hand | 400 | 1.05 |
| H1 (detail page name) | 32 | Patrick Hand | 400 | 1.05 |
| H2 (section heads) | 22 | Patrick Hand | 400 | 1.2 |
| H3 (card name) | 22 | Patrick Hand | 400 | 1.2 |
| Body | 16 | Patrick Hand | 400 | 1.4 |
| Body small / description | 14 | Patrick Hand | 400 | 1.4 |
| Metadata (distance, phone, hours) | 11–12 | JetBrains Mono | 400 | 1.3 |
| Badge / eyebrow label | 10–11 | JetBrains Mono | 500, `text-transform: uppercase`, `letter-spacing: 1–1.5px` | 1 |
| Verify timestamp | 10–11 | JetBrains Mono | 400, amber | 1 |

### Type rules
1. Don't bold Patrick Hand — it's already loose. Emphasis = scale or color.
2. Mono labels always uppercase with `letter-spacing: 1px+`.
3. Mix in a single line: Patrick Hand for the noun, mono for the number.
   *"Glide Daily Free Meals · `0.4 mi`"*
4. Never use Patrick Hand below 13px (loses legibility). Switch to mono.

---

## 4. Spacing & Radius

### Spacing scale (px)
`4 · 8 · 12 · 16 · 20 · 24 · 32 · 48`

Default gaps:
- Inside a card: **14px** padding, **6px** gap between rows
- Between cards in a list: **12px**
- Section padding (sidebar): **20px** top, **16px** sides
- Page padding: **24–32px**

### Border radius
- Cards, buttons, inputs: **6px**
- Sheets, modals: **8–10px**
- Pins: 50% + tail
- Never use radii > 12px. No fully-rounded "pill" elements except the map pin.

### Borders
- All card outlines: **1.5px**
- Default = `dashed` + `var(--stroke)` (placeholder feel preserved even in production — it's part of the brand)
- Active/selected = `solid` + `var(--accent)`
- Dividers between list items = `1px dashed var(--stroke)`

---

## 5. Components

### 5.1 Location Card (the centerpiece)

The single most important component. V1 list rail = a vertical stack of these.

**Anatomy** (top to bottom):
1. **Header row** — `[mono # 01] [Name (h3)]` on the left, `[mono distance]` on the right.
2. **Meta row** — `[Type] · [● open/○ closed] · [hours]` in mono, 11px, dim ink.
3. **Reassurance line** — Patrick Hand, 14px, dim. *"No ID. No questions. Anyone welcome."*
4. **Footer row** — `[✓ Verified 2 days ago]` (amber mono) on left, `[tap for details →]` (muted mono) on right.

**States**
- Default: dashed stroke, transparent bg.
- Hover: `background: rgba(243, 166, 74, 0.03)`.
- Active/selected: **solid** amber stroke + `background: rgba(243, 166, 74, 0.05)`.
- Closed location: dim the name to `--ink-dim`. Don't hide it.

**Required fields** (in order of importance, all must be visible without expanding):
1. Name
2. Type (Meal Program / Pantry / Free Fridge)
3. Status (open / closed) — color-coded
4. Hours / "open 'til X" or "next: Tue 9a"
5. Distance
6. Requirements (in plain language — "No ID needed.")
7. Last verified date

### 5.2 Badge

```
[ ● open ]    [ ○ closed ]    [ ✓ Verified 2 days ago ]    [ Meal Program ]
```

- Mono, 10–11px, uppercase, 0.5px letter-spacing
- Padding: `3px 8px`
- Border-radius: 4px
- Open: green text + 6% green bg tint + 35% green border
- Closed: red text + 6% red bg tint + 35% red border
- Verified: amber text + 6% amber bg tint + 35% amber border
- Flat (type/category): dim ink + panel bg + default stroke

### 5.3 Button

```
.btn.primary    → amber bg, dark text, solid border, 700 weight
.btn            → transparent bg, ink text, solid stroke border
.btn.ghost      → transparent bg, ink text, dashed stroke border
```

- Padding: `10px 16px`
- Radius: 6px
- Font: Patrick Hand 16px
- One `.primary` per screen. Two `.primary` competes — collapse one to `.btn`.

### 5.4 Map Pin

- 22 × 22px circle with a tail (transform: rotate(-45deg) on `border-radius: 50% 50% 50% 0`)
- Stack: panel bg + stroke border + colored center dot (8px)
- Center dot color = status (green/red/dim)
- Active pin: amber fill on the body, dark dot
- Optional `[01]` mono number above the pin for list↔map cross-reference

### 5.5 Sketchy Map background

The map should *look* like a hand-traced map, not a photo of a city.

- Bg: radial-gradient warm spotlight in center, fading to `--bg`
- Faint 60px grid lines at 4% opacity
- Bay: dashed teal-blue path, 18% fill alpha
- Golden Gate Park: dashed green blob, 7% fill alpha
- Major roads: wobbly white paths at 10% opacity, 1.2px stroke
- Market Street: dashed amber line — your brand-color thread through the city
- Neighborhood labels: Patrick Hand, uppercase, 18px, in `--ink-mute`, scattered loosely

This is **not** a Google Maps embed. It's a stylized illustration. If you need real geocoding, layer pins on top of a heavily-darkened, low-contrast tile set (Mapbox dark theme with most labels turned off + a custom amber accent for selected roads), but the *visual goal* is the sketch above.

### 5.6 Squiggle divider

A horizontal squiggle (SVG `M0 3 Q5 0,10 3 T20 3...`) at 70% opacity, used to separate the sidebar header from the scrolling list. One per surface, max.

---

## 6. Layout — V1 Classic (the chosen direction)

```
┌────────────────────┬──────────────────────────────────────┐
│  420px sidebar     │            map (fills rest)          │
│  ┌──────────────┐  │                                      │
│  │ Free Food·SF │  │     ●                                │
│  │ "Hi. You're  │  │            ●                         │
│  │  welcome…"   │  │       ★ (active = amber)             │
│  │ ● Open now   │  │                                      │
│  │ ~~~~~~~~~~~~~│  │                ●                     │
│  │              │  │                                      │
│  │ [Location 01]│  │                          [you·here]  │
│  │ [Location 02]│  │                                      │
│  │ [Location 03]│  │                                      │
│  │ … scrollable │  │                                      │
│  └──────────────┘  │                                      │
└────────────────────┴──────────────────────────────────────┘
```

### Sidebar (420px fixed)
- Header section: 20px top, 12px bottom padding
- Title: Patrick Hand 22px, "Free Food · SF"
- Subtitle: Patrick Hand 14px, dim ink — the warm reassuring line
- Status pills row: `[● Open now]` `[Sort: nearest]` — small, 8px gap
- Squiggle divider
- Scrolling list: 16px padding, 12px gap between cards

### Map area
- 16px padding around the sketchy map container
- "You are here" floating chip: top-right, 32px from edges, panel bg, mono 11px
- Pins drawn over the map per the data
- Selected pin = amber

### Responsive
- ≥1100px: layout as above.
- 700–1099px: sidebar shrinks to 360px.
- <700px: stack — map on top (60vh), list below as a scrollable sheet. Hide "you are here" chip. Add a "[Show map] [Show list]" toggle at the very top.

---

## 7. Trust UI — *the most important non-obvious detail*

A directory like this lives or dies on whether the data is trustworthy. Make verification *visible on every surface*.

### Where verification appears
1. **On every list card** (mono amber, 10px) — `✓ Verified 2 days ago`
2. **On every map pin tooltip** — same line
3. **On the detail page**: a full banner up top — `✓ VERIFIED 2 DAYS AGO BY VOLUNTEER · M. TRAN` with a `⚑ Report a change` link on the right.
4. **A staleness rule**: anything not re-verified in 14+ days gets a `⚠ may be outdated` warning badge (dim, not red — we don't want to discourage trying).

### Report-a-change
Always present, always one tap away. Three reasons we accept without friction:
- "It was closed when I went"
- "The hours are different"
- "They moved / don't exist anymore"

No login required to report. Just a comment box and an optional name.

---

## 8. Iconography

We don't use icons. We use:
- **Punctuation as ornament**: `·` for separators, `→` for "go", `↗` for external, `←` for back
- **Geometric symbols**: `●` open · `○` closed · `✓` verified · `⚑` report · `⛶` expand · `♿` accessibility · `⇪` share · `📍` location · `📞` phone · `⌄` collapse
- **Numbers as identifiers**: every location has a 2-digit mono number (`01`, `02`...) shown both on the pin and the card. Lets users cross-reference quickly.

If you need a real icon (rare), use Lucide at 16px stroke=1.5 in `--ink-dim`. Never colorful.

---

## 9. Imagery

- **Default: no photos.** The brand visual is type + the sketchy map. Photos of food or people risk feeling like a charity brochure.
- **When photos are needed** (e.g. exterior photo of a pantry on detail page): use a 4:3 aspect ratio, slight desaturation (`filter: saturate(0.85)`), no rounded corners beyond the 6px standard.
- **Placeholder**: a diagonal-striped panel labeled `EXTERIOR PHOTO — DROP HERE` in mono. Keep this in production for unfilled records — better than a missing-image gray box.

---

## 10. Motion

Minimal. The UI should feel sturdy, not playful.

- Hover transitions: 120ms, `ease-out`
- Selection change: 180ms, `cubic-bezier(.2, .7, .3, 1)`
- Map pan/zoom: native map provider defaults — don't customize
- **No** entrance animations on lists. People are looking for food, not a show.

---

## 11. Accessibility

This is critical given the audience.

- All text minimum **14px** body. Verify ratios meet WCAG AA on the dark bg:
  - `--ink` on `--bg` = 13.8:1 ✓
  - `--ink-dim` on `--bg` = 6.6:1 ✓
  - `--ink-mute` on `--bg` = 3.4:1 — use **only for non-essential metadata**, never for primary info.
  - `--accent` on `--bg` = 8.2:1 ✓
- Open/closed status must **never** rely on color alone. Always include the `●` / `○` glyph and the word.
- Tap targets: 44px minimum on mobile. List card hit area = the entire card.
- Full keyboard nav: tab through list, enter to open detail, esc to close.
- `prefers-reduced-motion`: kill all transitions.
- Multilingual: site copy in EN / ES / 中文 minimum at launch. Language toggle in the footer (not the header — header is for action, not chrome).

---

## 12. Don't Do This

A short list of patterns that would break the brand:

- ❌ Gradient backgrounds or buttons
- ❌ Pill-shaped buttons (radius > 12px)
- ❌ Drop shadows on cards in the list (only on floating overlays / sheets)
- ❌ "Get started" / "Sign up" CTAs — there is no funnel, only a directory
- ❌ Stock photography of food or smiling people
- ❌ Emojis used decoratively (the glyphs we use *are* the icons, no extras)
- ❌ "Eligibility" language anywhere in the UI
- ❌ Dense forms — if you need 5+ fields, you're doing it wrong
- ❌ Marketing copy ("Trusted by 10,000+ users")
- ❌ A light mode

---

## 13. CSS variables (copy/paste starter)

```css
:root {
  /* Surface */
  --bg: #0e0e10;
  --panel: #16161a;
  --panel-2: #1c1c22;

  /* Ink */
  --ink: #ececef;
  --ink-dim: #a4a4ad;
  --ink-mute: #6b6b74;

  /* Strokes */
  --stroke: rgba(236, 236, 239, 0.22);
  --stroke-strong: rgba(236, 236, 239, 0.55);

  /* Accent + status */
  --accent: #f3a64a;
  --accent-ink: #1a1208;
  --open: #6fc78a;
  --closed: #e07676;
  --info: #7fb6e6;

  /* Type */
  --hand: "Patrick Hand", system-ui, sans-serif;
  --mono: "JetBrains Mono", ui-monospace, Menlo, monospace;
  --sans: "Inter", system-ui, sans-serif;
}
```

---

*Last reviewed: 2026-05-18. Maintained by whoever's shipping this week.*

---

## 14. Product Goal

Build a simple, trustworthy map-based directory that helps people in San Francisco find free food resources quickly, with minimal friction and minimal reading.

The interface should feel: calm · practical · easy to scan · mobile-friendly · trustworthy rather than flashy.

This is not a generic restaurant map. It is a public-service tool, so clarity and speed matter more than novelty.

## 15. Core User Need

A user should be able to answer these questions within a few seconds:

- What food resources are near me?
- Is this location open today or soon?
- Do I qualify or need enrollment?
- How do I get there?
- Is this site accessible or walk-up friendly?

## 16. Data Model

```ts
type Location = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  hours: string | null;
  description: string | null;
  distributionDay?: string | null;
  nextDistributionDates?: string[];
  distributionTime?: string | null;
  availability?: string | null;
  enrollmentFrequency?: string | null;
  enrollmentTime?: string | null;
  additionalInfo?: string[];
  zipCodesServed?: string[];
  accessibilityNotes?: string[];
  phone?: string | null;
  website?: string | null;
  lastUpdated?: string | null;
};
```

## 17. Implementation Notes

### Current Frontend
- Next.js App Router
- React client map component
- CSS modules
- Google Maps JavaScript API

### Screen Flow
1. **V1 Classic Sidebar** — 420px sidebar + full-height map
2. Mobile: map top (60vh), list below as scrollable sheet
3. Selected card → opens info window on corresponding map pin
