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
