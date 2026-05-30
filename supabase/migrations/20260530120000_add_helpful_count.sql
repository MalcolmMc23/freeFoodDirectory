alter table public.location_comments
  add column helpful_count int not null default 0;

-- Race-safe increment so concurrent votes don't collide
create or replace function increment_helpful(comment_id uuid) returns void
language sql security definer as $$
  update public.location_comments
  set helpful_count = helpful_count + 1
  where id = comment_id and is_visible = true;
$$;
