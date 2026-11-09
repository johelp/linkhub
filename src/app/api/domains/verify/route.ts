import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkOwnership } from '@/lib/domains.server'
import { requireDomainAccess } from '@/lib/domainsApi.server'
import { createLimiter } from '@/lib/aiDraft'

const allowCheck = createLimiter(30, 60 * 60 * 1000)

// "Comprobar ahora": looks for the TXT proof in the domain's DNS. On success the
// domain becomes `verified` (still not served until the platform owner activates it).
export async function POST(request: NextRequest) {
  const g = await requireDomainAccess()
  if ('error' in g) return g.error
  if (!allowCheck(g.user.id)) return NextResponse.json({ error: 'Demasiadas comprobaciones. Espera un rato.' }, { status: 429 })

  const body = await request.json().catch(() => ({})) as { id?: unknown }
  if (typeof body.id !== 'string') return NextResponse.json({ error: 'Falta el id' }, { status: 400 })
  // Read through the caller's session: RLS guarantees it is their own domain.
  const { data } = await g.supabase.from('custom_domains' as never).select('id, domain, token, status').eq('id' as never, body.id as never).maybeSingle()
  const row = data as unknown as { id: string; domain: string; token: string; status: string } | null
  if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (row.status !== 'pending') return NextResponse.json({ ok: true, status: row.status })

  const res = await checkOwnership(row.domain, row.token)
  const admin = createAdminClient()
  const now = new Date().toISOString()
  if (res.ok) {
    await admin.from('custom_domains' as never).update({ status: 'verified', verified: true, verified_at: now, last_checked_at: now, last_error: null } as never).eq('id' as never, row.id as never)
    return NextResponse.json({ ok: true, status: 'verified' })
  }
  await admin.from('custom_domains' as never).update({ last_checked_at: now, last_error: res.error ?? null } as never).eq('id' as never, row.id as never)
  return NextResponse.json({ ok: false, status: 'pending', error: res.error })
}
