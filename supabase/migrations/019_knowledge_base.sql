-- Business knowledge base: what the customer knows about their business, in one
-- place. PUBLIC entries feed the page's FAQ block, schema.org FAQPage and
-- llms.txt; PRIVATE entries (internal policies, scripts) are only available to
-- the owner's own assistants/integrations. Idempotent.
create table if not exists public.knowledge_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  page_id     uuid references public.pages(id) on delete cascade,   -- null = applies to all the owner's pages
  kind        text not null default 'faq' check (kind in ('faq', 'info', 'policy')),
  title       text not null check (char_length(title) between 1 and 200),    -- the question / topic
  content     text not null check (char_length(content) between 1 and 4000), -- the answer / details
  visibility  text not null default 'public' check (visibility in ('public', 'private')),
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists knowledge_entries_user_idx on public.knowledge_entries (user_id, position);
create index if not exists knowledge_entries_page_idx on public.knowledge_entries (page_id);

alter table public.knowledge_entries enable row level security;
drop policy if exists "Owners manage their knowledge" on public.knowledge_entries;
create policy "Owners manage their knowledge"
  on public.knowledge_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
-- Public entries of published pages are read by the server (service role) when
-- rendering; no anonymous policy on purpose.

drop trigger if exists knowledge_entries_updated_at on public.knowledge_entries;
create trigger knowledge_entries_updated_at before update on public.knowledge_entries
  for each row execute procedure public.set_updated_at();

-- Sane cap per customer so a runaway integration can't fill the table.
create or replace function public.limit_knowledge_entries() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.knowledge_entries where user_id = new.user_id) >= 300 then
    raise exception 'limit_exceeded: at most 300 knowledge entries per account';
  end if;
  return new;
end;
$$;
drop trigger if exists knowledge_entries_limit on public.knowledge_entries;
create trigger knowledge_entries_limit before insert on public.knowledge_entries
  for each row execute procedure public.limit_knowledge_entries();
