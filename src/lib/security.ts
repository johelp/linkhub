import type { Block } from '@/types'

// Schemes a page owner may link to. Anything else (javascript:, data:,
// vbscript:, file:...) is dropped, so a stored block can never become an
// XSS / phishing vector for visitors. Relative paths and "#" stay allowed.
const SAFE_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:'])

export function isSafeUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const v = value.trim()
  if (v === '' || v === '#') return true
  if (v.startsWith('/') && !v.startsWith('//')) return true
  try {
    return SAFE_SCHEMES.has(new URL(v).protocol)
  } catch {
    return false
  }
}

export function safeUrl(value: string | undefined | null): string {
  if (!value) return ''
  return isSafeUrl(value) ? value.trim() : ''
}

const URL_KEY = /(^|[a-z])(url|href)$/i

// Deep-walks a block's data and blanks every url/href-like string that has an
// unsafe scheme. Pure: returns a new structure, never mutates the input.
function sanitizeValue(value: unknown, key = ''): unknown {
  if (Array.isArray(value)) return value.map(v => sanitizeValue(v, key))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeValue(v, k)]))
  }
  if (typeof value === 'string' && URL_KEY.test(key) && !isSafeUrl(value)) return ''
  return value
}

export function sanitizeBlocks(blocks: Block[]): Block[] {
  return sanitizeValue(blocks) as Block[]
}

// Only same-site absolute paths: blocks "//evil.com", "/\evil.com", "@evil".
export function safeNextPath(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return fallback
  if (/[\u0000-\u001f]/.test(next)) return fallback
  return next
}

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,60}[a-z0-9]$/

// Settings carry owner-supplied image URLs (avatar, cover, OG image): keep
// them to http(s) so they can't smuggle javascript:/data: into <img>/<meta>.
export function sanitizeSettings<T extends { profile?: { avatarUrl?: string; coverUrl?: string; tagline?: string }; seo?: { ogImage?: string | null } }>(settings: T): T {
  const out = structuredClone(settings)
  const web = (u?: string | null) => (u && /^https?:\/\//i.test(u.trim()) && isSafeUrl(u) ? u.trim() : '')
  if (out.profile) {
    out.profile.avatarUrl = web(out.profile.avatarUrl)
    out.profile.coverUrl = web(out.profile.coverUrl)
    out.profile.tagline = (out.profile.tagline ?? '').slice(0, 160)
  }
  if (out.seo && 'ogImage' in out.seo) out.seo.ogImage = web(out.seo.ogImage) || null
  return out
}
