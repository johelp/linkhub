import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptSecret } from '@/lib/crypto'
import { validateCredentialsShape } from '@/lib/payments/redsys'

// Redsys has no OAuth: the seller pastes the data their bank gave them. The
// secret key is encrypted at rest and never sent back to the browser.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const merchantCode = String(body.merchantCode ?? '').trim()
  const terminal = String(body.terminal ?? '1').trim()
  const secret = String(body.secret ?? '').trim()
  const environment = body.environment === 'live' ? 'live' : 'test'
  const problem = validateCredentialsShape({ merchantCode, terminal, secret })
  if (problem) return NextResponse.json({ error: problem }, { status: 400 })

  const { error } = await createAdminClient().from('payment_connections').upsert({
    user_id: user.id, provider: 'redsys', provider_user_id: merchantCode,
    access_token: encryptSecret(secret), refresh_token: 'n/a', live_mode: environment === 'live',
    config: { terminal, environment },
  }, { onConflict: 'user_id,provider' })
  if (error) { console.error('redsys connect error', error); return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}
