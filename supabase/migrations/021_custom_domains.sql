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
