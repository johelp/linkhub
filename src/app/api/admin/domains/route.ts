import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, audit } from '@/lib/admin.server'

// Admin-only: switch a verified domain on (after adding it to the hosting
// project) or off. Only `active` domains are served by proxy.ts.
export async function POST(request: NextRequest) {
  const a = await requireAdmin()
  if ('error' in a) return a.error
  const body = await request.json().catch(() => ({})) as { id?: unknown; action?: unknown }
  if (typeof body.id !== 'string' || (body.action !== 'activate' && body.action !== 'deactivate')) return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 })

  const { data } = await a.admin.from('custom_domains' as never).select('id, domain, status').eq('id' as never, body.id as never).maybeSingle()
  const row = data as unknown as { id: string; domain: string; status: string } | null
  if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  if (body.action === 'activate') {
    if (row.status === 'pending') return NextResponse.json({ error: 'El cliente aún no ha verificado el dominio (registro TXT).' }, { status: 409 })
    await a.admin.from('custom_domains' as never).update({ status: 'active', activated_at: new Date().toISOString() } as never).eq('id' as never, row.id as never)
  } else {
    await a.admin.from('custom_domains' as never).update({ status: 'verified', activated_at: null } as never).eq('id' as never, row.id as never)
  }
  await audit(a.admin, a.email, `domain.${body.action}`, row.domain)
  return NextResponse.json({ ok: true })
}
