// Subscription lapse rules (pure). A customer whose payment keeps failing is
// first in GRACE (everything still works, the panel warns them), then PAUSED:
// the public page shows a neutral "back soon" screen and stops taking
// orders/payments. Their dashboard is never locked, so they can fix billing.
export type Availability = 'active' | 'grace' | 'paused'

export const LAPSE_STATUSES = new Set(['past_due', 'unpaid', 'incomplete_expired'])
export const DEFAULT_GRACE_DAYS = 7

export function graceDays(): number {
  const n = Number(process.env.BILLING_GRACE_DAYS)
  return Number.isFinite(n) && n >= 0 && n <= 90 ? n : DEFAULT_GRACE_DAYS
}

export function availability(lapsedAt: string | null | undefined, now: number = Date.now(), grace: number = DEFAULT_GRACE_DAYS): Availability {
  if (!lapsedAt) return 'active'
  const t = Date.parse(lapsedAt)
  if (Number.isNaN(t)) return 'active'
  return now >= t + grace * 864e5 ? 'paused' : 'grace'
}

/** When the pause starts (for the owner's banner). */
export function pauseDate(lapsedAt: string, grace: number = DEFAULT_GRACE_DAYS): Date {
  return new Date(Date.parse(lapsedAt) + grace * 864e5)
}
