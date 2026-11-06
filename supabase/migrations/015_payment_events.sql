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
