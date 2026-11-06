// Pure helpers for alerts: no I/O, so they are unit-testable.
const SECRET_PATTERNS: RegExp[] = [
  /\b(sk|rk|pk)_(live|test)_[A-Za-z0-9]+/g,        // Stripe keys
  /\b(whsec|re)_[A-Za-z0-9]{8,}/g,                 // webhook secrets / Resend keys
  /\bAPP_USR-[A-Za-z0-9-]+/g,                      // Mercado Pago tokens
  /\blh_[A-Za-z0-9]{16,}/g,                        // LinkHub API keys
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]*/g, // JWTs
  /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g,                 // emails (PII)
]

export function scrub(text: string): string {
  return SECRET_PATTERNS.reduce((t, re) => t.replace(re, '[redacted]'), text)
}

export function describeError(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`
  if (typeof err === 'string') return err
  try { return JSON.stringify(err) } catch { return String(err) }
}

export interface Alert { scope: string; message: string; env: string }

export function formatAlert(scope: string, err: unknown, env: string): Alert {
  return { scope, env, message: scrub(describeError(err)).slice(0, 500) }
}

/** Same scope+message at most once per window (so one outage ≠ 500 pings). */
export function createDeduper(windowMs: number, now: () => number = Date.now) {
  const seen = new Map<string, number>()
  return (a: Alert): boolean => {
    const key = `${a.scope}|${a.message}`
    const t = now()
    const last = seen.get(key)
    if (last !== undefined && t - last < windowMs) return false
    seen.set(key, t)
    if (seen.size > 200) for (const [k, v] of seen) if (t - v >= windowMs) seen.delete(k)
    return true
  }
}
