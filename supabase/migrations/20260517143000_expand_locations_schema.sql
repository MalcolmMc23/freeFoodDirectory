alter table public.locations
  add column if not exists slug text,
  add column if not exists address_line text,
  add column if not exists city text not null default 'San Francisco',
  add column if not exists state text not null default 'CA',
  add column if not exists postal_code text,
  add column if not exists geocode_status text not null default 'pending',
  add column if not exists distribution_day text,
  add column if not exists next_distribution_dates text[] not null default '{}'::text[],
  add column if not exists distribution_time_text text,
  add column if not exists availability_status text,
  add column if not exists enrollment_frequency text,
  add column if not exists enrollment_time_text text,
  add column if not exists additional_languages text[] not null default '{}'::text[],
  add column if not exists additional_info text[] not null default '{}'::text[],
  add column if not exists zip_codes_served text[] not null default '{}'::text[],
  add column if not exists outside_zip_code boolean not null default false,
  add column if not exists source_url text,
  add column if not exists site_url text,
  add column if not exists active boolean not null default true,
  add column if not exists last_scraped_at timestamptz,
  add column if not exists last_changed_at timestamptz not null default now();

update public.locations
set
  address_line = coalesce(address_line, regexp_replace(address, '\s+San Francisco(?:,\s*CA)?\s+\d{5}$', '', 'g')),
  postal_code = coalesce(postal_code, substring(address from '(\d{5})$')),
  distribution_time_text = coalesce(distribution_time_text, hours),
  additional_info = case
    when coalesce(array_length(additional_info, 1), 0) > 0 then additional_info
    when description is not null and btrim(description) <> '' then array[description]
    else '{}'::text[]
  end,
  geocode_status = case
    when lat is not null and lng is not null then 'success'
    else 'pending'
  end,
  slug = coalesce(
    slug,
    trim(both '-' from regexp_replace(lower(name || '-' || coalesce(substring(address from '(\d{5})$'), '')), '[^a-z0-9]+', '-', 'g'))
  ),
  last_changed_at = coalesce(last_changed_at, now());

alter table public.locations
  alter column lat drop not null,
  alter column lng drop not null,
  alter column category drop not null,
  alter column slug set not null,
  alter column address_line set not null;

alter table public.locations
  drop column if exists address,
  drop column if exists hours,
  drop column if exists description;

alter table public.locations
  drop constraint if exists locations_geocode_status_check;

alter table public.locations
  add constraint locations_geocode_status_check
  check (geocode_status in ('pending', 'success', 'failed'));

create unique index if not exists locations_slug_idx on public.locations (slug);
create index if not exists locations_active_name_idx on public.locations (name) where active = true;

drop policy if exists "Public read access for locations" on public.locations;

create policy "Public read access for locations"
on public.locations
for select
to anon, authenticated
using (active = true);

create table if not exists public.location_snapshots (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  scraped_at timestamptz not null default now(),
  snapshot_hash text not null,
  payload_json jsonb not null
);

create unique index if not exists location_snapshots_location_hash_idx
on public.location_snapshots (location_id, snapshot_hash);

create index if not exists location_snapshots_location_scraped_idx
on public.location_snapshots (location_id, scraped_at desc);

alter table public.location_snapshots enable row level security;
