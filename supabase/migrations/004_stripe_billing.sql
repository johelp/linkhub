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
