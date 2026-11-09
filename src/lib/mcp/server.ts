import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { getOwnerAvailability } from '@/lib/billing.server'
import { getFlagsForUser } from '@/lib/flags.server'
import { createLimiter, AUTH_FAIL_LIMIT, KEY_LIMIT, PUBLIC_LIMIT } from './rateLimit'
import { createOwnerStore, createPublicStore, type LooseDb } from './store'
import { authenticate, type AuthDeps } from './auth'
import { hasScope, type ApiKeyRow, type Scope } from './apiKeys'
import type { AuditEntry, McpDeps, Principal } from './types'

// Wiring of the pure MCP/REST logic to Supabase (service role) and Next.
// Module-level singletons = per-instance rate-limit state (see rateLimit.ts).
const publicLimiter = createLimiter(PUBLIC_LIMIT)
const keyLimiter = createLimiter(KEY_LIMIT)
const failLimiter = createLimiter(AUTH_FAIL_LIMIT)

const db = () => createAdminClient() as unknown as LooseDb

export const baseUrl = () => (process.env.NEXT_PUBLIC_APP_URL || 'https://linkhub.app').replace(/\/$/, '')

/** Client IP as set by the platform proxy (Vercel overwrites x-forwarded-for). */
export function clientIp(req: Request): string {
  const h = req.headers
  return (h.get('x-vercel-forwarded-for') || h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || 'unknown').trim().slice(0, 64)
}

async function audit(e: AuditEntry) {
  const ipHash = crypto.createHash('sha256').update(e.ip).digest('hex').slice(0, 16) // no raw IPs in the log
  const { error } = await db().from('api_key_audit').insert({ user_id: e.userId, key_id: e.keyId, action: e.action, target: e.target ?? null, detail: e.detail ?? {}, ip_hash: ipHash })
  if (error) { console.error('api_key_audit insert failed', error); throw new Error('audit_failed') }
}

export function authDeps(): AuthDeps {
  return {
    failLimiter,
    async findKeyByHash(hash) {
      const { data } = await db().from('api_keys').select('id, user_id, name, key_prefix, key_hash, scopes, last_used_at, expires_at, revoked_at').eq('key_hash', hash).maybeSingle()
      return (data as ApiKeyRow | null) ?? null
    },
    async getUserEmail(userId) {
      const { data } = await db().from('profiles').select('email').eq('id', userId).maybeSingle()
      return (data as { email?: string } | null)?.email ?? null
    },
    async developerApiEnabled(userId, email) {
      return (await getFlagsForUser(userId, email)).developer_api
    },
    async touch(keyId) {
      await db().from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyId)
    },
  }
}

export function mcpDeps(authenticated: boolean): McpDeps {
  const d = db()
  return {
    baseUrl: baseUrl(),
    limiter: authenticated ? keyLimiter : publicLimiter,
    publicStore: createPublicStore(d, getOwnerAvailability),
    owner: createOwnerStore(d),
    getFlags: async (userId) => {
      const { data } = await d.from('profiles').select('email').eq('id', userId).maybeSingle()
      return getFlagsForUser(userId, (data as { email?: string } | null)?.email)
    },
    audit,
  }
}

export { authenticate }

const restError = (status: number, code: string, message: string, headers: Record<string, string> = {}) =>
  Response.json({ error: { code, message } }, { status, headers: { 'Cache-Control': 'no-store', ...headers } })

/** Auth + scope + rate limit for the REST mirror (/api/v1). No CORS headers on purpose. */
export async function restAuth(req: Request, scope: Scope): Promise<{ principal: Principal; response?: undefined } | { principal?: undefined; response: Response }> {
  const ip = clientIp(req)
  const auth = await authenticate(req.headers.get('authorization'), ip, authDeps())
  if (!auth.ok) return { response: restError(auth.status, auth.code, auth.message, auth.status === 401 ? { 'WWW-Authenticate': 'Bearer realm="linkhub-api"' } : auth.retryAfterSec ? { 'Retry-After': String(auth.retryAfterSec) } : {}) }
  if (!auth.principal) return { response: restError(401, 'missing_key', 'Falta la cabecera Authorization: Bearer lh_...', { 'WWW-Authenticate': 'Bearer realm="linkhub-api"' }) }
  if (!hasScope(auth.principal.scopes, scope)) return { response: restError(403, 'insufficient_scope', `La API key necesita el permiso ${scope}`) }
  const limit = keyLimiter.take(`key:${auth.principal.keyId}`)
  if (!limit.ok) return { response: restError(429, 'rate_limited', 'Demasiadas peticiones', { 'Retry-After': String(limit.retryAfterSec) }) }
  return { principal: auth.principal }
}
export { restError }

export function ownerStore() { return createOwnerStore(db()) }
