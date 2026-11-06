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
