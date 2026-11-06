import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PROVIDERS = ['mercadopago', 'stripe', 'redsys']

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { provider } = await request.json().catch(() => ({})) as { provider?: string }
  if (!provider || !PROVIDERS.includes(provider)) return NextResponse.json({ error: 'provider inválido' }, { status: 400 })
  const { error } = await createAdminClient().from('payment_connections').delete().eq('user_id', user.id).eq('provider', provider)
  if (error) { console.error('disconnect error', error); return NextResponse.json({ error: 'No se pudo desconectar' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}
