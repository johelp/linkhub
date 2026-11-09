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
