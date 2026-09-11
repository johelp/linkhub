-- ─────────────────────────────────────────────────────────────────
-- LinkHub — Email capture block
-- Run this in: Supabase Dashboard → SQL Editor (after 001-005)
-- ─────────────────────────────────────────────────────────────────

create table public.email_subscribers (
  id         uuid default uuid_generate_v4() primary key,
  page_id    uuid references public.pages(id) on delete cascade not null,
  email      text not null,
  lang       text default 'es',
  created_at timestamptz default now() not null,
  unique (page_id, email)
);

alter table public.email_subscribers enable row level security;

-- Public can submit their email from the published page (same pattern as
-- analytics_events — anonymous visitors, no auth).
create policy "Public can subscribe"
  on public.email_subscribers for insert with check (true);

-- Only the page owner can read/export/delete their own subscribers.
create policy "Owners can manage their subscribers"
  on public.email_subscribers for select
  using (exists (select 1 from public.pages where pages.id = email_subscribers.page_id and pages.user_id = auth.uid()));

create policy "Owners can delete their subscribers"
  on public.email_subscribers for delete
  using (exists (select 1 from public.pages where pages.id = email_subscribers.page_id and pages.user_id = auth.uid()));

create index email_subscribers_page_id_idx on public.email_subscribers(page_id, created_at desc);
