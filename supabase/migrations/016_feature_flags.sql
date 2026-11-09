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
