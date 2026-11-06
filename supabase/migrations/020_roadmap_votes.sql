-- Votes for upcoming features ("Próximamente"). The list of features lives in
-- code (src/lib/roadmap.ts); this table only stores who wants what.
create table if not exists public.roadmap_votes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  item_key   text not null check (item_key ~ '^[a-z0-9_]{1,40}$'),
  created_at timestamptz not null default now(),
  primary key (user_id, item_key)
);
create index if not exists roadmap_votes_item_idx on public.roadmap_votes (item_key);

alter table public.roadmap_votes enable row level security;
drop policy if exists "Owners read their votes" on public.roadmap_votes;
create policy "Owners read their votes" on public.roadmap_votes for select using (auth.uid() = user_id);
drop policy if exists "Owners cast their votes" on public.roadmap_votes;
create policy "Owners cast their votes" on public.roadmap_votes for insert with check (auth.uid() = user_id);
drop policy if exists "Owners withdraw their votes" on public.roadmap_votes;
create policy "Owners withdraw their votes" on public.roadmap_votes for delete using (auth.uid() = user_id);
-- Totals are read by the server with the service role (admin panel): customers
-- only ever see their own votes, so counts don't steer each other.

-- A customer can vote for at most 10 things (stops scripted ballot stuffing).
create or replace function public.limit_roadmap_votes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.roadmap_votes where user_id = new.user_id) >= 10 then
    raise exception 'limit_exceeded: at most 10 votes per account';
  end if;
  return new;
end $$;
drop trigger if exists roadmap_votes_limit on public.roadmap_votes;
create trigger roadmap_votes_limit before insert on public.roadmap_votes
  for each row execute procedure public.limit_roadmap_votes();
