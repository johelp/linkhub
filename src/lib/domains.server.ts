import { promises as dns } from 'node:dns'
import { createAdminClient } from '@/lib/supabase/admin'
import { isPlatformHost, txtMatches, verifyHost } from '@/lib/domains'

/** Hosts that are the platform itself: the configured app URL and Vercel's own. */
export function platformHosts(): string[] {
  const hosts: string[] = []
  for (const v of [process.env.NEXT_PUBLIC_APP_URL, process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) {
    if (!v) continue
    try { hosts.push(new URL(v.startsWith('http') ? v : `https://${v}`).hostname) } catch { /* ignore */ }
  }
  return hosts
}
export const isPlatform = (host: string) => isPlatformHost(host, platformHosts())

// ─── Host -> page lookup (used by proxy.ts on every customer-domain request) ───
// Short in-memory cache per server instance: a domain switched on/off in the
// admin panel takes effect within TTL seconds. Misses are cached too, so a
// scanner hammering random hosts doesn't turn into database load.
const HIT_TTL = 60_000, MISS_TTL = 30_000
const cache = new Map<string, { slug: string | null; until: number }>()

export async function lookupActiveSlug(host: string): Promise<string | null> {
  const h = host.toLowerCase().replace(/:\d+$/, '')
  const hit = cache.get(h)
  if (hit && hit.until > Date.now()) return hit.slug
  let slug: string | null = null
  try {
    const { data } = await createAdminClient().from('custom_domains' as never)
      .select('page_id, pages(slug, published)').eq('domain' as never, h as never).eq('status' as never, 'active' as never).maybeSingle()
    const row = data as unknown as { pages: { slug: string; published: boolean } | { slug: string; published: boolean }[] | null } | null
    const page = Array.isArray(row?.pages) ? row?.pages[0] : row?.pages
    slug = page?.published ? page.slug : null
  } catch { slug = null }
  if (cache.size > 2000) cache.clear()
  cache.set(h, { slug, until: Date.now() + (slug ? HIT_TTL : MISS_TTL) })
  return slug
}

/** Active custom domain of a page (for canonical URLs), or null. */
export async function activeDomainOfPage(pageId: string): Promise<string | null> {
  try {
    const { data } = await createAdminClient().from('custom_domains' as never).select('domain').eq('page_id' as never, pageId as never).eq('status' as never, 'active' as never).maybeSingle()
    return (data as unknown as { domain: string } | null)?.domain ?? null
  } catch { return null }
}

// ─── Ownership check ───────────────────────────────────────────
export type TxtResolver = (host: string) => Promise<string[][]>

export async function checkOwnership(domain: string, token: string, resolve: TxtResolver = h => dns.resolveTxt(h)): Promise<{ ok: boolean; error?: string }> {
  try {
    const answers = await resolve(verifyHost(domain))
    return txtMatches(answers, token) ? { ok: true } : { ok: false, error: 'Encontramos el registro TXT, pero el valor no coincide. Copia el valor exacto.' }
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === 'ENOTFOUND' || code === 'ENODATA') return { ok: false, error: 'Todavía no vemos el registro TXT. Los cambios de DNS pueden tardar unos minutos (a veces hasta unas horas).' }
    return { ok: false, error: 'No hemos podido consultar el DNS ahora mismo. Inténtalo de nuevo en un momento.' }
  }
}
