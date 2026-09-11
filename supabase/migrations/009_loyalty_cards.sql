-- ─────────────────────────────────────────────────────────────────
-- LinkHub — Loyalty stamp cards ("tarjeta de sellos")
-- Run this in: Supabase Dashboard → SQL Editor (after 001-008)
-- ─────────────────────────────────────────────────────────────────

create table public.loyalty_cards (
  id                 uuid default uuid_generate_v4() primary key,
  page_id            uuid references public.pages(id) on delete cascade not null,
  block_id           text not null,
  code               text unique not null,
  stamps_count       int not null default 0,
  last_redeemed_at   timestamptz,
  created_at         timestamptz default now() not null
);

alter table public.loyalty_cards enable row level security;

-- A visitor gets their own card from the public page (anonymous, no auth --
-- same pattern as email_subscribers). The check clause is what stops someone
-- from opening devtools and inserting a card that already has stamps on it,
-- or already marked redeemed: every column but the identifying ones must
-- start at its zero value, same discipline as never trusting a client-sent
-- price on the payment blocks.
create policy "Public can create a loyalty card"
  on public.loyalty_cards for insert
  with check (stamps_count = 0 and last_redeemed_at is null);

-- Owners can list and stamp/redeem cards for their own pages (the dashboard
-- "sumar sello" screen runs as the owner's own session, no admin client
-- needed -- same pattern as tickets).
create policy "Owners can view their loyalty cards"
  on public.loyalty_cards for select
  using (exists (select 1 from public.pages where pages.id = loyalty_cards.page_id and pages.user_id = auth.uid()));

create policy "Owners can update their loyalty cards"
  on public.loyalty_cards for update
  using (exists (select 1 from public.pages where pages.id = loyalty_cards.page_id and pages.user_id = auth.uid()));

-- No public select policy: the customer's own card page (/l/[code]) looks it
-- up server-side via the admin client by its exact code, same as /t/[code]
-- tickets -- an open "anyone can select" policy would let someone list every
-- card (and everyone's stamp counts) with no filter via the REST API.

create index loyalty_cards_page_id_idx on public.loyalty_cards(page_id, created_at desc);
create index loyalty_cards_code_idx on public.loyalty_cards(code);
