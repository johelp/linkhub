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
