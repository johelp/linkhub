// In-memory token bucket. LIMITS ON SERVERLESS: each instance (Vercel function
// container) keeps its own map, so the effective limit is "per instance", a
// client can get N x capacity if requests land on N cold instances, and counters
// reset on cold start. It still stops accidental loops and casual abuse; for a
// hard global limit put a shared store (Redis/Upstash) or the platform firewall
// in front. The map is bounded so it can't grow without limit.
export interface LimiterOptions {
  capacity: number          // burst size (tokens)
  refillPerSec: number      // sustained rate
  maxKeys?: number          // memory bound (oldest entries are evicted)
  now?: () => number        // injectable clock (ms), for tests
}

export interface Limiter {
  /** Takes `cost` tokens for `key`. */
  take(key: string, cost?: number): { ok: boolean; retryAfterSec: number }
  /** Is at least one token available? (does not consume) */
  peek(key: string): boolean
}

export function createLimiter(opts: LimiterOptions): Limiter {
  const { capacity, refillPerSec } = opts
  const maxKeys = opts.maxKeys ?? 5000
  const now = opts.now ?? Date.now
  const buckets = new Map<string, { tokens: number; at: number }>()
  return {
    peek(key) {
      const b = buckets.get(key)
      return !b || Math.min(capacity, b.tokens + ((now() - b.at) / 1000) * refillPerSec) >= 1
    },
    take(key, cost = 1) {
      const t = now()
      const b = buckets.get(key) ?? { tokens: capacity, at: t }
      b.tokens = Math.min(capacity, b.tokens + ((t - b.at) / 1000) * refillPerSec)
      b.at = t
      buckets.delete(key)            // re-insert = most recently used (Map keeps insertion order)
      buckets.set(key, b)
      if (buckets.size > maxKeys) buckets.delete(buckets.keys().next().value as string)
      if (b.tokens >= cost) { b.tokens -= cost; return { ok: true, retryAfterSec: 0 } }
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil((cost - b.tokens) / refillPerSec)) }
    },
  }
}

// Defaults used by the HTTP route (see docs/developers/mcp.md).
export const PUBLIC_LIMIT = { capacity: 30, refillPerSec: 0.5 }     // ~30 req/min per IP, bursts of 30
export const KEY_LIMIT = { capacity: 120, refillPerSec: 2 }          // ~120 req/min per API key
export const AUTH_FAIL_LIMIT = { capacity: 10, refillPerSec: 0.05 }  // bad keys: 10 then ~3/min per IP
