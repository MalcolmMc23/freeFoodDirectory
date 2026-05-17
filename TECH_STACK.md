# Tech Stack — Free Food Directory

## Overview

A map-based directory for locating free food resources in San Francisco.

---

## Core Technologies

### Framework: Next.js 15 + React 19
- **What**: Next.js is the full-stack framework; React 19 is the UI layer
- **Why**: App Router gives us server components, API routes, and first-class Vercel deployment support. React 19 client components handle interactive map state.
- **Status**: Installed and running

### Database: Supabase
- **What**: Postgres-backed BaaS with auth, real-time, and REST/GraphQL APIs
- **Why**: PostGIS extension enables geospatial queries (e.g., "find locations within 1 mile"). Row-level security handles public read + admin write without a custom backend.
- **Key tables**: `locations` (name, address, lat/lng, hours, description, category)
- **Status**: Not yet installed — `npm install @supabase/supabase-js`

### Deployment: Vercel
- **What**: Hosting and CI/CD platform
- **Why**: Zero-config Next.js deployments with edge network, preview URLs per PR, and env variable management
- **Status**: Not yet configured — add `vercel.json` and connect GitHub repo

### Map: Google Maps JavaScript API
- **What**: Interactive map with markers and info windows
- **Why**: Already integrated. Handles geocoding, marker clustering, and place details.
- **Status**: Installed — requires `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` env var

### Styling: Tailwind CSS
- **What**: Utility-first CSS framework
- **Why**: Replaces the current CSS modules approach with consistent, co-located styles. Faster to iterate on layout and responsive design.
- **Status**: Not yet installed — `npm install -D tailwindcss postcss autoprefixer`

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JS API key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key |

---

## To-Do: Setup Remaining Stack

1. **Supabase**: Create project → enable PostGIS → create `locations` table → install SDK
2. **Tailwind**: Install + configure → migrate from CSS modules
3. **Vercel**: Connect repo → add env vars → deploy

---

## Architecture Notes

- Map renders client-side (`"use client"`) via Google Maps JS API
- Location data fetched server-side from Supabase (avoids exposing service key)
- Vercel edge functions can handle geospatial queries if Supabase latency is a concern
