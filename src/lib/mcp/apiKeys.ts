// API keys for the customer integrations (REST /api/v1 and the authenticated
// MCP tier). Pure helpers: the database access lives in auth.server.ts.
//
// A key looks like `lh_<43 chars base64url>` (32 random bytes). Only its SHA-256
// hash and a short display prefix are stored; the full key is shown once at
// creation. The key is high-entropy random, so a fast hash is appropriate (a
// slow KDF protects low-entropy passwords, not 256-bit secrets).
import crypto from 'node:crypto'
import { isScope, type Scope } from './scopes.ts'

export { SCOPES, SCOPE_LABEL, isScope, type Scope } from './scopes.ts'

export const MAX_KEYS_PER_ACCOUNT = 10
export const KEY_PREFIX = 'lh_'
export const MAX_KEY_NAME = 60
/** Keys longer than this are rejected before hashing. */
const MAX_KEY_LENGTH = 80
const KEY_RE = /^lh_[A-Za-z0-9_-]{43}$/

export interface GeneratedKey { key: string; prefix: string; hash: string }

export function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key, 'utf8').digest('hex')
}

export function generateApiKey(random: (n: number) => Buffer = crypto.randomBytes): GeneratedKey {
  const key = KEY_PREFIX + random(32).toString('base64url')
  // The prefix is only a recognizable label ("lh_Ab3dE9…"), not a lookup key.
  return { key, prefix: key.slice(0, 9), hash: hashKey(key) }
}

/** Extracts the key from an `Authorization: Bearer lh_...` header; null if absent or malformed. */
export function parseBearer(header: string | null | undefined): string | null {
  if (!header) return null
  const m = /^Bearer\s+(\S+)$/i.exec(header.trim())
  if (!m || m[1].length > MAX_KEY_LENGTH || !KEY_RE.test(m[1])) return null
  return m[1]
}

/** Constant-time comparison of two hex digests. */
export function hashesEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb)
}

export interface ApiKeyRow {
  id: string
  user_id: string
  name: string
  key_prefix: string
  key_hash: string
  scopes: string[]
  last_used_at: string | null
  expires_at: string | null
  revoked_at: string | null
}

export type KeyCheck = { ok: true; scopes: Scope[] } | { ok: false; reason: 'unknown' | 'revoked' | 'expired' }

/** Does this stored row accept the presented key right now? */
export function checkKeyRow(row: ApiKeyRow | null | undefined, presentedKey: string, now: number = Date.now()): KeyCheck {
  if (!row || !hashesEqual(row.key_hash, hashKey(presentedKey))) return { ok: false, reason: 'unknown' }
  if (row.revoked_at) return { ok: false, reason: 'revoked' }
  if (row.expires_at) {
    const t = Date.parse(row.expires_at)
    if (Number.isNaN(t) || t <= now) return { ok: false, reason: 'expired' }
  }
  // Unknown scope strings in the row are dropped, never granted.
  return { ok: true, scopes: row.scopes.filter(isScope) }
}

export const hasScope = (granted: readonly Scope[], needed: Scope) => granted.includes(needed)

export interface KeyInput { name: string; scopes: Scope[]; expiresAt: string | null }

/** Validates the dashboard's "create key" payload. */
export function validateKeyInput(body: unknown, now: number = Date.now()): { ok: true; value: KeyInput } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Datos inválidos' }
  const b = body as Record<string, unknown>
  const name = typeof b.name === 'string' ? b.name.trim() : ''
  if (!name || name.length > MAX_KEY_NAME) return { ok: false, error: `Ponle un nombre de hasta ${MAX_KEY_NAME} caracteres` }
  if (/[\u0000-\u001f<>]/.test(name)) return { ok: false, error: 'El nombre tiene caracteres no válidos' }
  if (!Array.isArray(b.scopes) || b.scopes.length === 0 || !b.scopes.every(isScope)) return { ok: false, error: 'Elige al menos un permiso válido' }
  const scopes = [...new Set(b.scopes as Scope[])]
  let expiresAt: string | null = null
  if (b.expiresAt !== undefined && b.expiresAt !== null && b.expiresAt !== '') {
    const t = typeof b.expiresAt === 'string' ? Date.parse(b.expiresAt) : NaN
    if (Number.isNaN(t) || t <= now) return { ok: false, error: 'La fecha de caducidad debe ser futura' }
    if (t > now + 366 * 864e5) return { ok: false, error: 'La caducidad máxima es de un año' }
    expiresAt = new Date(t).toISOString()
  }
  return { ok: true, value: { name, scopes, expiresAt } }
}
