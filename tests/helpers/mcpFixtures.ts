// Shared fixtures for the MCP / API tests: an in-memory fake of the slice of
// the Supabase query builder our stores use, two owners with data, and a
// ready-made McpDeps. Not a test file itself (the runner only globs *.test.ts).
import { createOwnerStore, createPublicStore, type LooseDb } from '../../src/lib/mcp/store.ts'
import { createLimiter } from '../../src/lib/mcp/rateLimit.ts'
import { resolveFlags } from '../../src/lib/flags.ts'
import type { AuditEntry, McpDeps, Principal } from '../../src/lib/mcp/types.ts'
import type { Scope } from '../../src/lib/mcp/scopes.ts'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, unknown>
type Q = Record<string, (...a: any[]) => any>
export interface Call { table: string; op: string; filters: string[] }

export function fakeDb(tables: Record<string, Row[]>) {
  const calls: Call[] = []
  const db: LooseDb = {
    from(table: string) {
      const rows = (tables[table] ??= [])
      let op = 'select'
      let payload: Row = {}
      const preds: ((r: Row) => boolean)[] = []
      const filters: string[] = []
      let head = false
      let max = Infinity
      let sortKey: string | null = null
      let asc = true
      const q: Q = {
        select(_c?: string, o?: { head?: boolean }) { head = !!o?.head; return q },
        insert(row: Row) { op = 'insert'; payload = row; return q },
        update(row: Row) { op = 'update'; payload = row; return q },
        delete() { op = 'delete'; return q },
        eq(k: string, v: unknown) { filters.push(`${k}=${String(v)}`); preds.push(r => r[k] === v); return q },
        in(k: string, vs: unknown[]) { filters.push(`${k} in`); preds.push(r => vs.includes(r[k])); return q },
        gte(k: string, v: string) { filters.push(`${k}>=`); preds.push(r => String(r[k]) >= v); return q },
        lte(k: string, v: string) { filters.push(`${k}<=`); preds.push(r => String(r[k]) <= v); return q },
        or(expr: string) {
          // supports "col.is.null,col.eq.X"
          filters.push(`or:${expr}`)
          const parts = expr.split(',').map(p => p.split('.'))
          preds.push(r => parts.some(([c, o, v]) => (o === 'is' ? r[c] === null : r[c] === v)))
          return q
        },
        order(k: string, o?: { ascending?: boolean }) { sortKey = k; asc = o?.ascending !== false; return q },
        limit(n: number) { max = n; return q },
        maybeSingle() { return Promise.resolve(run()).then(r => ({ data: r.data[0] ?? null, error: r.error })) },
        single() { return Promise.resolve(run()).then(r => ({ data: r.data[0] ?? null, error: r.data[0] ? null : { message: 'no row' } })) },
        then(res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) { return Promise.resolve(run()).then(res, rej) },
      }
      function run(): { data: Row[]; error: null | { message: string }; count?: number } {
        calls.push({ table, op, filters: [...filters] })
        if (op === 'insert') { const row = { id: `new-${rows.length + 1}`, ...payload }; rows.push(row); return { data: [row], error: null } }
        let hit = rows.filter(r => preds.every(p => p(r)))
        if (op === 'update') { hit.forEach(r => Object.assign(r, payload)); return { data: hit, error: null } }
        if (op === 'delete') { for (const r of hit) rows.splice(rows.indexOf(r), 1); return { data: hit, error: null } }
        if (sortKey) hit = [...hit].sort((a, b) => (String(a[sortKey!]) < String(b[sortKey!]) ? -1 : 1) * (asc ? 1 : -1))
        const count = hit.length
        return { data: head ? [] : hit.slice(0, max), error: null, count }
      }
      return q
    },
  }
  return { db, calls, tables }
}

export const ALICE = '11111111-1111-4111-8111-111111111111'
export const BOB = '22222222-2222-4222-8222-222222222222'
export const ALICE_PAGE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
export const BOB_PAGE = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
export const NOW = new Date('2026-11-02T08:00:00Z') // a Monday

const tr = (name: string, description = '') => ({ es: { name, description }, en: { name, description }, pt: { name, description }, fr: { name, description }, de: { name, description }, it: { name, description } })
const ttl = (title: string) => ({ es: { title, description: '' }, en: { title, description: '' }, pt: { title, description: '' }, fr: { title, description: '' }, de: { title, description: '' }, it: { title, description: '' } })
const base = { visible: true, seasonFilter: 'always' }
const week = [0, 1, 2, 3, 4, 5, 6].map(day => ({ day, open: '09:00', close: '13:00', closed: day === 0 || day === 6 }))

export function pageRow(over: Row = {}): Row {
  return {
    id: ALICE_PAGE, user_id: ALICE, slug: 'clinica-sol', name: 'Clínica Sol', published: true, views: 3, updated_at: '2026-11-01T10:00:00Z', moderated_at: null,
    settings: { defaultLang: 'es', enabledLangs: ['es'], seasonMode: 'always', primaryColor: '#112233', backgroundColor: '#ffffff', fontFamily: 'DM Sans', showPoweredBy: true, seo: { title: '', description: '', ogImage: null }, profile: { tagline: 'Fisioterapia' } },
    blocks: [
      { ...base, id: 'b-contact', type: 'contact_card', order: 0, data: { phone: '+34 910 000 000', email: 'hola@sol.test', address: 'Calle Mayor 1', mapUrl: '', whatsapp: '34600000000' } },
      { ...base, id: 'b-book', type: 'appointment_request', order: 1, data: { translations: ttl('Pide cita'), whatsapp: '+34 600 000 000', timezone: 'UTC', currency: 'EUR', services: [{ id: 's1', translations: tr('Masaje', 'Descontracturante'), durationMin: 60, price: 40 }], schedule: week, slotMinutes: 60, daysAhead: 14, minNoticeHours: 0 } },
      { ...base, id: 'b-order', type: 'order_menu', order: 2, data: { translations: ttl('Tienda'), currency: 'EUR', whatsapp: '34600000000', delivery: true, pickup: true, deliveryFee: 2, minOrder: 5, notesPlaceholder: '', categories: [{ id: 'c1', translations: tr('Cremas'), items: [{ id: 'i1', translations: tr('Crema', 'Hidratante'), price: 10, available: true }, { id: 'i2', translations: tr('Agotada'), price: 9, available: false }] }] } },
      { ...base, id: 'b-link', type: 'link', order: 3, data: { icon: 'link', iconBg: '#fff', translations: ttl('Web'), url: 'https://sol.test' } },
    ],
    ...over,
  }
}

export function world() {
  const tables: Record<string, Row[]> = {
    profiles: [{ id: ALICE, email: 'alice@x.test', plan: 'pro' }, { id: BOB, email: 'bob@x.test', plan: 'pro' }],
    pages: [
      pageRow(),
      pageRow({ id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', slug: 'borrador', name: 'Borrador', published: false }),
      pageRow({ id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', slug: 'oculta', name: 'Oculta', settings: { ...(pageRow().settings as object), seo: { title: '', description: '', ogImage: null, noindex: true } } }),
      pageRow({ id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', slug: 'pausada', name: 'Pausada', user_id: 'paused-user' }),
      pageRow({ id: BOB_PAGE, user_id: BOB, slug: 'tienda-bob', name: 'Tienda de Bob' }),
    ],
    knowledge_entries: [
      { id: 'k1', user_id: ALICE, page_id: null, kind: 'faq', title: '¿Aceptan tarjeta?', content: 'Sí, Visa y Mastercard.', visibility: 'public', position: 0 },
      { id: 'k2', user_id: ALICE, page_id: ALICE_PAGE, kind: 'policy', title: 'Política interna de descuentos', content: 'Secreto: descuento máximo 30%.', visibility: 'private', position: 1 },
      { id: 'k3', user_id: BOB, page_id: null, kind: 'faq', title: '¿Aceptan tarjeta Bob?', content: 'Solo efectivo en Bob.', visibility: 'public', position: 0 },
    ],
    analytics_events: [
      { id: 'e1', page_id: ALICE_PAGE, event_type: 'view', block_id: null, block_type: null, created_at: new Date(NOW.getTime() - 1000).toISOString() },
      { id: 'e2', page_id: ALICE_PAGE, event_type: 'click', block_id: 'b-link', block_type: 'link', created_at: new Date(NOW.getTime() - 1000).toISOString() },
      { id: 'e3', page_id: BOB_PAGE, event_type: 'view', block_id: null, block_type: null, created_at: new Date(NOW.getTime() - 1000).toISOString() },
    ],
    payments: [
      { id: 'p1', page_id: ALICE_PAGE, created_at: '2026-11-01T10:00:00Z', status: 'approved', provider: 'stripe', amount: '25.50', currency: 'EUR', tier_name: 'Bono', payer_email: 'cliente@mail.test', provider_payment_id: 'pi_1', access_token: 'SECRET-TOKEN' },
      { id: 'p2', page_id: BOB_PAGE, created_at: '2026-11-01T10:00:00Z', status: 'approved', provider: 'stripe', amount: '99', currency: 'EUR', tier_name: 'Bob', payer_email: 'otro@mail.test', provider_payment_id: 'pi_2' },
    ],
  }
  const fake = fakeDb(tables)
  const audits: AuditEntry[] = []
  const state = { auditFails: false }
  const deps: McpDeps = {
    baseUrl: 'https://linkhub.test',
    limiter: createLimiter({ capacity: 1000, refillPerSec: 1000 }),
    publicStore: createPublicStore(fake.db, async uid => (uid === 'paused-user' ? 'paused' : 'active')),
    owner: createOwnerStore(fake.db),
    getFlags: async uid => resolveFlags(uid, [], [], false),
    audit: async e => { if (state.auditFails) throw new Error('down'); audits.push(e) },
    now: () => NOW,
  }
  return { ...fake, deps, audits, state }
}

export const principal = (scopes: Scope[], userId = ALICE): Principal => ({ userId, keyId: 'key-1', scopes, email: 'alice@x.test' })
export const rpc = (method: string, params?: unknown, id: number | string = 1) => JSON.stringify({ jsonrpc: '2.0', id, method, ...(params !== undefined ? { params } : {}) })
export const call = (name: string, args: unknown, id: number | string = 1) => rpc('tools/call', { name, arguments: args }, id)
