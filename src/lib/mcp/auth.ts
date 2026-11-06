// Bearer-key authentication, pure over injected data access (see server.ts for
// the Supabase wiring). Shared by the MCP route and the REST mirror.
import { checkKeyRow, hashKey, parseBearer, type ApiKeyRow } from './apiKeys.ts'
import type { Limiter } from './rateLimit.ts'
import type { Principal } from './types.ts'

export interface AuthDeps {
  findKeyByHash(hash: string): Promise<ApiKeyRow | null>
  getUserEmail(userId: string): Promise<string | null>
  /** Feature flag `developer_api` for that customer (admins always pass). */
  developerApiEnabled(userId: string, email: string | null): Promise<boolean>
  /** Best-effort bookkeeping; failures are ignored. */
  touch(keyId: string): Promise<void>
  /** Throttles failed attempts per IP. */
  failLimiter: Limiter
  now?: () => number
}

export type AuthResult =
  | { ok: true; principal: Principal | null }   // null = no credentials: the public tier
  | { ok: false; status: 401 | 403 | 429; code: string; message: string; retryAfterSec?: number }

const TOUCH_EVERY_MS = 60_000

/**
 * No Authorization header -> anonymous (public tier). A header that is present
 * but wrong NEVER falls back to anonymous: the caller must hear about it.
 */
export async function authenticate(authorization: string | null, ip: string, deps: AuthDeps): Promise<AuthResult> {
  if (!authorization) return { ok: true, principal: null }
  const now = deps.now?.() ?? Date.now()
  const fail = (status: 401 | 403, code: string, message: string): AuthResult => {
    if (status === 401) deps.failLimiter.take(`fail:${ip}`)
    return { ok: false, status, code, message }
  }
  if (!deps.failLimiter.peek(`fail:${ip}`)) return { ok: false, status: 429, code: 'too_many_failures', message: 'Demasiados intentos con claves no válidas. Espera unos minutos.', retryAfterSec: 60 }

  const key = parseBearer(authorization)
  if (!key) return fail(401, 'invalid_key', 'API key no válida')
  const row = await deps.findKeyByHash(hashKey(key))
  const check = checkKeyRow(row, key, now)
  // Same message for unknown/revoked/expired: a probe learns nothing about which keys exist.
  if (!check.ok || !row) return fail(401, 'invalid_key', 'API key no válida, revocada o caducada')

  const email = await deps.getUserEmail(row.user_id)
  if (!(await deps.developerApiEnabled(row.user_id, email))) return fail(403, 'developer_api_disabled', 'La API para desarrolladores no está activada para esta cuenta')

  if (!row.last_used_at || now - Date.parse(row.last_used_at) > TOUCH_EVERY_MS) { try { await deps.touch(row.id) } catch { /* best effort */ } }
  return { ok: true, principal: { userId: row.user_id, keyId: row.id, scopes: check.scopes, email } }
}
