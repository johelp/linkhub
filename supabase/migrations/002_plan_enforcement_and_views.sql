-- ─────────────────────────────────────────────────────────────────
-- LinkHub — Plan enforcement + views counter fix
-- Run this in: Supabase Dashboard → SQL Editor (after 001_initial_schema.sql)
-- ─────────────────────────────────────────────────────────────────

-- ─── VIEWS COUNTER ───────────────────────────────────────────────
-- pages.views was never incremented anywhere (dashboard always showed 0).
-- Increment it from the analytics_events insert (public can insert 'view' events).
create or replace function public.increment_page_views()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.event_type = 'view' then
    update public.pages set views = views + 1 where id = new.page_id;
  end if;
  return new;
end;
$$;

create trigger analytics_increment_views
  after insert on public.analytics_events
  for each row execute procedure public.increment_page_views();

-- ─── PLAN LIMITS ─────────────────────────────────────────────────
-- Plan limits (page count, advanced blocks) were only enforced in the UI
-- and in the Next.js API route. Since RLS lets an authenticated user call
-- the Supabase REST API directly (bypassing our app), the real boundary
-- has to live here.
create or replace function public.enforce_plan_limits()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  user_plan text;
  page_count int;
  page_limit int;
  block jsonb;
  advanced_blocks text[] := array['featured','expandable','social_grid','contact_card','image_banner','text'];
begin
  select plan into user_plan from public.profiles where id = new.user_id;
  user_plan := coalesce(user_plan, 'free');

  if tg_op = 'INSERT' then
    page_limit := case user_plan when 'free' then 1 else 999999 end;
    select count(*) into page_count from public.pages where user_id = new.user_id;
    if page_count >= page_limit then
      raise exception 'plan_limit_exceeded: % plan allows at most % page(s)', user_plan, page_limit;
    end if;
  end if;

  if user_plan = 'free' and new.blocks is not null then
    for block in select * from jsonb_array_elements(new.blocks)
    loop
      if (block->>'type') = any(advanced_blocks) then
        raise exception 'plan_limit_exceeded: block type % requires Pro plan', block->>'type';
      end if;
    end loop;
  end if;

  return new;
end;
$$;

create trigger pages_enforce_plan_limits
  before insert or update on public.pages
  for each row execute procedure public.enforce_plan_limits();
