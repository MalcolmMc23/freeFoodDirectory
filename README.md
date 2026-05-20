# Free Food Directory

Contributor note: Eric has contributed.

Map-based directory for free food resources in San Francisco.

## Stack

- Next.js
- TypeScript
- Google Maps JavaScript API
- Supabase

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase setup

The repo now includes:

- `supabase/config.toml`
- `supabase/migrations/`
- `supabase/seed.sql`

### 1. Create or choose a Supabase project

If you already have a hosted Supabase project, copy its:

- project URL
- anon key

into `.env.local`.

You can start from:

```bash
cp .env.example .env.local
```

### 2. Link the CLI to your hosted project

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

### 3. Push the schema

```bash
supabase db push
```

### 4. Optional local development

If Docker is available:

```bash
supabase start
supabase db reset
```

This will apply the migration and seed the local `locations` table.

## Notes

- The app reads the browser key from `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- The app reads Supabase from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- The scraper writes to Supabase with `SUPABASE_SERVICE_ROLE_KEY`.
- If Supabase is not configured or returns no rows, the app falls back to mock location data.

## Scraper

The current scraper lives in `scraper/` and is aimed at the SF-Marin Food Bank locator page.

```bash
cd scraper
npm run scrape
```

Behavior:

- scrapes structured pantry fields
- writes local JSON snapshots under `scraper/data/`
- upserts pantry rows into `public.locations` when Supabase env vars are present
- stores raw scrape payloads in `public.location_snapshots`


test
