-- ─────────────────────────────────────────────────────────────────
-- LinkHub — Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────────
create table public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  email         text not null,
  full_name     text,
  avatar_url    text,
  plan          text not null default 'free' check (plan in ('free','pro','agency')),
  plan_expires_at timestamptz,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── PAGES ───────────────────────────────────────────────────────
create table public.pages (
  id            uuid default uuid_generate_v4() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  slug          text unique not null,
  name          text not null,
  settings      jsonb not null default '{
    "defaultLang": "es",
    "enabledLangs": ["es"],
    "seasonMode": "always",
    "primaryColor": "#E8150A",
    "backgroundColor": "#F6F6F5",
    "fontFamily": "DM Sans",
    "showPoweredBy": true,
    "seo": {
      "title": "",
      "description": "",
      "ogImage": null
    }
  }',
  blocks        jsonb not null default '[]',
  published     boolean default false not null,
  qr_url        text,
  custom_domain text unique,
  views         integer default 0 not null,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

alter table public.pages enable row level security;

-- Owners can do anything
create policy "Owners can manage own pages"
  on public.pages for all using (auth.uid() = user_id);

-- Public can read published pages (for /p/[slug] route)
create policy "Public can view published pages"
  on public.pages for select using (published = true);

-- Slug validation: lowercase letters, numbers, hyphens
alter table public.pages
  add constraint slug_format check (slug ~ '^[a-z0-9][a-z0-9\-]{1,60}[a-z0-9]$');

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger pages_updated_at
  before update on public.pages
  for each row execute procedure public.set_updated_at();

-- ─── ANALYTICS EVENTS ────────────────────────────────────────────
create table public.analytics_events (
  id          uuid default uuid_generate_v4() primary key,
  page_id     uuid references public.pages(id) on delete cascade not null,
  event_type  text not null check (event_type in ('view','click')),
  block_id    text,
  block_type  text,
  url         text,
  lang        text default 'es',
  country     text,
  device      text check (device in ('mobile','tablet','desktop')),
  referrer    text,
  created_at  timestamptz default now() not null
);

-- Partitioned by month for performance (optional, add later)
-- Analytics insert is public (anonymous tracking)
alter table public.analytics_events enable row level security;

create policy "Public can insert analytics"
  on public.analytics_events for insert with check (true);

create policy "Owners can view analytics"
  on public.analytics_events for select
  using (
    exists (
      select 1 from public.pages
      where pages.id = analytics_events.page_id
      and pages.user_id = auth.uid()
    )
  );

-- Index for dashboard queries
create index analytics_page_created on public.analytics_events(page_id, created_at desc);

-- ─── DOMAINS ─────────────────────────────────────────────────────
create table public.custom_domains (
  id         uuid default uuid_generate_v4() primary key,
  page_id    uuid references public.pages(id) on delete cascade unique,
  domain     text unique not null,
  verified   boolean default false,
  txt_record text,
  created_at timestamptz default now()
);

alter table public.custom_domains enable row level security;

create policy "Owners can manage domains"
  on public.custom_domains for all
  using (
    exists (
      select 1 from public.pages
      where pages.id = custom_domains.page_id
      and pages.user_id = auth.uid()
    )
  );

-- ─── HELPER VIEWS ────────────────────────────────────────────────
-- Page summary for dashboard (without full blocks JSON)
create or replace view public.pages_summary as
  select
    p.id,
    p.user_id,
    p.slug,
    p.name,
    p.published,
    p.views,
    p.settings->>'primaryColor' as primary_color,
    p.settings->>'defaultLang' as default_lang,
    jsonb_array_length(p.blocks) as block_count,
    p.created_at,
    p.updated_at
  from public.pages p;

-- Analytics 30-day summary per page
create or replace view public.analytics_summary as
  select
    page_id,
    count(*) filter (where event_type = 'view') as views_30d,
    count(*) filter (where event_type = 'click') as clicks_30d,
    count(distinct country) as countries,
    date_trunc('day', created_at) as day
  from public.analytics_events
  where created_at > now() - interval '30 days'
  group by page_id, date_trunc('day', created_at);

-- ─── STORAGE BUCKETS (run in Storage section or here) ────────────
-- insert into storage.buckets (id, name, public) values ('page-assets', 'page-assets', true);

-- Storage policy (set in Supabase dashboard)
-- Allow authenticated users to upload to their own folder: user_id/*
