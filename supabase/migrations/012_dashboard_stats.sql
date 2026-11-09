-- Aggregated analytics for the customer dashboard. SECURITY INVOKER on purpose:
-- the caller's RLS applies (owners only see events of their own pages) and the
-- aggregation happens in Postgres, so it isn't capped by the REST row limit.

create or replace function public.owner_daily_stats(days int default 60)
returns table (day date, page_id uuid, views bigint, clicks bigint)
language sql stable security invoker set search_path = public as $$
  select e.created_at::date, e.page_id,
         count(*) filter (where e.event_type = 'view'),
         count(*) filter (where e.event_type = 'click')
  from public.analytics_events e
  join public.pages p on p.id = e.page_id
  where p.user_id = auth.uid()
    and e.created_at >= now() - make_interval(days => least(greatest(days, 1), 365))
  group by 1, 2;
$$;

create or replace function public.owner_top_blocks(days int default 30, lim int default 8)
returns table (page_id uuid, block_id text, block_type text, clicks bigint)
language sql stable security invoker set search_path = public as $$
  select e.page_id, e.block_id, e.block_type, count(*)
  from public.analytics_events e
  join public.pages p on p.id = e.page_id
  where p.user_id = auth.uid() and e.event_type = 'click' and e.block_id is not null
    and e.created_at >= now() - make_interval(days => least(greatest(days, 1), 365))
  group by 1, 2, 3
  order by 4 desc
  limit least(greatest(lim, 1), 50);
$$;

create or replace function public.owner_device_stats(days int default 30)
returns table (device text, views bigint)
language sql stable security invoker set search_path = public as $$
  select coalesce(e.device, 'desktop'), count(*)
  from public.analytics_events e
  join public.pages p on p.id = e.page_id
  where p.user_id = auth.uid() and e.event_type = 'view'
    and e.created_at >= now() - make_interval(days => least(greatest(days, 1), 365))
  group by 1;
$$;

revoke all on function public.owner_daily_stats(int), public.owner_top_blocks(int, int), public.owner_device_stats(int) from public, anon;
grant execute on function public.owner_daily_stats(int), public.owner_top_blocks(int, int), public.owner_device_stats(int) to authenticated;
