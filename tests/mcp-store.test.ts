import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createOwnerStore, createPublicStore } from '../src/lib/mcp/store.ts'
import { ALICE, ALICE_PAGE, BOB, BOB_PAGE, fakeDb, world } from './helpers/mcpFixtures.ts'

// The store runs with the service role (no RLS), so the explicit user_id /
// published filters ARE the security boundary. These tests pin them.

test('every owner query is filtered by user_id (or by ids already proven to be the owner\'s)', async () => {
  const w = world()
  const s = createOwnerStore(w.db)
  await s.getPlan(ALICE)
  await s.listPages(ALICE)
  await s.getPage(ALICE, { slug: 'clinica-sol' })
  await s.getPage(ALICE, { id: ALICE_PAGE })
  await s.savePage(ALICE, ALICE_PAGE, { name: 'x' })
  await s.listKnowledge(ALICE, {})
  await s.upsertKnowledge(ALICE, { page_id: null, kind: 'faq', title: 't', content: 'c', visibility: 'public', position: 0 })
  await s.deleteKnowledge(ALICE, 'whatever')
  await s.analytics(ALICE, [ALICE_PAGE, BOB_PAGE], 30)
  await s.listPayments(ALICE, { limit: 10 })
  const sensitive = w.calls.filter(c => ['pages', 'knowledge_entries'].includes(c.table) && c.op !== 'insert')
  for (const c of sensitive) assert.ok(c.filters.some(f => f === `user_id=${ALICE}` || f === 'id=' + ALICE), `${c.table}.${c.op} lacks an owner filter: ${c.filters}`)
  // ids passed by a caller are re-checked against ownership before analytics/payments use them
  const analytic = w.calls.filter(c => c.table === 'analytics_events')
  assert.ok(analytic.every(c => c.filters.some(f => f === 'page_id in' || f.startsWith('page_id='))))
  const res = await s.analytics(ALICE, [BOB_PAGE], 30)
  assert.deepEqual(res.pages, [], 'Bob\'s page id is dropped')
})

test('cross-owner access returns nothing, never another account\'s row', async () => {
  const w = world()
  const bob = createOwnerStore(w.db)
  assert.equal(await bob.getPage(BOB, { slug: 'clinica-sol' }), null)
  assert.equal(await bob.getPage(BOB, { id: ALICE_PAGE }), null)
  assert.deepEqual((await bob.listPages(BOB)).map(p => p.slug), ['tienda-bob'])
  assert.equal(await bob.deleteKnowledge(BOB, 'k1'), false)
  assert.deepEqual((await bob.listKnowledge(BOB, {})).map(e => e.id), ['k3'])
  assert.deepEqual(await bob.listPayments(BOB, { pageId: ALICE_PAGE, limit: 5 }), [])
  assert.deepEqual(await bob.savePage(BOB, ALICE_PAGE, { name: 'pwn' }), {})
  assert.equal((w.tables.pages[0] as { name: string }).name, 'Clínica Sol', 'update matched zero rows')
})

test('public store: published + indexable + not paused; public knowledge only', async () => {
  const w = world()
  const s = createPublicStore(w.db, async uid => (uid === 'paused-user' ? 'paused' : uid === ALICE ? 'grace' : 'active'))
  assert.equal((await s.getPublicPage('clinica-sol'))?.slug, 'clinica-sol', 'grace period still serves')
  for (const slug of ['borrador', 'oculta', 'pausada', 'nope']) assert.equal(await s.getPublicPage(slug), null, slug)
  const page = (await s.getPublicPage('clinica-sol'))!
  const k = await s.getPublicKnowledge(page)
  assert.deepEqual(k.map(e => e.id), ['k1'])
  const kq = w.calls.filter(c => c.table === 'knowledge_entries')
  assert.ok(kq.every(c => c.filters.includes('visibility=public') && c.filters.includes(`user_id=${ALICE}`)))
  assert.ok(w.calls.filter(c => c.table === 'pages').every(c => c.filters.includes('published=true')))
})

test('payments query selects an explicit allow-list of columns', async () => {
  // regression guard: provider secrets live elsewhere and the select list must stay explicit
  const src = (await import('node:fs')).readFileSync(new URL('../src/lib/mcp/store.ts', import.meta.url), 'utf8')
  const sel = /from\('payments'\)\.select\('([^']+)'\)/.exec(src)?.[1] ?? ''
  assert.ok(sel && !sel.includes('*'))
  assert.ok(!/token|secret|config|credential/i.test(sel))
  void fakeDb
})
