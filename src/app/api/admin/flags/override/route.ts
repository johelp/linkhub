import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, audit } from '@/lib/admin.server'
import { FLAG_KEYS, type FlagKey } from '@/lib/flags'

// Enable/disable a feature for ONE customer (pilot), or clear the override (enabled = null).
export async function POST(request: NextRequest) {
  const a = await requireAdmin()
  if ('error' in a) return a.error
  const b = await request.json().catch(() => ({})) as { key?: string; email?: string; enabled?: boolean | null }
  if (!b.key || !FLAG_KEYS.includes(b.key as FlagKey) || !b.email) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  const { data: profile } = await a.admin.from('profiles').select('id, email').ilike('email', b.email.trim()).maybeSingle()
  if (!profile) return NextResponse.json({ error: 'No existe un cliente con ese email' }, { status: 404 })

  // The flag row must exist for the foreign key; create it with defaults if needed.
  await a.admin.from('feature_flags' as never).upsert({ key: b.key } as never, { onConflict: 'key', ignoreDuplicates: true } as never)
  const res = b.enabled === null || b.enabled === undefined
    ? await a.admin.from('feature_flag_overrides' as never).delete().eq('flag_key' as never, b.key as never).eq('user_id' as never, profile.id as never)
    : await a.admin.from('feature_flag_overrides' as never).upsert({ flag_key: b.key, user_id: profile.id, enabled: b.enabled } as never)
  if (res.error) return NextResponse.json({ error: 'No se pudo guardar (¿aplicaste la migración 016?)' }, { status: 500 })
  await audit(a.admin, a.email, 'flag.override', `${b.key}:${profile.email}`, { enabled: b.enabled ?? null })
  return NextResponse.json({ ok: true })
}
