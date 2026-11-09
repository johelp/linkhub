-- Security hardening (audit SEC-004/005/006). Apply with `supabase db push`
-- or paste in the SQL editor. Idempotent.

-- 1) Storage: cap size and restrict MIME types on the public images bucket
--    (client-side checks are advisory only; SVG/HTML could otherwise be hosted
--    on the project's domain).
update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
 where id = 'images';

-- 2) Public inserts: only against published pages, with sane field shapes.
drop policy if exists "Public can insert analytics" on public.analytics_events;
create policy "Public can insert analytics"
  on public.analytics_events for insert
  with check (
    exists (select 1 from public.pages p where p.id = page_id and p.published)
    and char_length(coalesce(url, ''))      <= 2048
    and char_length(coalesce(referrer, '')) <= 2048
    and char_length(coalesce(block_id, '')) <= 64
  );

drop policy if exists "Public can subscribe" on public.email_subscribers;
create policy "Public can subscribe"
  on public.email_subscribers for insert
  with check (
    exists (select 1 from public.pages p where p.id = page_id and p.published)
    and char_length(email) between 5 and 254
    and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

-- 3) Owners must not be able to claim a custom domain by editing their own
--    row through the REST API. (`views` is deliberately NOT protected here:
--    the increment_page_views() trigger updates it in the session of whoever
--    fires the analytics insert, including a logged-in owner.)
create or replace function public.protect_page_server_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'authenticated' then
    if new.custom_domain is distinct from old.custom_domain then
      raise exception 'not_allowed: custom_domain is managed by the server';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists pages_protect_server_columns on public.pages;
create trigger pages_protect_server_columns
  before update on public.pages
  for each row execute procedure public.protect_page_server_columns();

-- 4) The plan-limit trigger only knew 6 "advanced" blocks; keep it in sync
--    with FREE_BLOCKS in src/types (free = link, section_label, divider).
create or replace function public.enforce_plan_limits()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  user_plan text;
  page_count int;
  page_limit int;
  block jsonb;
  free_blocks text[] := array['link','section_label','divider'];
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
      if not ((block->>'type') = any(free_blocks)) then
        raise exception 'plan_limit_exceeded: block type % requires Pro plan', block->>'type';
      end if;
    end loop;
  end if;

  return new;
end;
$$;
