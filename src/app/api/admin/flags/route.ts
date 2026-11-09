import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, audit } from '@/lib/admin.server'
import { FLAG_KEYS, type FlagKey } from '@/lib/flags'

export async function POST(request: NextRequest) {
  const a = await requireAdmin()
  if ('error' in a) return a.error
  const b = await request.json().catch(() => ({})) as { key?: string; enabled_default?: boolean; rollout_percent?: number; note?: string }
  if (!b.key || !FLAG_KEYS.includes(b.key as FlagKey)) return NextResponse.json({ error: 'Flag desconocido' }, { status: 400 })
  const pct = Math.round(Number(b.rollout_percent ?? 0))
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) return NextResponse.json({ error: 'El porcentaje va de 0 a 100' }, { status: 400 })
  const { error } = await a.admin.from('feature_flags' as never).upsert({ key: b.key, enabled_default: !!b.enabled_default, rollout_percent: pct, note: (b.note ?? '').slice(0, 200) || null, updated_at: new Date().toISOString() } as never)
  if (error) return NextResponse.json({ error: 'No se pudo guardar (¿aplicaste la migración 016?)' }, { status: 500 })
  await audit(a.admin, a.email, 'flag.set', b.key, { enabled_default: !!b.enabled_default, rollout_percent: pct })
  return NextResponse.json({ ok: true })
}
