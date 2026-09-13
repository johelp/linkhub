import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'

// Admin-only: manually move a user between Free/Pro (ver SETUP.md § 9 --
// esto reemplaza la query SQL manual por un botón). Re-checks the caller is
// an admin server-side on every call -- the /admin route being gated is not
// enough on its own for an endpoint that writes someone else's billing
// plan. Uses the service-role client because `profiles.plan` is protected
// from normal user sessions by the trigger in migration 005 -- by design,
// only the service role (or raw SQL) can write it.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { userId, plan } = body as { userId?: string; plan?: string }
  if (!userId || (plan !== 'free' && plan !== 'pro')) {
    return NextResponse.json({ error: 'userId y plan (free|pro) son requeridos' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ plan, ...(plan === 'pro' ? { plan_expires_at: null } : {}) })
    .eq('id', userId)

  if (error) {
    console.error('admin set-plan error', error)
    return NextResponse.json({ error: 'No se pudo actualizar el plan' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
