# Design Brief — Free Food Directory

## Product Goal

Build a simple, trustworthy map-based directory that helps people in San Francisco find free food resources quickly, with minimal friction and minimal reading.

The interface should feel:

- calm
- practical
- easy to scan
- mobile-friendly
- trustworthy rather than flashy

This is not a generic restaurant map. It is a public-service tool, so clarity and speed matter more than novelty.

## Core User Need

A user should be able to answer these questions within a few seconds:

- What food resources are near me?
- Is this location open today or soon?
- Do I qualify or need enrollment?
- How do I get there?
- Is this site accessible or walk-up friendly?

## Primary Users

### 1. People looking for food support

Needs:

- fast answers
- easy directions
- readable hours
- clear eligibility or enrollment rules
- confidence that the information is current

Constraints:

- may be on mobile
- may have limited time, battery, or data
- may be under stress
- may not want to read dense paragraphs

### 2. Social workers, case managers, and outreach staff

Needs:

- quick comparison across multiple sites
- clear service area details
- dependable information to share with clients

### 3. Volunteers or admins maintaining listings

Needs:

- a structured data model
- consistent display rules
- easy editing later

## Design Principles

### Clarity First

Every screen should prioritize the next useful action: inspect a site, compare options, or get directions.

### Scan, Don’t Read

Users should be able to skim cards and popups. Important details should be broken into rows, badges, and callouts instead of long paragraphs.

### Trust Through Structure

Well-organized information feels more credible. Dates, times, eligibility, and service area should have dedicated labels.

### Mobile Is the Default

The design should assume the first experience happens on a phone.

### Calm Visual Tone

The UI should feel supportive and grounded. Avoid loud consumer-app styling.

## Current Product State

The current app includes:

- a landing screen
- a full-screen Google Map
- markers for food locations
- dark map styling
- a custom map popup card
- mock data in `lib/mock-locations.ts`

Current limitations:

- the location model is too thin for a rich detail view
- there is no list view or filter UI yet
- popup content relies mostly on `hours` and `description`
- there is no “open now” or “next distribution” logic

## Information Architecture

The app should eventually support three layers of information.

### 1. Map Overview

Purpose:

- show where resources are distributed geographically
- allow quick exploration by neighborhood

Must show:

- location markers
- current map position
- clear tap target for each marker

### 2. Quick Detail Popup

Purpose:

- give enough information to decide whether to visit or open a fuller detail page

Recommended fields:

- location name
- address
- category
- distribution day
- next distribution date
- time window
- availability status
- enrollment requirement
- accessibility notes
- directions link

### 3. Full Detail Page or Drawer

Purpose:

- provide full site information when the popup is not enough

Recommended sections:

- overview
- schedule
- eligibility and enrollment
- accessibility
- food notes
- zip codes served
- contact and website
- directions
- data freshness or last updated date

## Recommended Screen Flow

### Landing State

The initial screen should help the user get into the map immediately.

Recommended options:

- `Show map`
- `Use my location`
- `Browse nearby pantries`

The current landing page is acceptable as a temporary placeholder but should evolve into a more useful entry point.

### Map State

The main map view should become the primary product experience.

Recommended layout on mobile:

- full-screen map
- compact top search or title bar
- optional bottom sheet for selected location

Recommended layout on desktop:

- map with either:
  a persistent side panel list, or
  a floating detail panel for the selected location

### Selected Location State

When a marker is tapped:

- open a popup or bottom sheet
- show a short, structured summary
- provide a clear directions action
- avoid forcing the user to read a paragraph first

## Popup Design Direction

The popup should feel like a compact service card, not a default map tooltip.

### What Works Well

The current custom popup is moving in the right direction:

- stronger title hierarchy
- muted address styling
- category badge
- structured notes
- direct directions action

### What Should Improve Next

To match the intended reference style more closely, the popup should become more table-like and data-driven.

Recommended popup structure:

1. Header
- location name
- address
- category or service badge

2. Key Facts
- distribution day
- next distribution
- distribution time
- availability
- enrollment frequency

3. Additional Information
- accessibility
- food type or cooking requirements
- zip codes served

4. Actions
- directions
- website
- text or call if available

### UX Rules for Popups

- keep the height constrained on small screens
- prioritize the first 3 to 5 facts
- collapse secondary notes if needed
- make the primary action obvious
- never show unlabeled raw data blobs

## Visual Design Direction

### Tone

Use a warm, civic, grounded visual style.

Keywords:

- warm neutrals
- olive or green accents
- soft gold or sand highlights
- dark map background
- readable typography

### Color Direction

Suggested palette:

- background: `#f6f1e8`
- panel: `#fffaf2`
- text: `#3f3525`
- muted text: `#6f7277`
- accent green: `#4f8e43`
- accent sand: `#efe4bf`
- border: `#e5ddd0`
- dark map base: `#172026`

### Typography

The current app uses Arial/Helvetica. That is functional, but the eventual design should use a more intentional type system.

Suggested pairing:

- headings: a serif with warmth and authority
- body/UI labels: a clean sans-serif

Important rule:

- typography must stay highly readable on mobile

## Accessibility

This app should treat accessibility as a product requirement, not a polish task.

Requirements:

- sufficient color contrast
- keyboard-accessible map fallback interactions where possible
- large tap targets for mobile
- readable type sizes
- structured labels for schedule and eligibility data
- no information conveyed by color alone

Important note:

Map interfaces are inherently harder to make accessible. The product should eventually include a list view as a non-map alternative.

## Data Model Needed for Good Design

The current `Location` type is not rich enough for the desired UX.

Recommended future fields:

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

This is the most important design-enabling change. Without structured fields, the UI will keep relying on parsing prose.

## Near-Term Product Roadmap

### Phase 1

Improve the current map experience.

Goals:

- richer popup content
- better mock data
- cleaner landing state
- stronger visual consistency

### Phase 2

Add structured browsing and filtering.

Goals:

- list view
- filters by day, neighborhood, and eligibility
- “open soon” or “next distribution” states

### Phase 3

Add robust source-backed data.

Goals:

- Supabase-backed locations
- admin editing flow
- freshness indicators
- source links or verification dates

## Implementation Notes

### Current Frontend

- Next.js App Router
- React client map component
- CSS modules
- Google Maps JavaScript API

### Suggested Next UI Tasks

1. Expand `lib/types.ts` to support structured location details.
2. Replace the mock records with richer sample data.
3. Redesign the popup to render labeled rows from structured fields.
4. Add a selected-location side panel or bottom sheet.
5. Add a list view for accessibility and easier comparison.

## Success Criteria

The design is working if a first-time user can:

- open the map quickly
- tap a marker
- understand the site’s schedule and eligibility at a glance
- get directions in one tap
- compare multiple options without confusion

## Open Questions

- Should the primary experience be map-first or list-first on mobile?
- How much detail belongs in the popup versus a full detail panel?
- Do we want a lightweight civic tone or a more branded nonprofit tone?
- What source of truth will power updates and freshness dates?
- Will eligibility and zip-code rules be structured enough for filtering?
