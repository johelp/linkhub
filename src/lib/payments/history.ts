// Filters for the payment history (customer panel, admin panel and CSV export
// share one parser so the three views always agree).
export const STATUSES = ['approved', 'pending', 'rejected', 'refunded'] as const
export const PROVIDER_IDS = ['mercadopago', 'stripe', 'redsys'] as const
export const PAGE_SIZE = 25

export interface HistoryFilters { status?: string; provider?: string; page?: string; q?: string; from?: string; to?: string; p: number }

const DATE = /^\d{4}-\d{2}-\d{2}$/
const UUID = /^[0-9a-f-]{36}$/i

export function parseFilters(sp: Record<string, string | string[] | undefined>): HistoryFilters {
  const one = (k: string) => { const v = sp[k]; return (Array.isArray(v) ? v[0] : v)?.trim() || undefined }
  const status = one('status'), provider = one('provider'), page = one('page'), from = one('from'), to = one('to')
  return {
    status: status && (STATUSES as readonly string[]).includes(status) ? status : undefined,
    provider: provider && (PROVIDER_IDS as readonly string[]).includes(provider) ? provider : undefined,
    page: page && UUID.test(page) ? page : undefined,
    // Strip characters that have meaning inside PostgREST filters / LIKE.
    q: one('q')?.slice(0, 80).replace(/[%_,()*\\]/g, ''),
    from: from && DATE.test(from) ? from : undefined,
    to: to && DATE.test(to) ? to : undefined,
    p: Math.max(parseInt(one('p') ?? '1', 10) || 1, 1),
  }
}

export function toQuery(f: Partial<HistoryFilters>, extra: Record<string, string | undefined> = {}): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries({ ...f, ...extra })) if (v !== undefined && v !== '' && !(k === 'p' && v === 1)) sp.set(k, String(v))
  const s = sp.toString()
  return s ? `?${s}` : ''
}

// Spreadsheet formula injection guard for any user-influenced cell.
export function csvCell(v: unknown): string {
  let s = v == null ? '' : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
