// Supabase-backed data access for the MCP/REST API. It runs with the SERVICE
// ROLE (an API key has no browser session, so RLS cannot protect these queries).
// That makes the scoping below the security boundary: every owner query
// filters on `user_id` explicitly, and the public queries select only
// published rows. tests/mcp-store.test.ts asserts those filters.
import type { Page, Plan } from '../../types/index.ts'
import type { KnowledgeEntry } from '../knowledge.ts'
import { publicEntriesForPage } from '../knowledge.ts'
import type { Availability } from '../billing.ts'
import type { AnalyticsSummary, OwnerStore, PaymentRow, PublicStore } from './types.ts'

// The tables added after the generated types (knowledge_entries, api_keys...)
// aren't in database.types.ts, so the client is used through this loose shape.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LooseDb = { from: (table: string) => any }

const KNOWLEDGE_COLS = 'id, page_id, kind, title, content, visibility, position, updated_at'
const UUID = /^[0-9a-fA-F-]{36}$/

export function createPublicStore(db: LooseDb, availability: (userId: string) => Promise<Availability>): PublicStore {
  return {
    async getPublicPage(slug) {
      const { data } = await db.from('pages').select('*').eq('slug', slug).eq('published', true).maybeSingle()
      const page = data as Page | null
      if (!page || page.settings?.seo?.noindex) return null
      if ((await availability(page.user_id)) === 'paused') return null
      return page
    },
    async getPublicKnowledge(page) {
      if (!UUID.test(page.id)) return []
      const { data } = await db.from('knowledge_entries').select(KNOWLEDGE_COLS)
        .eq('user_id', page.user_id).eq('visibility', 'public').or(`page_id.is.null,page_id.eq.${page.id}`).order('position', { ascending: true }).limit(300)
      return publicEntriesForPage((data ?? []) as KnowledgeEntry[], page.id)
    },
  }
}

export function createOwnerStore(db: LooseDb): OwnerStore {
  /** Ids (among `ids`) that really belong to the owner. */
  async function ownedIds(userId: string, ids?: string[]): Promise<string[]> {
    let q = db.from('pages').select('id').eq('user_id', userId)
    if (ids) q = q.in('id', ids)
    const { data } = await q.limit(200)
    return ((data ?? []) as { id: string }[]).map(r => r.id)
  }

  return {
    async getPlan(userId) {
      const { data } = await db.from('profiles').select('plan').eq('id', userId).maybeSingle()
      return ((data as { plan?: Plan } | null)?.plan || 'free') as Plan
    },
    async listPages(userId) {
      const { data } = await db.from('pages').select('id, slug, name, published, updated_at, views, moderated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(100)
      return ((data ?? []) as { id: string; slug: string; name: string; published: boolean; updated_at: string; views: number; moderated_at: string | null }[])
        .map(p => ({ id: p.id, slug: p.slug, name: p.name, published: p.published, updated_at: p.updated_at, views: p.views, moderated: !!p.moderated_at }))
    },
    async getPage(userId, ref) {
      if (!ref.id && !ref.slug) return null
      let q = db.from('pages').select('*').eq('user_id', userId)
      q = ref.id ? q.eq('id', ref.id) : q.eq('slug', ref.slug)
      const { data } = await q.maybeSingle()
      return (data as Page | null) ?? null
    },
    async savePage(userId, pageId, update) {
      const { error } = await db.from('pages').update(update).eq('id', pageId).eq('user_id', userId)
      return error ? { error: { message: String(error.message ?? 'error') } } : {}
    },
    async listKnowledge(userId, f) {
      let q = db.from('knowledge_entries').select(KNOWLEDGE_COLS).eq('user_id', userId)
      if (f.pageId && UUID.test(f.pageId)) q = q.or(`page_id.is.null,page_id.eq.${f.pageId}`)
      if (f.kind) q = q.eq('kind', f.kind)
      if (f.visibility) q = q.eq('visibility', f.visibility)
      const { data } = await q.order('position', { ascending: true }).limit(300)
      return (data ?? []) as KnowledgeEntry[]
    },
    async upsertKnowledge(userId, e) {
      const row = { page_id: e.page_id, kind: e.kind, title: e.title, content: e.content, visibility: e.visibility, position: e.position }
      if (e.id) {
        const { data, error } = await db.from('knowledge_entries').update(row).eq('id', e.id).eq('user_id', userId).select(KNOWLEDGE_COLS).maybeSingle()
        if (error) return { error: 'No se pudo guardar.' }
        return data ? { entry: data as KnowledgeEntry } : { error: 'Entrada no encontrada.' }
      }
      const { data, error } = await db.from('knowledge_entries').insert({ ...row, user_id: userId }).select(KNOWLEDGE_COLS).single()
      if (error) return { error: String(error.message ?? '').includes('limit_exceeded') ? 'Límite alcanzado: máximo 300 entradas por cuenta.' : 'No se pudo guardar.' }
      return { entry: data as KnowledgeEntry }
    },
    async deleteKnowledge(userId, id) {
      const { data } = await db.from('knowledge_entries').delete().eq('id', id).eq('user_id', userId).select('id')
      return Array.isArray(data) && data.length > 0
    },
    async analytics(userId, pageIds, days) {
      const ids = await ownedIds(userId, pageIds)
      const since = new Date(Date.now() - days * 864e5).toISOString()
      const pages = await Promise.all(ids.map(async page_id => {
        const count = async (type: 'view' | 'click') => {
          const { count: c } = await db.from('analytics_events').select('id', { count: 'exact', head: true }).eq('page_id', page_id).eq('event_type', type).gte('created_at', since)
          return (c as number | null) ?? 0
        }
        const [views, clicks] = await Promise.all([count('view'), count('click')])
        return { page_id, views, clicks }
      }))
      const top = new Map<string, { page_id: string; block_id: string; block_type: string | null; clicks: number }>()
      let sampled = 0
      if (ids.length) {
        const { data } = await db.from('analytics_events').select('page_id, block_id, block_type').in('page_id', ids).eq('event_type', 'click').gte('created_at', since).order('created_at', { ascending: false }).limit(1000)
        for (const r of (data ?? []) as { page_id: string; block_id: string | null; block_type: string | null }[]) {
          sampled++
          if (!r.block_id) continue
          const k = `${r.page_id}|${r.block_id}`
          const t = top.get(k) ?? { page_id: r.page_id, block_id: r.block_id, block_type: r.block_type, clicks: 0 }
          t.clicks++
          top.set(k, t)
        }
      }
      const out: AnalyticsSummary = { days, pages, topBlocks: [...top.values()].sort((a, b) => b.clicks - a.clicks).slice(0, 8), approximateTopBlocks: sampled >= 1000 }
      return out
    },
    async listPayments(userId, f) {
      const ids = await ownedIds(userId, f.pageId ? [f.pageId] : undefined)
      if (!ids.length) return []
      // Explicit columns: provider tokens/config live in other tables and are never selected here.
      let q = db.from('payments').select('id, created_at, status, provider, amount, currency, tier_name, payer_email, provider_payment_id, page_id').in('page_id', ids)
      if (f.status) q = q.eq('status', f.status)
      if (f.provider) q = q.eq('provider', f.provider)
      if (f.from) q = q.gte('created_at', `${f.from}T00:00:00Z`)
      if (f.to) q = q.lte('created_at', `${f.to}T23:59:59Z`)
      const { data } = await q.order('created_at', { ascending: false }).limit(Math.min(Math.max(f.limit, 1), 50))
      return ((data ?? []) as PaymentRow[]).map(r => ({ ...r, amount: Number(r.amount) }))
    },
  }
}
