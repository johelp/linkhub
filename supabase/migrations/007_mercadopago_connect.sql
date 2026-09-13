-- ─────────────────────────────────────────────────────────────────
-- LinkHub — Mercado Pago Connect (OAuth) + payment logging
-- Run this in: Supabase Dashboard → SQL Editor (after 001-006)
-- ─────────────────────────────────────────────────────────────────

-- Holds each creator's Mercado Pago OAuth tokens. RLS is enabled with NO
-- policies granted to anon/authenticated — this table is intentionally
-- unreachable from any user session, even the owner's own, because it
-- holds live payment credentials. Only the service-role client
-- (src/lib/supabase/admin.ts, used by the /api/connect/mercadopago/* and
-- /api/pay/mercadopago routes) can read or write it. This mirrors the
-- lesson from 005: RLS is row-scoped, not column-scoped, so "owners can
-- manage their own row" would also mean owners can read their own
-- access_token straight from the browser — never desirable for a secret.
create table public.payment_connections (
  id                uuid default uuid_generate_v4() primary key,
  user_id           uuid references public.profiles(id) on delete cascade not null,
  provider          text not null default 'mercadopago' check (provider in ('mercadopago')),
  provider_user_id  text not null,
  access_token      text not null,
  refresh_token     text not null,
  public_key        text,
  live_mode         boolean default true not null,
  connected_at      timestamptz default now() not null,
  unique (user_id, provider)
);

alter table public.payment_connections enable row level security;

-- Payment log. No secrets in here, so owners can read their own rows
-- directly (matches the analytics_events pattern). Inserts/updates only
-- come from the server (preference creation + webhook), not RLS policies.
create table public.payments (
  id                    uuid default uuid_generate_v4() primary key,
  page_id               uuid references public.pages(id) on delete cascade not null,
  block_id              text not null,
  provider              text not null default 'mercadopago',
  status                text not null default 'pending' check (status in ('pending','approved','rejected','refunded')),
  amount                numeric(12,2) not null,
  currency              text not null,
  provider_payment_id   text,
  provider_preference_id text,
  payer_email           text,
  created_at            timestamptz default now() not null,
  updated_at            timestamptz default now() not null
);

alter table public.payments enable row level security;

create policy "Owners can view their payments"
  on public.payments for select
  using (exists (select 1 from public.pages where pages.id = payments.page_id and pages.user_id = auth.uid()));

create trigger payments_updated_at
  before update on public.payments
  for each row execute procedure public.set_updated_at();

create index payments_page_id_idx on public.payments(page_id, created_at desc);
