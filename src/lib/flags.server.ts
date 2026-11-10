import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import { FLAG_KEYS, resolveFlags, type FlagMap, type FlagRow } from '@/lib/flags'

// Loaded with the service role (the flag tables have no RLS policies). If the
// tables aren't there yet (migration 016 pending) we fall back to the
// declared defaults, so deploying code before the migration is safe.
export const getFlagsForUser = cache(async (userId: string, email?: string | null): Promise<FlagMap> => {
  const admin = createAdminClient()
  const [rows, overrides] = await Promise.all([
    admin.from('feature_flags' as never).select('key, enabled_default, rollout_percent'),
    admin.from('feature_flag_overrides' as never).select('flag_key, enabled').eq('user_id' as never, userId as never),
  ])
  const flagRows = rows.error ? [] : ((rows.data ?? []) as unknown as FlagRow[])
  const ov = overrides.error ? [] : ((overrides.data ?? []) as unknown as { flag_key: string; enabled: boolean }[])
  return resolveFlags(userId, flagRows, ov, isAdminEmail(email))
})

export async function listFlagConfig() {
  const admin = createAdminClient()
  const [rows, overrides] = await Promise.all([
    admin.from('feature_flags' as never).select('key, enabled_default, rollout_percent, note'),
    admin.from('feature_flag_overrides' as never).select('flag_key, user_id, enabled, created_at, profiles(email)'),
  ])
  return {
    ready: !rows.error,
    rowsError: rows.error ?? null,
    rows: (rows.error ? [] : rows.data ?? []) as unknown as (FlagRow & { note: string | null })[],
    overrides: (overrides.error ? [] : overrides.data ?? []) as unknown as { flag_key: string; user_id: string; enabled: boolean; created_at: string; profiles: { email: string } | { email: string }[] | null }[],
  }
}
export { FLAG_KEYS }
