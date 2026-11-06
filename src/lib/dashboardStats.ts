import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export interface DailyRow { day: string; page_id: string; views: number; clicks: number }
export interface TopBlock { page_id: string; block_id: string; block_type: string | null; clicks: number }
export interface DeviceRow { device: string; views: number }

export interface DashboardStats {
  daily: DailyRow[]
  topBlocks: TopBlock[]
  devices: DeviceRow[]
  /** true when the SQL functions (migration 012) aren't installed and we fell back to a capped sample */
  approximate: boolean
}

type Client = SupabaseClient<Database>

const num = (v: unknown) => Number(v) || 0

interface EventRow { page_id: string; event_type: string; block_id: string | null; block_type: string | null; device: string | null; created_at: string }

// Fallback aggregation over raw rows (PostgREST caps these at ~1000, so the
// result is flagged `approximate`). Exported for testing.
export function aggregateEvents(rows: EventRow[]): Omit<DashboardStats, 'approximate'> {
  const daily = new Map<string, DailyRow>()
  const blocks = new Map<string, TopBlock>()
  const devices = new Map<string, number>()
  for (const r of rows) {
    const day = r.created_at.slice(0, 10)
    const k = `${day}|${r.page_id}`
    const d = daily.get(k) ?? { day, page_id: r.page_id, views: 0, clicks: 0 }
    if (r.event_type === 'view') { d.views++; devices.set(r.device ?? 'desktop', (devices.get(r.device ?? 'desktop') ?? 0) + 1) }
    else if (r.event_type === 'click') {
      d.clicks++
      if (r.block_id) {
        const bk = `${r.page_id}|${r.block_id}`
        const b = blocks.get(bk) ?? { page_id: r.page_id, block_id: r.block_id, block_type: r.block_type, clicks: 0 }
        b.clicks++
        blocks.set(bk, b)
      }
    }
    daily.set(k, d)
  }
  return {
    daily: [...daily.values()],
    topBlocks: [...blocks.values()].sort((a, b) => b.clicks - a.clicks).slice(0, 8),
    devices: [...devices.entries()].map(([device, views]) => ({ device, views })),
  }
}

export async function loadDashboardStats(supabase: Client, pageIds: string[], days = 60): Promise<DashboardStats> {
  if (pageIds.length === 0) return { daily: [], topBlocks: [], devices: [], approximate: false }
  // The functions are new (migration 012) so they're not in the generated types yet.
  const rpc = supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown[] | null; error: unknown }>
  const call = rpc.bind(supabase)
  const [d, t, v] = await Promise.all([
    call('owner_daily_stats', { days }),
    call('owner_top_blocks', { days: 30, lim: 8 }),
    call('owner_device_stats', { days: 30 }),
  ])
  if (!d.error && !t.error && !v.error) {
    return {
      daily: (d.data ?? []).map((r) => { const x = r as Record<string, unknown>; return { day: String(x.day).slice(0, 10), page_id: String(x.page_id), views: num(x.views), clicks: num(x.clicks) } }),
      topBlocks: (t.data ?? []).map((r) => { const x = r as Record<string, unknown>; return { page_id: String(x.page_id), block_id: String(x.block_id), block_type: (x.block_type as string) ?? null, clicks: num(x.clicks) } }),
      devices: (v.data ?? []).map((r) => { const x = r as Record<string, unknown>; return { device: String(x.device), views: num(x.views) } }),
      approximate: false,
    }
  }
  const since = new Date(Date.now() - days * 864e5).toISOString()
  const { data } = await supabase
    .from('analytics_events')
    .select('page_id, event_type, block_id, block_type, device, created_at')
    .in('page_id', pageIds)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1000)
  return { ...aggregateEvents((data ?? []) as EventRow[]), approximate: true }
}

// ─── Pure helpers used by the pages ──────────────────────────────
export function lastNDays(n: number, end = new Date()): string[] {
  return Array.from({ length: n }, (_, i) => new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - (n - 1 - i))).toISOString().slice(0, 10))
}

export function seriesFor(daily: DailyRow[], days: string[], field: 'views' | 'clicks', pageId?: string): number[] {
  const byDay = new Map<string, number>()
  for (const r of daily) if (!pageId || r.page_id === pageId) byDay.set(r.day, (byDay.get(r.day) ?? 0) + r[field])
  return days.map(d => byDay.get(d) ?? 0)
}

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

/** % change between two periods; null when there is no baseline to compare with. */
export function delta(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return Math.round(((current - previous) / previous) * 100)
}
