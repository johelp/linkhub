-- Fixes reported by the Supabase security advisor after applying 001-021.
-- Idempotent.

-- 1) The two helper views from 001 were SECURITY DEFINER: they ran with the
--    creator's rights and bypassed RLS, so anyone with the anon key could read
--    every page / every analytics row through them. With security_invoker the
--    caller's RLS applies (the dashboard already filters by user_id).
alter view public.pages_summary set (security_invoker = on);
alter view public.analytics_summary set (security_invoker = on);

-- 2) Pin the search_path of the shared updated_at trigger function.
alter function public.set_updated_at() set search_path = public;

-- 3) Trigger functions must not be callable through /rest/v1/rpc. Triggers
--    fire regardless of EXECUTE privileges, so revoking is safe.
revoke execute on function
  public.enforce_plan_limits(),
  public.handle_new_user(),
  public.increment_page_views(),
  public.limit_api_keys(),
  public.limit_knowledge_entries(),
  public.limit_roadmap_votes(),
  public.protect_api_key_columns(),
  public.protect_billing_columns(),
  public.protect_moderation(),
  public.protect_page_server_columns(),
  public.throttle_public_inserts()
from public, anon, authenticated;
