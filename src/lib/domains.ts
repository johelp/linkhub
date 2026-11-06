// Custom domains: pure helpers (validation, DNS instructions, routing policy).
// No I/O here so everything is unit-testable; DNS and database access live in
// domains.server.ts.

export const VERIFY_LABEL = '_linkhub-verify'
export const CNAME_TARGET = 'cname.vercel-dns.com'
export const APEX_A_RECORD = '76.76.21.21'

// Second-level public suffixes common in our markets, so `midominio.com.ar` is
// recognised as a root domain. Not a full public-suffix list: when unsure we
// recommend a `www.` subdomain, which works with a plain CNAME everywhere.
const MULTI_LABEL_SUFFIXES = new Set(['com.ar', 'com.mx', 'com.es', 'com.br', 'com.co', 'com.pe', 'com.uy', 'com.ve', 'com.cl', 'co.uk', 'org.uk', 'org.ar', 'org.mx', 'gob.mx', 'gob.ar'])

export type DomainCheck = { ok: true; domain: string } | { ok: false; error: string }

/** Accepts "Https://WWW.Mi-Sitio.com/", "mi-sitio.com:443"... and returns the bare ASCII hostname. */
export function normalizeDomain(input: string, platformHosts: string[] = []): DomainCheck {
  let raw = (input ?? '').trim().toLowerCase()
  if (!raw) return { ok: false, error: 'Escribe tu dominio, por ejemplo www.tunegocio.com.' }
  if (raw.length > 253 * 2) return { ok: false, error: 'Ese dominio es demasiado largo.' }
  raw = raw.replace(/^[a-z]+:\/\//, '').split(/[/?#]/)[0]
  if (raw.includes('@') || /\s/.test(raw)) return { ok: false, error: 'Escribe solo el dominio, sin espacios ni correo.' }
  raw = raw.replace(/:\d+$/, '').replace(/\.$/, '')
  let host: string
  try { host = new URL(`http://${raw}`).hostname } catch { return { ok: false, error: 'Ese dominio no parece válido.' } }  // also converts IDN to punycode
  if (!host || host.length > 253) return { ok: false, error: 'Ese dominio no parece válido.' }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(':') || host.startsWith('[')) return { ok: false, error: 'Usa un nombre de dominio, no una dirección IP.' }
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(host)) return { ok: false, error: 'Ese dominio no parece válido.' }
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return { ok: false, error: 'Ese dominio no se puede usar.' }
  if (host.endsWith('.vercel.app') || host.endsWith('.vercel.dev')) return { ok: false, error: 'Usa un dominio que sea tuyo (por ejemplo www.tunegocio.com).' }
  if (platformHosts.some(h => h && (host === h || host.endsWith(`.${h}`)))) return { ok: false, error: 'Ese dominio pertenece a LinkHub.' }
  return { ok: true, domain: host }
}

export function isApexDomain(domain: string): boolean {
  const parts = domain.split('.')
  if (parts.length === 2) return true
  if (parts.length === 3 && MULTI_LABEL_SUFFIXES.has(parts.slice(1).join('.'))) return true
  return false
}

export interface DnsRecord { purpose: 'verify' | 'route'; type: 'TXT' | 'CNAME' | 'A'; name: string; value: string }

/** Records the customer must create at their registrar (name is relative to their zone when possible). */
export function dnsRecords(domain: string, token: string): DnsRecord[] {
  const apex = isApexDomain(domain)
  const label = apex ? '@' : domain.split('.').slice(0, -(domain.split('.').length > 2 && MULTI_LABEL_SUFFIXES.has(domain.split('.').slice(-2).join('.')) ? 3 : 2)).join('.')
  const verifyName = apex ? VERIFY_LABEL : `${VERIFY_LABEL}.${label}`
  return [
    { purpose: 'verify', type: 'TXT', name: verifyName, value: `linkhub-verify=${token}` },
    apex
      ? { purpose: 'route', type: 'A', name: '@', value: APEX_A_RECORD }
      : { purpose: 'route', type: 'CNAME', name: label, value: CNAME_TARGET },
  ]
}

/** Fully-qualified TXT host to query for a domain. */
export const verifyHost = (domain: string) => `${VERIFY_LABEL}.${domain}`

/** True if any TXT answer (a list of chunks per record) carries the expected token. */
export function txtMatches(answers: string[][], token: string): boolean {
  const want = `linkhub-verify=${token}`
  return answers.some(chunks => chunks.join('').trim() === want)
}

// ─── Routing policy for customer hosts ───────────────────────────
// A request on a customer's own domain may only reach the public page and the
// endpoints that page needs. Everything else (dashboard, editor, admin, auth,
// the rest of the API) is not served there.
export type HostRoute = { kind: 'rewrite'; path: string } | { kind: 'pass' } | { kind: 'deny' }

const PAGE_FILES = new Set(['/llms.txt', '/facts.json', '/contact.vcf', '/opengraph-image'])
const PASS_PREFIXES = ['/_next/', '/api/pay/', '/api/subscribers', '/api/loyalty', '/api/tickets', '/t/']

export function routeForCustomerHost(pathname: string, slug: string): HostRoute {
  if (pathname === '/' || pathname === '') return { kind: 'rewrite', path: `/p/${slug}` }
  if (PAGE_FILES.has(pathname)) return { kind: 'rewrite', path: `/p/${slug}${pathname}` }
  if (pathname === '/favicon.ico' || PASS_PREFIXES.some(p => pathname.startsWith(p))) return { kind: 'pass' }
  return { kind: 'deny' }
}

/** Hosts that belong to the platform itself (never looked up as customer domains). */
export function isPlatformHost(host: string, platformHosts: string[]): boolean {
  const h = host.toLowerCase().replace(/:\d+$/, '')
  return !h || h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.vercel.app') || platformHosts.some(p => p && h === p.toLowerCase())
}
