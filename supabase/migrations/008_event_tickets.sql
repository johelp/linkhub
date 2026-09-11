-- ─────────────────────────────────────────────────────────────────
-- LinkHub — Event tickets on top of Mercado Pago payments
-- Run this in: Supabase Dashboard → SQL Editor (after 001-007)
-- ─────────────────────────────────────────────────────────────────

-- Payments need to remember which ticket tier was bought (event_tickets
-- blocks have 2-3 tiers with different prices; payment_button blocks don't
-- use these columns at all).
alter table public.payments
  add column if not exists tier_id text,
  add column if not exists tier_name text;

create table public.tickets (
  id           uuid default uuid_generate_v4() primary key,
  payment_id   uuid references public.payments(id) on delete cascade not null unique,
  page_id      uuid references public.pages(id) on delete cascade not null,
  tier_id      text not null,
  tier_name    text not null,
  code         text unique not null,
  buyer_email  text,
  status       text not null default 'issued' check (status in ('issued','used','cancelled')),
  used_at      timestamptz,
  created_at   timestamptz default now() not null
);

alter table public.tickets enable row level security;

-- Owners can list/search their own event's tickets (used by the validation
-- screen, which runs as the owner's own session -- no admin client needed).
create policy "Owners can view their tickets"
  on public.tickets for select
  using (exists (select 1 from public.pages where pages.id = tickets.page_id and pages.user_id = auth.uid()));

-- Owners (or their staff, same login) can mark a ticket used. The actual
-- "already used?" race is handled by the app doing a conditional update
-- (`where status = 'issued'`), not by RLS.
create policy "Owners can update their tickets"
  on public.tickets for update
  using (exists (select 1 from public.pages where pages.id = tickets.page_id and pages.user_id = auth.uid()));

-- No insert policy: tickets are only ever created by the Mercado Pago
-- webhook (service role) after a real approved payment. No select policy
-- for anon: the public ticket-confirmation page (/t/[code]) looks a ticket
-- up by its own server-side admin-client call, scoped to the exact code
-- from the URL -- never a client-side query, since an open "anyone can
-- select" policy would let someone list every ticket (and every buyer
-- email) with no filter at all via the REST API.

create index tickets_page_id_idx on public.tickets(page_id, created_at desc);
create index tickets_code_idx on public.tickets(code);
