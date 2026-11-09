import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFlagsForUser } from '@/lib/flags.server'
import { PLAN_LIMITS, type Plan } from '@/types'

// Shared guard for the customer domain endpoints: signed in, flag on, Pro plan.
export async function requireDomainAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const
  const flags = await getFlagsForUser(user.id, user.email)
  if (!flags.custom_domain) return { error: NextResponse.json({ error: 'Función no disponible' }, { status: 403 }) } as const
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  const plan = ((profile as { plan?: Plan } | null)?.plan ?? 'free') as Plan
  if (!PLAN_LIMITS[plan].customDomain) return { error: NextResponse.json({ error: 'El dominio propio es una función del plan Pro.' }, { status: 402 }) } as const
  return { supabase, user } as const
}
