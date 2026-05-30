-- location_comments: anonymous community notes on food bank locations
create table if not exists public.location_comments (
  id            uuid primary key default gen_random_uuid(),
  location_id   uuid not null references public.locations(id) on delete cascade,
  comment_text  text not null check (char_length(comment_text) between 3 and 280),
  display_name  text not null default 'A visitor',
  ip_hash       text not null,
  flag_count    int not null default 0,
  is_visible    bool not null default true,
  created_at    timestamptz not null default now()
);

-- Index for fetching comments by location
create index location_comments_location_id_idx
  on public.location_comments (location_id, is_visible, created_at desc);

-- Index for rate-limit checks by ip_hash
create index location_comments_ip_hash_idx
  on public.location_comments (ip_hash, created_at desc);

alter table public.location_comments enable row level security;

-- Public can read visible comments
create policy "public read visible comments"
  on public.location_comments for select
  using (is_visible = true);

-- Public can insert (no auth required)
create policy "public insert comments"
  on public.location_comments for insert
  with check (true);

-- Only service role can update (flag_count, is_visible)
-- No explicit policy needed — service role bypasses RLS by default
