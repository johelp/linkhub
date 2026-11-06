import { NextRequest, NextResponse } from 'next/server'
import { normalizeDomain } from '@/lib/domains'
import { platformHosts } from '@/lib/domains.server'
import { requireDomainAccess } from '@/lib/domainsApi.server'
import { createLimiter } from '@/lib/aiDraft'

const allowAdd = createLimiter(10, 60 * 60 * 1000)

// Add a domain to one of the caller's pages. It starts as `pending`: nothing is
// served until ownership is proven (TXT) and the platform owner activates it.
export async function POST(request: NextRequest) {
  const g = await requireDomainAccess()
  if ('error' in g) return g.error
  if (!allowAdd(g.user.id)) return NextResponse.json({ error: 'Demasiados intentos. Prueba más tarde.' }, { status: 429 })

  let body: { pageId?: unknown; domain?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }
  if (typeof body.pageId !== 'string' || typeof body.domain !== 'string') return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 })
  const check = normalizeDomain(body.domain, platformHosts())
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 })

  // Ownership of the page is enforced by RLS on the insert (policy "Owners add their domain").
  const { data, error } = await g.supabase.from('custom_domains' as never)
    .insert({ page_id: body.pageId, domain: check.domain } as never).select('id, domain, status, token').single()
  if (error) {
    if ((error as { code?: string }).code === '23505') return NextResponse.json({ error: 'Ese dominio ya está en uso, o esta página ya tiene un dominio. Quita el actual para añadir otro.' }, { status: 409 })
    return NextResponse.json({ error: 'No se pudo añadir el dominio.' }, { status: 400 })
  }
  return NextResponse.json({ ok: true, domain: data })
}

export async function DELETE(request: NextRequest) {
  const g = await requireDomainAccess()
  if ('error' in g) return g.error
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })
  const { error } = await g.supabase.from('custom_domains' as never).delete().eq('id' as never, id as never)   // RLS: owner only
  if (error) return NextResponse.json({ error: 'No se pudo quitar el dominio.' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
