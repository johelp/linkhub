import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'

// Single guard for every admin API route: re-checks the session server-side on
// each call (never trust the UI being hidden).
export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const
  return { user, email: user.email!, admin: createAdminClient() } as const
}

export async function audit(admin: ReturnType<typeof createAdminClient>, actor: string, action: string, target?: string, detail?: Record<string, unknown>) {
  try { await admin.from('admin_audit_log' as never).insert({ actor_email: actor, action, target: target ?? null, detail: detail ?? null } as never) } catch { /* table pending migration 013 */ }
}
