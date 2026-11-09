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
