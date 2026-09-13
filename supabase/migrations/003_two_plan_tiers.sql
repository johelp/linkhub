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
