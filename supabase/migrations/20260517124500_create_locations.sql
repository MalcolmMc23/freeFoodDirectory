create extension if not exists pgcrypto;

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  hours text,
  description text,
  category text not null
);

create index if not exists locations_category_idx on public.locations (category);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists locations_set_updated_at on public.locations;

create trigger locations_set_updated_at
before update on public.locations
for each row
execute function public.set_updated_at();

alter table public.locations enable row level security;

drop policy if exists "Public read access for locations" on public.locations;

create policy "Public read access for locations"
on public.locations
for select
to anon, authenticated
using (true);
