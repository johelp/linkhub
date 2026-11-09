-- ============================================================================
-- LinkHub · migraciones 001 a 022 en un solo script
-- Generado desde supabase/migrations/ (no editar a mano: regenerar con `npm run sql:bundle`).
-- Pégalo en Supabase → SQL Editor del proyecto de STAGING.
-- Solo para un proyecto NUEVO y vacío: la migración 001 no es idempotente.
-- Todo va en una transacción: si algo falla no queda nada a medias.
-- Las migraciones son idempotentes: volver a ejecutarlo es seguro.
-- NO lo ejecutes en producción sin haberlo probado en staging.
-- ============================================================================
begin;

-- ───────────────────────── 001_initial_schema.sql ─────────────────────────
-- ─────────────────────────────────────────────────────────────────
-- LinkHub — Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────────
create table public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  email         text not null,
  full_name     text,
  avatar_url    text,
  plan          text not null default 'free' check (plan in ('free','pro','agency')),
  plan_expires_at timestamptz,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── PAGES ───────────────────────────────────────────────────────
create table public.pages (
  id            uuid default uuid_generate_v4() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  slug          text unique not null,
  name          text not null,
  settings      jsonb not null default '{
    "defaultLang": "es",
    "enabledLangs": ["es"],
    "seasonMode": "always",
    "primaryColor": "#E8150A",
    "backgroundColor": "#F6F6F5",
    "fontFamily": "DM Sans",
    "showPoweredBy": true,
    "seo": {
      "title": "",
      "description": "",
      "ogImage": null
    }
  }',
  blocks        jsonb not null default '[]',
  published     boolean default false not null,
  qr_url        text,
  custom_domain text unique,
  views         integer default 0 not null,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

alter table public.pages enable row level security;

-- Owners can do anything
create policy "Owners can manage own pages"
  on public.pages for all using (auth.uid() = user_id);

-- Public can read published pages (for /p/[slug] route)
create policy "Public can view published pages"
  on public.pages for select using (published = true);

-- Slug validation: lowercase letters, numbers, hyphens
alter table public.pages
  add constraint slug_format check (slug ~ '^[a-z0-9][a-z0-9\-]{1,60}[a-z0-9]$');

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger pages_updated_at
  before update on public.pages
  for each row execute procedure public.set_updated_at();

-- ─── ANALYTICS EVENTS ────────────────────────────────────────────
create table public.analytics_events (
  id          uuid default uuid_generate_v4() primary key,
  page_id     uuid references public.pages(id) on delete cascade not null,
  event_type  text not null check (event_type in ('view','click')),
  block_id    text,
  block_type  text,
  url         text,
  lang        text default 'es',
  country     text,
  device      text check (device in ('mobile','tablet','desktop')),
  referrer    text,
  created_at  timestamptz default now() not null
);

-- Partitioned by month for performance (optional, add later)
-- Analytics insert is public (anonymous tracking)
alter table public.analytics_events enable row level security;

create policy "Public can insert analytics"
  on public.analytics_events for insert with check (true);

create policy "Owners can view analytics"
  on public.analytics_events for select
  using (
    exists (
      select 1 from public.pages
      where pages.id = analytics_events.page_id
      and pages.user_id = auth.uid()
    )
  );

-- Index for dashboard queries
create index analytics_page_created on public.analytics_events(page_id, created_at desc);

-- ─── DOMAINS ─────────────────────────────────────────────────────
create table public.custom_domains (
  id         uuid default uuid_generate_v4() primary key,
  page_id    uuid references public.pages(id) on delete cascade unique,
  domain     text unique not null,
  verified   boolean default false,
  txt_record text,
  created_at timestamptz default now()
);

alter table public.custom_domains enable row level security;

create policy "Owners can manage domains"
  on public.custom_domains for all
  using (
    exists (
      select 1 from public.pages
      where pages.id = custom_domains.page_id
      and pages.user_id = auth.uid()
    )
  );

-- ─── HELPER VIEWS ────────────────────────────────────────────────
-- Page summary for dashboard (without full blocks JSON)
create or replace view public.pages_summary as
  select
    p.id,
    p.user_id,
    p.slug,
    p.name,
    p.published,
    p.views,
    p.settings->>'primaryColor' as primary_color,
    p.settings->>'defaultLang' as default_lang,
    jsonb_array_length(p.blocks) as block_count,
    p.created_at,
    p.updated_at
  from public.pages p;

-- Analytics 30-day summary per page
create or replace view public.analytics_summary as
  select
    page_id,
    count(*) filter (where event_type = 'view') as views_30d,
    count(*) filter (where event_type = 'click') as clicks_30d,
    count(distinct country) as countries,
    date_trunc('day', created_at) as day
  from public.analytics_events
  where created_at > now() - interval '30 days'
  group by page_id, date_trunc('day', created_at);

-- ─── STORAGE BUCKETS (run in Storage section or here) ────────────
-- insert into storage.buckets (id, name, public) values ('page-assets', 'page-assets', true);

-- Storage policy (set in Supabase dashboard)
-- Allow authenticated users to upload to their own folder: user_id/*

-- ───────────────────────── 002_plan_enforcement_and_views.sql ─────────────────────────
-- ─────────────────────────────────────────────────────────────────
-- LinkHub — Plan enforcement + views counter fix
-- Run this in: Supabase Dashboard → SQL Editor (after 001_initial_schema.sql)
-- ─────────────────────────────────────────────────────────────────

-- ─── VIEWS COUNTER ───────────────────────────────────────────────
-- pages.views was never incremented anywhere (dashboard always showed 0).
-- Increment it from the analytics_events insert (public can insert 'view' events).
create or replace function public.increment_page_views()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.event_type = 'view' then
    update public.pages set views = views + 1 where id = new.page_id;
  end if;
  return new;
end;
$$;

create trigger analytics_increment_views
  after insert on public.analytics_events
  for each row execute procedure public.increment_page_views();

-- ─── PLAN LIMITS ─────────────────────────────────────────────────
-- Plan limits (page count, advanced blocks) were only enforced in the UI
-- and in the Next.js API route. Since RLS lets an authenticated user call
-- the Supabase REST API directly (bypassing our app), the real boundary
-- has to live here.
create or replace function public.enforce_plan_limits()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  user_plan text;
  page_count int;
  page_limit int;
  block jsonb;
  advanced_blocks text[] := array['featured','expandable','social_grid','contact_card','image_banner','text'];
begin
  select plan into user_plan from public.profiles where id = new.user_id;
  user_plan := coalesce(user_plan, 'free');

  if tg_op = 'INSERT' then
    page_limit := case user_plan when 'free' then 1 else 999999 end;
    select count(*) into page_count from public.pages where user_id = new.user_id;
    if page_count >= page_limit then
      raise exception 'plan_limit_exceeded: % plan allows at most % page(s)', user_plan, page_limit;
    end if;
  end if;

  if user_plan = 'free' and new.blocks is not null then
    for block in select * from jsonb_array_elements(new.blocks)
    loop
      if (block->>'type') = any(advanced_blocks) then
        raise exception 'plan_limit_exceeded: block type % requires Pro plan', block->>'type';
      end if;
    end loop;
  end if;

  return new;
end;
$$;

create trigger pages_enforce_plan_limits
  before insert or update on public.pages
  for each row execute procedure public.enforce_plan_limits();

-- ───────────────────────── 003_two_plan_tiers.sql ─────────────────────────
-- ─────────────────────────────────────────────────────────────────
-- LinkHub — Collapse to two plan tiers (free / pro)
-- Run this in: Supabase Dashboard → SQL Editor (after 001 and 002)
-- ─────────────────────────────────────────────────────────────────

-- Fold any existing 'agency' accounts into 'pro' — 'pro' now includes
-- everything 'agency' used to (custom domain, full+export analytics).
update public.profiles set plan = 'pro' where plan = 'agency';

-- Tighten the check constraint to just the two tiers.
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check check (plan in ('free','pro'));

-- ───────────────────────── 004_stripe_billing.sql ─────────────────────────
-- ─────────────────────────────────────────────────────────────────
-- LinkHub — Stripe billing fields
-- Run this in: Supabase Dashboard → SQL Editor (after 001, 002, 003)
-- ─────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text unique,
  add column if not exists stripe_subscription_status text;

-- The webhook handler runs with the service_role key (it authenticates via
-- Stripe's signature, not a Supabase session), so it bypasses RLS already.
-- This index just makes "find profile by customer id" fast on webhook events.
create index if not exists profiles_stripe_customer_id_idx on public.profiles(stripe_customer_id);

-- ───────────────────────── 005_protect_billing_columns.sql ─────────────────────────
-- ─────────────────────────────────────────────────────────────────
-- LinkHub — Protect billing columns on profiles from self-service writes
-- Run this in: Supabase Dashboard → SQL Editor (after 001-004)
-- ─────────────────────────────────────────────────────────────────
--
-- "Users can update own profile" (001) is `for update using (auth.uid() = id)`
-- with no `with check` and no column-level restriction. RLS in Postgres is
-- row-scoped, not column-scoped, so that policy lets any authenticated user
-- PATCH their OWN plan/stripe_* columns directly via the Supabase REST API
-- (same anon key + session the browser client already uses) — completely
-- bypassing Stripe and the /api/checkout → webhook flow. This trigger closes
-- that: an end-user session (PostgREST request with an 'authenticated' JWT)
-- can no longer change these columns — only the Stripe webhook's
-- service-role client (src/lib/supabase/admin.ts) or a trusted operator
-- running SQL directly can.

create or replace function public.protect_billing_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Only block requests that came in through PostgREST as a logged-in end
  -- user (auth.role() = 'authenticated'). The Stripe webhook's service-role
  -- client carries role 'service_role' and is exempt. Raw SQL run directly
  -- in the Supabase SQL Editor (e.g. the manual "grant Pro" query in
  -- SETUP.md §7) has no JWT context at all — auth.role() is null there,
  -- which is also exempt, so that workflow keeps working.
  if auth.role() = 'authenticated' then
    if new.plan is distinct from old.plan
       or new.stripe_customer_id is distinct from old.stripe_customer_id
       or new.stripe_subscription_id is distinct from old.stripe_subscription_id
       or new.stripe_subscription_status is distinct from old.stripe_subscription_status
       or new.plan_expires_at is distinct from old.plan_expires_at then
      raise exception 'not_allowed: billing fields are managed by the server';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_billing_columns
  before update on public.profiles
  for each row execute procedure public.protect_billing_columns();

-- ───────────────────────── 006_email_capture.sql ─────────────────────────
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

-- ───────────────────────── 007_mercadopago_connect.sql ─────────────────────────
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

-- ───────────────────────── 008_event_tickets.sql ─────────────────────────
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

-- ───────────────────────── 009_loyalty_cards.sql ─────────────────────────
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

-- ───────────────────────── 010_storage_images.sql ─────────────────────────
-- ─────────────────────────────────────────────────────────────────
-- LinkHub — Storage bucket for user-uploaded images (image_banner block)
-- Run this in: Supabase Dashboard → SQL Editor (after 001-009)
-- ─────────────────────────────────────────────────────────────────

-- Public bucket: images need to be readable by anyone visiting a published
-- page (no auth), same trust model as the page content itself. Writes are
-- restricted below by RLS on storage.objects, not by the bucket being
-- private -- a private bucket would need a signed URL per image on every
-- page load, which public pages don't do anywhere else in this project.
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Folder-per-user convention: every object's path starts with the
-- uploader's auth.uid(), e.g. "3fa8.../<uuid>.jpg" -- storage.foldername()
-- splits the path on "/" and [1] is that first segment. This is the
-- standard Supabase Storage pattern for "users can only touch their own
-- files" and mirrors how `payments`/`loyalty_cards` scope rows to owners.
create policy "Public can view images"
  on storage.objects for select
  using (bucket_id = 'images');

create policy "Users can upload to their own folder"
  on storage.objects for insert
  with check (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own images"
  on storage.objects for update
  using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own images"
  on storage.objects for delete
  using (bucket_id = 'images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ───────────────────────── 011_security_hardening.sql ─────────────────────────
-- Security hardening (audit SEC-004/005/006). Apply with `supabase db push`
-- or paste in the SQL editor. Idempotent.

-- 1) Storage: cap size and restrict MIME types on the public images bucket
--    (client-side checks are advisory only; SVG/HTML could otherwise be hosted
--    on the project's domain).
update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
 where id = 'images';

-- 2) Public inserts: only against published pages, with sane field shapes.
drop policy if exists "Public can insert analytics" on public.analytics_events;
create policy "Public can insert analytics"
  on public.analytics_events for insert
  with check (
    exists (select 1 from public.pages p where p.id = page_id and p.published)
    and char_length(coalesce(url, ''))      <= 2048
    and char_length(coalesce(referrer, '')) <= 2048
    and char_length(coalesce(block_id, '')) <= 64
  );

drop policy if exists "Public can subscribe" on public.email_subscribers;
create policy "Public can subscribe"
  on public.email_subscribers for insert
  with check (
    exists (select 1 from public.pages p where p.id = page_id and p.published)
    and char_length(email) between 5 and 254
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

-- 3) Owners must not be able to claim a custom domain by editing their own
--    row through the REST API. (`views` is deliberately NOT protected here:
--    the increment_page_views() trigger updates it in the session of whoever
--    fires the analytics insert, including a logged-in owner.)
create or replace function public.protect_page_server_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'authenticated' then
    if new.custom_domain is distinct from old.custom_domain then
      raise exception 'not_allowed: custom_domain is managed by the server';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists pages_protect_server_columns on public.pages;
create trigger pages_protect_server_columns
  before update on public.pages
  for each row execute procedure public.protect_page_server_columns();

-- 4) The plan-limit trigger only knew 6 "advanced" blocks; keep it in sync
--    with FREE_BLOCKS in src/types (free = link, section_label, divider).
create or replace function public.enforce_plan_limits()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  user_plan text;
  page_count int;
  page_limit int;
  block jsonb;
  free_blocks text[] := array['link','section_label','divider'];
begin
  select plan into user_plan from public.profiles where id = new.user_id;
  user_plan := coalesce(user_plan, 'free');

  if tg_op = 'INSERT' then
    page_limit := case user_plan when 'free' then 1 else 999999 end;
    select count(*) into page_count from public.pages where user_id = new.user_id;
    if page_count >= page_limit then
      raise exception 'plan_limit_exceeded: % plan allows at most % page(s)', user_plan, page_limit;
    end if;
  end if;

  if user_plan = 'free' and new.blocks is not null then
    for block in select * from jsonb_array_elements(new.blocks)
    loop
      if not ((block->>'type') = any(free_blocks)) then
        raise exception 'plan_limit_exceeded: block type % requires Pro plan', block->>'type';
      end if;
    end loop;
  end if;

  return new;
end;
$$;

-- ───────────────────────── 012_dashboard_stats.sql ─────────────────────────
-- Aggregated analytics for the customer dashboard. SECURITY INVOKER on purpose:
-- the caller's RLS applies (owners only see events of their own pages) and the
-- aggregation happens in Postgres, so it isn't capped by the REST row limit.

create or replace function public.owner_daily_stats(days int default 60)
returns table (day date, page_id uuid, views bigint, clicks bigint)
language sql stable security invoker set search_path = public as $$
  select e.created_at::date, e.page_id,
         count(*) filter (where e.event_type = 'view'),
         count(*) filter (where e.event_type = 'click')
  from public.analytics_events e
  join public.pages p on p.id = e.page_id
  where p.user_id = auth.uid()
    and e.created_at >= now() - make_interval(days => least(greatest(days, 1), 365))
  group by 1, 2;
$$;

create or replace function public.owner_top_blocks(days int default 30, lim int default 8)
returns table (page_id uuid, block_id text, block_type text, clicks bigint)
language sql stable security invoker set search_path = public as $$
  select e.page_id, e.block_id, e.block_type, count(*)
  from public.analytics_events e
  join public.pages p on p.id = e.page_id
  where p.user_id = auth.uid() and e.event_type = 'click' and e.block_id is not null
    and e.created_at >= now() - make_interval(days => least(greatest(days, 1), 365))
  group by 1, 2, 3
  order by 4 desc
  limit least(greatest(lim, 1), 50);
$$;

create or replace function public.owner_device_stats(days int default 30)
returns table (device text, views bigint)
language sql stable security invoker set search_path = public as $$
  select coalesce(e.device, 'desktop'), count(*)
  from public.analytics_events e
  join public.pages p on p.id = e.page_id
  where p.user_id = auth.uid() and e.event_type = 'view'
    and e.created_at >= now() - make_interval(days => least(greatest(days, 1), 365))
  group by 1;
$$;

revoke all on function public.owner_daily_stats(int), public.owner_top_blocks(int, int), public.owner_device_stats(int) from public, anon;
grant execute on function public.owner_daily_stats(int), public.owner_top_blocks(int, int), public.owner_device_stats(int) to authenticated;

-- ───────────────────────── 013_hardening_phase2.sql ─────────────────────────
-- Hardening phase 2 (audit SEC-014/016/017/018). Idempotent.

-- 1) Webhook idempotency (Stripe retries / duplicate deliveries).
create table if not exists public.processed_webhook_events (
  id          text primary key,
  provider    text not null,
  received_at timestamptz not null default now()
);
alter table public.processed_webhook_events enable row level security; -- no policies: service role only

-- 2) Admin audit log: who changed what, when. Written by the server (service role).
create table if not exists public.admin_audit_log (
  id          bigint generated always as identity primary key,
  actor_email text not null,
  action      text not null,
  target      text,
  detail      jsonb,
  created_at  timestamptz not null default now()
);
alter table public.admin_audit_log enable row level security; -- no policies: service role only
create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);

-- 3) Moderation: a page taken down by an admin can't be re-published by its owner.
alter table public.pages add column if not exists moderated_at timestamptz;

create or replace function public.protect_moderation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'authenticated' then
    if new.moderated_at is distinct from old.moderated_at then
      raise exception 'not_allowed: moderation is managed by the platform';
    end if;
    if old.moderated_at is not null and new.published is true then
      raise exception 'not_allowed: this page was unpublished by moderation';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists pages_protect_moderation on public.pages;
create trigger pages_protect_moderation
  before update on public.pages
  for each row execute procedure public.protect_moderation();

-- 4) Anti-spam on public inserts (per page, rolling window). Cheap, stateless
--    and enforced in the database, so it holds on any hosting.
create or replace function public.throttle_public_inserts()
returns trigger language plpgsql security definer set search_path = public as $$
declare recent int;
begin
  if tg_table_name = 'email_subscribers' then
    select count(*) into recent from public.email_subscribers
      where page_id = new.page_id and created_at > now() - interval '1 minute';
    if recent >= 30 then raise exception 'rate_limited: too many sign-ups, try again shortly'; end if;
  elsif tg_table_name = 'analytics_events' then
    select count(*) into recent from public.analytics_events
      where page_id = new.page_id and created_at > now() - interval '1 minute';
    if recent >= 600 then raise exception 'rate_limited'; end if;
  elsif tg_table_name = 'payments' then
    select count(*) into recent from public.payments
      where page_id = new.page_id and created_at > now() - interval '1 minute';
    if recent >= 20 then raise exception 'rate_limited: too many checkout attempts'; end if;
  end if;
  return new;
end;
$$;

drop trigger if exists email_subscribers_throttle on public.email_subscribers;
create trigger email_subscribers_throttle before insert on public.email_subscribers
  for each row execute procedure public.throttle_public_inserts();
drop trigger if exists analytics_events_throttle on public.analytics_events;
create trigger analytics_events_throttle before insert on public.analytics_events
  for each row execute procedure public.throttle_public_inserts();
drop trigger if exists payments_throttle on public.payments;
create trigger payments_throttle before insert on public.payments
  for each row execute procedure public.throttle_public_inserts();

-- ───────────────────────── 014_multi_provider_payments.sql ─────────────────────────
-- Multi-gateway payments: Mercado Pago (existing), Stripe Connect and Redsys.
-- Idempotent.

-- 1) Allow more providers per seller (still one connection per provider).
alter table public.payment_connections drop constraint if exists payment_connections_provider_check;
alter table public.payment_connections
  add constraint payment_connections_provider_check check (provider in ('mercadopago', 'stripe', 'redsys'));

-- 2) Non-secret provider settings (e.g. Redsys merchant code / terminal / environment).
--    Secrets stay in access_token (encrypted by the app, see src/lib/crypto.ts).
alter table public.payment_connections add column if not exists config jsonb not null default '{}'::jsonb;

-- 3) Payments can be made through any provider; keep the provider's own
--    identifier (Stripe session id, Redsys order number) for reconciliation.
create index if not exists payments_provider_pref_idx on public.payments (provider, provider_preference_id);

-- ───────────────────────── 015_payment_events.sql ─────────────────────────
-- Full payment audit trail. One row per thing that happened to a payment
-- (checkout started, provider notification received, approved, rejected,
-- ticket issued, signature/amount mismatch...). Visible to the seller who owns
-- the page (RLS) and to platform admins (service role). Idempotent.
create table if not exists public.payment_events (
  id          bigint generated always as identity primary key,
  payment_id  uuid references public.payments(id) on delete cascade,
  page_id     uuid references public.pages(id) on delete cascade,
  provider    text,
  type        text not null,            -- e.g. checkout.started, notification.received, payment.approved
  level       text not null default 'info' check (level in ('info', 'warn', 'error')),
  message     text,
  detail      jsonb not null default '{}'::jsonb,   -- NEVER secrets or full card data
  created_at  timestamptz not null default now()
);
create index if not exists payment_events_payment_idx on public.payment_events (payment_id, created_at);
create index if not exists payment_events_page_idx on public.payment_events (page_id, created_at desc);
create index if not exists payment_events_created_idx on public.payment_events (created_at desc);

alter table public.payment_events enable row level security;
drop policy if exists "Owners can view their payment events" on public.payment_events;
create policy "Owners can view their payment events"
  on public.payment_events for select
  using (exists (select 1 from public.pages p where p.id = payment_events.page_id and p.user_id = auth.uid()));
-- inserts happen only from the server (service role), no insert policy on purpose.

-- Platform admins read everything through the service role; make "recent" fast.
create index if not exists payments_created_idx on public.payments (created_at desc);

-- ───────────────────────── 016_feature_flags.sql ─────────────────────────
-- Feature flags with per-customer overrides: ship a feature dark, enable it for
-- chosen customers first, widen with a percentage, then for everyone.
-- Read/written only by the server (service role): no RLS policies on purpose.
create table if not exists public.feature_flags (
  key             text primary key,
  enabled_default boolean not null default false,          -- true = everyone
  rollout_percent int not null default 0 check (rollout_percent between 0 and 100),
  note            text,
  updated_at      timestamptz not null default now()
);
create table if not exists public.feature_flag_overrides (
  flag_key   text not null references public.feature_flags(key) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  enabled    boolean not null,
  created_at timestamptz not null default now(),
  primary key (flag_key, user_id)
);
alter table public.feature_flags enable row level security;
alter table public.feature_flag_overrides enable row level security;
create index if not exists feature_flag_overrides_user_idx on public.feature_flag_overrides (user_id);

-- ───────────────────────── 017_billing_lapse.sql ─────────────────────────
-- When a paid subscription stops being paid (card declined, unpaid), remember
-- WHEN it lapsed. The public page is paused after a grace period; the owner's
-- panel keeps working so they can fix billing. Idempotent.
alter table public.profiles add column if not exists billing_lapsed_at timestamptz;
create index if not exists profiles_billing_lapsed_idx on public.profiles (billing_lapsed_at) where billing_lapsed_at is not null;

-- Owners must not be able to clear it themselves (same rule as the other billing columns).
create or replace function public.protect_billing_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'authenticated' then
    if new.plan is distinct from old.plan
       or new.stripe_customer_id is distinct from old.stripe_customer_id
       or new.stripe_subscription_id is distinct from old.stripe_subscription_id
       or new.stripe_subscription_status is distinct from old.stripe_subscription_status
       or new.plan_expires_at is distinct from old.plan_expires_at
       or new.billing_lapsed_at is distinct from old.billing_lapsed_at then
      raise exception 'not_allowed: billing fields are managed by the server';
    end if;
  end if;
  return new;
end;
$$;

-- ───────────────────────── 018_api_keys.sql ─────────────────────────
-- API keys for customer integrations (REST /api/v1 and the authenticated MCP
-- tier) + an audit log of everything those keys write. Idempotent.
--
-- The full key (`lh_` + 32 random bytes, base64url) is shown ONCE at creation
-- and never stored: only its SHA-256 hash and a short display prefix are.
-- Keys are looked up by the server with the service role; customers manage
-- their own rows through RLS (list, create, revoke), but cannot read the hash.

create table if not exists public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 60),
  key_prefix   text not null check (char_length(key_prefix) between 6 and 16),
  key_hash     text not null unique check (key_hash ~ '^[0-9a-f]{64}$'),
  scopes       text[] not null check (
    cardinality(scopes) between 1 and 6
    and scopes <@ array['pages:read','pages:write','knowledge:read','knowledge:write','analytics:read','payments:read']::text[]
  ),
  last_used_at timestamptz,
  expires_at   timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists api_keys_user_idx on public.api_keys (user_id, created_at desc);

alter table public.api_keys enable row level security;

drop policy if exists "Owners view their api keys" on public.api_keys;
create policy "Owners view their api keys" on public.api_keys for select to authenticated
  using (auth.uid() = user_id);
drop policy if exists "Owners create their api keys" on public.api_keys;
create policy "Owners create their api keys" on public.api_keys for insert to authenticated
  with check (auth.uid() = user_id and revoked_at is null);
drop policy if exists "Owners revoke their api keys" on public.api_keys;
create policy "Owners revoke their api keys" on public.api_keys for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- No delete policy: keys are revoked, not erased (the audit log keeps pointing at them).

-- Column-level privileges: the browser session can never read the hash, and the
-- only column it may change afterwards is revoked_at.
revoke all on public.api_keys from anon, authenticated;
grant select (id, user_id, name, key_prefix, scopes, last_used_at, expires_at, revoked_at, created_at) on public.api_keys to authenticated;
grant insert (user_id, name, key_prefix, key_hash, scopes, expires_at) on public.api_keys to authenticated;
grant update (revoked_at) on public.api_keys to authenticated;

-- A revoked key stays revoked, and a session can only ever SET revoked_at.
create or replace function public.protect_api_key_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'authenticated' then
    if old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at then
      raise exception 'not_allowed: a revoked key cannot be changed';
    end if;
    if new.revoked_at is null and old.revoked_at is not null then
      raise exception 'not_allowed: a revoked key cannot be re-enabled';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists api_keys_protect on public.api_keys;
create trigger api_keys_protect before update on public.api_keys
  for each row execute procedure public.protect_api_key_columns();

-- At most 10 active keys per account (enforced here too, not only in the API).
create or replace function public.limit_api_keys()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.api_keys
        where user_id = new.user_id and revoked_at is null and (expires_at is null or expires_at > now())) >= 10 then
    raise exception 'limit_exceeded: at most 10 active API keys per account';
  end if;
  return new;
end;
$$;
drop trigger if exists api_keys_limit on public.api_keys;
create trigger api_keys_limit before insert on public.api_keys
  for each row execute procedure public.limit_api_keys();

-- Audit log of what API keys changed. Written by the server (service role)
-- BEFORE each write is applied; owners can read their own entries, nobody can
-- edit or delete them through the API (no insert/update/delete policies).
create table if not exists public.api_key_audit (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  key_id     uuid references public.api_keys(id) on delete set null,
  action     text not null check (char_length(action) <= 60),     -- e.g. page.update_block
  target     text check (char_length(target) <= 120),             -- page id / block id / entry id
  detail     jsonb not null default '{}'::jsonb,                  -- field names and sizes, never content
  ip_hash    text,                                                -- truncated sha256, never the raw IP
  created_at timestamptz not null default now()
);
create index if not exists api_key_audit_user_idx on public.api_key_audit (user_id, created_at desc);
alter table public.api_key_audit enable row level security;
drop policy if exists "Owners view their api audit" on public.api_key_audit;
create policy "Owners view their api audit" on public.api_key_audit for select to authenticated
  using (auth.uid() = user_id);
revoke all on public.api_key_audit from anon;
revoke insert, update, delete on public.api_key_audit from authenticated;

-- ───────────────────────── 019_knowledge_base.sql ─────────────────────────
-- Business knowledge base: what the customer knows about their business, in one
-- place. PUBLIC entries feed the page's FAQ block, schema.org FAQPage and
-- llms.txt; PRIVATE entries (internal policies, scripts) are only available to
-- the owner's own assistants/integrations. Idempotent.
create table if not exists public.knowledge_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  page_id     uuid references public.pages(id) on delete cascade,   -- null = applies to all the owner's pages
  kind        text not null default 'faq' check (kind in ('faq', 'info', 'policy')),
  title       text not null check (char_length(title) between 1 and 200),    -- the question / topic
  content     text not null check (char_length(content) between 1 and 4000), -- the answer / details
  visibility  text not null default 'public' check (visibility in ('public', 'private')),
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists knowledge_entries_user_idx on public.knowledge_entries (user_id, position);
create index if not exists knowledge_entries_page_idx on public.knowledge_entries (page_id);

alter table public.knowledge_entries enable row level security;
drop policy if exists "Owners manage their knowledge" on public.knowledge_entries;
create policy "Owners manage their knowledge"
  on public.knowledge_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
-- Public entries of published pages are read by the server (service role) when
-- rendering; no anonymous policy on purpose.

drop trigger if exists knowledge_entries_updated_at on public.knowledge_entries;
create trigger knowledge_entries_updated_at before update on public.knowledge_entries
  for each row execute procedure public.set_updated_at();

-- Sane cap per customer so a runaway integration can't fill the table.
create or replace function public.limit_knowledge_entries() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.knowledge_entries where user_id = new.user_id) >= 300 then
    raise exception 'limit_exceeded: at most 300 knowledge entries per account';
  end if;
  return new;
end;
$$;
drop trigger if exists knowledge_entries_limit on public.knowledge_entries;
create trigger knowledge_entries_limit before insert on public.knowledge_entries
  for each row execute procedure public.limit_knowledge_entries();

-- ───────────────────────── 020_roadmap_votes.sql ─────────────────────────
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

-- ───────────────────────── 021_custom_domains.sql ─────────────────────────
-- Custom domains for customers' pages (manual activation flow).
-- A domain goes pending -> verified (DNS TXT proves ownership, checked by the
-- server) -> active (the platform owner added it to the hosting project and
-- confirmed it in /admin/domains). Only `active` domains are served.
--
-- Security: migration 001 let owners write any column of their own rows,
-- including `verified`. That policy is replaced: owners can read, add (always
-- as pending) and remove their domain; every status change is made by the
-- server with the service role.

alter table public.custom_domains add column if not exists status text not null default 'pending';
alter table public.custom_domains add column if not exists token text not null default replace(gen_random_uuid()::text, '-', '');
alter table public.custom_domains add column if not exists verified_at timestamptz;
alter table public.custom_domains add column if not exists activated_at timestamptz;
alter table public.custom_domains add column if not exists last_checked_at timestamptz;
alter table public.custom_domains add column if not exists last_error text;

alter table public.custom_domains drop constraint if exists custom_domains_status_check;
alter table public.custom_domains add constraint custom_domains_status_check check (status in ('pending', 'verified', 'active'));
alter table public.custom_domains drop constraint if exists custom_domains_domain_check;
alter table public.custom_domains add constraint custom_domains_domain_check
  check (char_length(domain) <= 253 and domain ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$');

drop policy if exists "Owners can manage domains" on public.custom_domains;
drop policy if exists "Owners read their domains" on public.custom_domains;
drop policy if exists "Owners add their domain" on public.custom_domains;
drop policy if exists "Owners remove their domain" on public.custom_domains;

create policy "Owners read their domains" on public.custom_domains for select
  using (exists (select 1 from public.pages p where p.id = custom_domains.page_id and p.user_id = auth.uid()));
create policy "Owners add their domain" on public.custom_domains for insert
  with check (
    status = 'pending' and verified = false and verified_at is null and activated_at is null
    and exists (select 1 from public.pages p where p.id = custom_domains.page_id and p.user_id = auth.uid())
  );
create policy "Owners remove their domain" on public.custom_domains for delete
  using (exists (select 1 from public.pages p where p.id = custom_domains.page_id and p.user_id = auth.uid()));
-- No UPDATE policy on purpose: status changes are server-side only.

create index if not exists custom_domains_active_idx on public.custom_domains (domain) where status = 'active';

-- ───────────────────────── 022_security_advisor_fixes.sql ─────────────────────────
-- Fixes reported by the Supabase security advisor after applying 001-021.
-- Idempotent.

-- 1) The two helper views from 001 were SECURITY DEFINER: they ran with the
--    creator's rights and bypassed RLS, so anyone with the anon key could read
--    every page / every analytics row through them. With security_invoker the
--    caller's RLS applies (the dashboard already filters by user_id).
alter view public.pages_summary set (security_invoker = on);
alter view public.analytics_summary set (security_invoker = on);

-- 2) Pin the search_path of the shared updated_at trigger function.
alter function public.set_updated_at() set search_path = public;

-- 3) Trigger functions must not be callable through /rest/v1/rpc. Triggers
--    fire regardless of EXECUTE privileges, so revoking is safe.
revoke execute on function
  public.enforce_plan_limits(),
  public.handle_new_user(),
  public.increment_page_views(),
  public.limit_api_keys(),
  public.limit_knowledge_entries(),
  public.limit_roadmap_votes(),
  public.protect_api_key_columns(),
  public.protect_billing_columns(),
  public.protect_moderation(),
  public.protect_page_server_columns(),
  public.throttle_public_inserts()
from public, anon, authenticated;

-- ───────────────────────── Verificación ─────────────────────────
-- Debe devolver 'ok' en todas las filas.
select 'tabla ' || t as comprobacion,
       case when to_regclass('public.' || t) is not null then 'ok' else 'FALTA' end as estado
from unnest(array['processed_webhook_events','admin_audit_log','payment_events','feature_flags','feature_flag_overrides','api_keys','api_key_audit','knowledge_entries','roadmap_votes','custom_domains']) as t
union all
select 'columna profiles.billing_lapsed_at',
       case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='billing_lapsed_at') then 'ok' else 'FALTA' end
union all
select 'columna custom_domains.status',
       case when exists (select 1 from information_schema.columns where table_schema='public' and table_name='custom_domains' and column_name='status') then 'ok' else 'FALTA' end;

commit;
