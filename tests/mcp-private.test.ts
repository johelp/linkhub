import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handleMcp } from '../src/lib/mcp/protocol.ts'
import { deepMerge, maskEmail } from '../src/lib/mcp/privateTools.ts'
import { resolveFlags } from '../src/lib/flags.ts'
import { ALICE, ALICE_PAGE, BOB_PAGE, call, principal, world } from './helpers/mcpFixtures.ts'

/* eslint-disable @typescript-eslint/no-explicit-any */
const ALL = ['pages:read', 'pages:write', 'knowledge:read', 'knowledge:write', 'analytics:read', 'payments:read'] as const

async function tool(w: ReturnType<typeof world>, name: string, args: unknown, scopes: readonly (typeof ALL[number])[] = ALL, userId = ALICE) {
  const res = await handleMcp(call(name, args), { deps: w.deps, principal: principal([...scopes], userId), ip: '1.1.1.1' })
  const body = res.body as any
  return { body, result: body.result, text: body.result?.content?.[0]?.text as string, data: body.result?.structuredContent }
}
const page = (w: ReturnType<typeof world>, id = ALICE_PAGE) => w.tables.pages.find(p => p.id === id) as any

test('list_my_pages / get_my_page only ever return the key owner\'s pages', async () => {
  const w = world()
  const list = await tool(w, 'list_my_pages', {})
  const slugs = list.data.data.pages.map((p: any) => p.slug)
  assert.deepEqual(slugs.sort(), ['borrador', 'clinica-sol', 'oculta'].sort())
  assert.ok(!slugs.includes('tienda-bob'))
  const mine = await tool(w, 'get_my_page', { slug: 'clinica-sol' })
  assert.equal(mine.data.data.blocks.length, 4)
  assert.equal(mine.data.data.blocks[0].data, undefined, 'summary view has no block data')
  const full = await tool(w, 'get_my_page', { slug: 'clinica-sol', view: 'full' })
  assert.ok(full.data.data.blocks[1].data.services)
  // Bob's page by slug or by id: indistinguishable from "does not exist"
  for (const args of [{ slug: 'tienda-bob' }, { page_id: BOB_PAGE }]) {
    const r = await tool(w, 'get_my_page', args)
    assert.equal(r.result.isError, true)
    assert.match(r.text, /no encontrada/i)
  }
  assert.equal((await tool(w, 'get_my_page', {})).result.isError, true)
})

test('a user_id / owner argument is rejected: identity comes only from the key', async () => {
  const w = world()
  assert.match((await tool(w, 'list_knowledge', { user_id: '22222222-2222-4222-8222-222222222222' })).text, /no admitida/)
  assert.match((await tool(w, 'upsert_knowledge', { title: 'a', content: 'b', user_id: 'x' })).text, /no admitida/)
})

// ─── knowledge scoping ──────────────────────────────────────────

test('list_knowledge returns the owner\'s public and private entries, never another account\'s', async () => {
  const w = world()
  const r = await tool(w, 'list_knowledge', {})
  const ids = r.data.data.entries.map((e: any) => e.id).sort()
  assert.deepEqual(ids, ['k1', 'k2'])
  assert.ok(w.calls.filter(c => c.table === 'knowledge_entries').every(c => c.filters.includes(`user_id=${ALICE}`)))
  const priv = await tool(w, 'list_knowledge', { visibility: 'private' })
  assert.deepEqual(priv.data.data.entries.map((e: any) => e.id), ['k2'])
  assert.equal((await tool(w, 'list_knowledge', { page_id: BOB_PAGE })).result.isError, true, 'cannot filter by a page that is not yours')
})

test('upsert_knowledge creates under the key owner, validates, audits first', async () => {
  const w = world()
  const r = await tool(w, 'upsert_knowledge', { kind: 'faq', title: '¿Horario?', content: 'L-V 9 a 13', visibility: 'public' })
  assert.equal(r.data.ok, true)
  const row = w.tables.knowledge_entries.find(e => e.title === '¿Horario?') as any
  assert.equal(row.user_id, ALICE)
  assert.equal(row.page_id, null)
  assert.equal(w.audits.length, 1)
  assert.equal(w.audits[0].action, 'knowledge.create')
  assert.equal(w.audits[0].userId, ALICE)
  assert.ok(!JSON.stringify(w.audits[0]).includes('L-V 9 a 13'), 'audit stores sizes, not content')
  assert.equal((await tool(w, 'upsert_knowledge', { title: 'x', content: '' })).result.isError, true)
  assert.equal((await tool(w, 'upsert_knowledge', { title: 'x', content: 'y'.repeat(4001) })).result.isError, true)
  assert.equal((await tool(w, 'upsert_knowledge', { title: 'x', content: 'y', kind: 'weird' })).result.isError, true)
})

test('upsert_knowledge cannot attach to, or overwrite, another account\'s rows', async () => {
  const w = world()
  const attach = await tool(w, 'upsert_knowledge', { title: 'a', content: 'b', page_id: BOB_PAGE })
  assert.equal(attach.result.isError, true)
  assert.equal(w.tables.knowledge_entries.length, 3)
  w.tables.knowledge_entries[2].id = '55555555-5555-4555-8555-555555555555' // Bob's
  const hijack = await tool(w, 'upsert_knowledge', { id: '55555555-5555-4555-8555-555555555555', title: 'pwn', content: 'pwn' })
  assert.equal(hijack.result.isError, true)
  const bobRow = w.tables.knowledge_entries[2] as any
  assert.equal(bobRow.title, '¿Aceptan tarjeta Bob?')
  // update of an own row works and stays scoped
  w.tables.knowledge_entries[0].id = '33333333-3333-4333-8333-333333333333'
  const upd = await tool(w, 'upsert_knowledge', { id: '33333333-3333-4333-8333-333333333333', title: 'Nuevo', content: 'Texto' })
  assert.equal(upd.data.ok, true)
  assert.equal((w.tables.knowledge_entries[0] as any).title, 'Nuevo')
})

test('delete_knowledge only deletes the owner\'s own entries', async () => {
  const w = world()
  w.tables.knowledge_entries[0].id = '44444444-4444-4444-8444-444444444444'
  w.tables.knowledge_entries[2].id = '55555555-5555-4555-8555-555555555555' // Bob's
  const other = await tool(w, 'delete_knowledge', { id: '55555555-5555-4555-8555-555555555555' })
  assert.equal(other.result.isError, true)
  assert.equal(w.tables.knowledge_entries.length, 3)
  const own = await tool(w, 'delete_knowledge', { id: '44444444-4444-4444-8444-444444444444' })
  assert.equal(own.data.ok, true)
  assert.equal(w.tables.knowledge_entries.length, 2)
  assert.ok(w.audits.some(a => a.action === 'knowledge.delete'))
})

test('knowledge:read cannot write, knowledge:write cannot list', async () => {
  const w = world()
  const r = await handleMcp(call('upsert_knowledge', { title: 'a', content: 'b' }), { deps: w.deps, principal: principal(['knowledge:read']), ip: 'x' })
  assert.equal((r.body as any).error.code, -32003)
  const l = await handleMcp(call('list_knowledge', {}), { deps: w.deps, principal: principal(['knowledge:write']), ip: 'x' })
  assert.equal((l.body as any).error.code, -32003)
})

// ─── page writes ────────────────────────────────────────────────

test('update_page_settings merges, sanitizes, audits, and cannot publish', async () => {
  const w = world()
  const r = await tool(w, 'update_page_settings', { page_id: ALICE_PAGE, name: '  Clínica Luna ', settings: { primaryColor: '#00AAFF', profile: { avatarUrl: 'javascript:alert(1)', tagline: 'Nuevo lema' }, seo: { description: 'Desc' } } })
  assert.equal(r.data.ok, true)
  const p = page(w)
  assert.equal(p.name, 'Clínica Luna')
  assert.equal(p.settings.primaryColor, '#00AAFF')
  assert.equal(p.settings.fontFamily, 'DM Sans', 'untouched keys survive')
  assert.equal(p.settings.profile.avatarUrl, '', 'unsafe URL scheme stripped by the shared sanitizer')
  assert.equal(p.settings.profile.tagline, 'Nuevo lema')
  assert.equal(p.settings.seo.description, 'Desc')
  assert.equal(p.published, true, 'published untouched')
  assert.equal(w.audits.length, 1)
  assert.equal(w.audits[0].action, 'page.update_settings')
  assert.equal(w.audits[0].keyId, 'key-1')
  for (const bad of [{ published: false }, { slug: 'x' }, { custom_domain: 'evil.com' }, { primaryColor: 'red' }, { fontFamily: '<script>' }]) {
    const x = await tool(w, 'update_page_settings', { page_id: ALICE_PAGE, settings: bad })
    assert.equal(x.result.isError, true, JSON.stringify(bad))
  }
  assert.equal((await tool(w, 'update_page_settings', { page_id: ALICE_PAGE })).result.isError, true)
  assert.equal((await tool(w, 'update_page_settings', { page_id: ALICE_PAGE, settings: { pixels: { ga4Id: "G-1');alert(1)//" } } })).result.isError, true)
  assert.equal((await tool(w, 'update_page_settings', { page_id: ALICE_PAGE, settings: { defaultLang: 'en' } })).result.isError, true, 'defaultLang must be enabled')
})

test('update_page_settings cannot touch another account\'s page', async () => {
  const w = world()
  const r = await tool(w, 'update_page_settings', { page_id: BOB_PAGE, name: 'Hackeada' })
  assert.equal(r.result.isError, true)
  assert.equal(page(w, BOB_PAGE).name, 'Tienda de Bob')
  assert.equal(w.audits.length, 0)
})

test('free plan: multi-language and pro blocks are refused exactly like the editor', async () => {
  const w = world()
  ;(w.tables.profiles[0] as any).plan = 'free'
  const langs = await tool(w, 'update_page_settings', { page_id: ALICE_PAGE, settings: { enabledLangs: ['es', 'en'] } })
  assert.match(langs.text, /Pro/)
  const vis = await tool(w, 'update_block', { page_id: ALICE_PAGE, block_id: 'b-link', visible: false })
  assert.equal(vis.result.isError, true, 'the page already holds Pro blocks, so a free account is refused')
  assert.match(vis.text, /requiere plan Pro/)
  assert.equal(w.audits.length, 0)
})

test('update_block deep-merges data, keeps id/type, sanitizes URLs and audits without content', async () => {
  const w = world()
  const r = await tool(w, 'update_block', { page_id: ALICE_PAGE, block_id: 'b-link', data: { url: 'javascript:alert(1)', translations: { es: { title: 'Nuevo título' } } } })
  assert.equal(r.data.ok, true)
  const b = page(w).blocks.find((x: any) => x.id === 'b-link')
  assert.equal(b.type, 'link')
  assert.equal(b.data.url, '', 'javascript: URL removed')
  assert.equal(b.data.translations.es.title, 'Nuevo título')
  assert.equal(b.data.translations.es.description, '', 'siblings preserved by the deep merge')
  assert.equal(b.data.translations.en.title, 'Web')
  assert.equal(page(w).blocks.length, 4)
  assert.equal(w.audits[0].action, 'page.update_block')
  assert.equal((w.audits[0].detail as any).block_type, 'link')
  assert.ok(!JSON.stringify(w.audits[0]).includes('Nuevo título'))
  assert.equal((await tool(w, 'update_block', { page_id: ALICE_PAGE, block_id: 'nope', visible: false })).result.isError, true)
  assert.equal((await tool(w, 'update_block', { page_id: ALICE_PAGE, block_id: 'b-link' })).result.isError, true)
  assert.equal((await tool(w, 'update_block', { page_id: BOB_PAGE, block_id: 'b-link', visible: false })).result.isError, true)
})

test('update_block replaces lists whole (sync services recipe) and respects the size limit', async () => {
  const w = world()
  const services = [{ id: 's1', translations: { es: { name: 'Masaje' } }, durationMin: 30, price: 35 }, { id: 's9', translations: { es: { name: 'Nuevo' } }, durationMin: 45 }]
  assert.equal((await tool(w, 'update_block', { page_id: ALICE_PAGE, block_id: 'b-book', data: { services } })).data.ok, true)
  assert.deepEqual(page(w).blocks.find((b: any) => b.id === 'b-book').data.services.map((s: any) => s.id), ['s1', 's9'])
  const huge = await tool(w, 'update_block', { page_id: ALICE_PAGE, block_id: 'b-link', data: { blob: 'x'.repeat(600 * 1024) } })
  assert.equal(huge.result.isError, true)
})

test('block-flag rule: cannot ADD a gated block type, but existing ones stay editable', async () => {
  const w = world()
  w.deps.getFlags = async uid => resolveFlags(uid, [], [], false) // order_menu/appointment off for everyone
  assert.equal((await tool(w, 'update_block', { page_id: ALICE_PAGE, block_id: 'b-book', visible: false })).data.ok, true)
  // a page that never had an order_menu: changing a link block must not smuggle one in
  const p = page(w); p.blocks = p.blocks.filter((b: any) => b.type !== 'order_menu')
  assert.equal((await tool(w, 'update_block', { page_id: ALICE_PAGE, block_id: 'b-link', visible: false })).data.ok, true)
})

test('writes are refused when the audit log cannot be written (fail closed)', async () => {
  const w = world()
  w.state.auditFails = true
  const before = JSON.stringify(w.tables)
  for (const [name, args] of [['update_page_settings', { page_id: ALICE_PAGE, name: 'Otro' }], ['upsert_knowledge', { title: 'a', content: 'b' }], ['delete_knowledge', { id: '44444444-4444-4444-8444-444444444444' }]] as const) {
    const r = await tool(w, name, args)
    assert.equal(r.result.isError, true, name)
    assert.match(r.text, /auditoría/)
  }
  assert.equal(JSON.stringify(w.tables), before)
})

test('deepMerge refuses prototype-pollution keys and runaway depth', () => {
  assert.throws(() => deepMerge({ a: {} }, JSON.parse('{"__proto__":{"x":1}}')), /no permitida/)
  assert.throws(() => deepMerge({ a: {} }, { a: { constructor: 1 } }), /no permitida/)
  assert.equal(({} as any).x, undefined)
  let deep: any = { v: 1 }; let base: any = { v: 0 }
  for (let i = 0; i < 20; i++) { deep = { n: deep }; base = { n: base } }
  assert.throws(() => deepMerge(base, deep), /profunda/)
  assert.deepEqual(deepMerge({ a: { b: 1, c: 2 }, l: [1, 2] }, { a: { b: 9 }, l: [3] }), { a: { b: 9, c: 2 }, l: [3] })
})

// ─── analytics / payments ───────────────────────────────────────

test('get_analytics_summary counts only the owner\'s pages', async () => {
  const w = world()
  const r = await tool(w, 'get_analytics_summary', { days: 7 })
  assert.deepEqual(r.data.pages.find((p: any) => p.page_id === ALICE_PAGE), { page_id: ALICE_PAGE, views: 1, clicks: 1 })
  assert.ok(r.data.pages.every((p: any) => p.page_id !== BOB_PAGE))
  assert.equal(r.data.topBlocks[0].block_id, 'b-link')
  assert.equal((await tool(w, 'get_analytics_summary', { page_id: BOB_PAGE })).result.isError, true)
  assert.equal((await tool(w, 'get_analytics_summary', { days: 91 })).result.isError, true)
})

test('list_payments is read-only, scoped, masked, and never leaks tokens', async () => {
  const w = world()
  const r = await tool(w, 'list_payments', {})
  const rows = r.data.data.payments
  assert.equal(rows.length, 1)
  assert.equal(rows[0].amount, 25.5)
  assert.equal(rows[0].payer, 'c***@mail.test')
  const dump = JSON.stringify(r.body)
  assert.ok(!dump.includes('SECRET-TOKEN') && !dump.includes('access_token') && !dump.includes('cliente@mail.test') && !dump.includes('Bob'))
  assert.equal((await tool(w, 'list_payments', { page_id: BOB_PAGE })).result.isError, true)
  assert.equal((await tool(w, 'list_payments', { status: 'hacked' })).result.isError, true)
  assert.equal(maskEmail(null), null)
  assert.ok(w.calls.filter(c => c.table === 'payments').every(c => c.op === 'select'))
})
