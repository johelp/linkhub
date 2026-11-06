import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MAX_BLOCKS, evaluatePageWrite, pageWriteError, validateBlocks, validatePageInput, validateSettings } from '../src/lib/pageWrite.ts'
import { resolveFlags } from '../src/lib/flags.ts'
import type { Block } from '../src/types/index.ts'

const blk = (id: string, type: string, data: object = {}) => ({ id, type, data, visible: true, order: 0, seasonFilter: 'always' }) as unknown as Block
const flags = (on: string[] = []) => resolveFlags('u', [], on.map(flag_key => ({ flag_key, enabled: true })), false)
const ctx = (plan: 'free' | 'pro', existing: Block[] = [], fl = flags()) => ({ existingBlocks: existing, getPlan: async () => plan, getFlags: async () => fl })

test('field validation keeps the messages the editor already relied on', () => {
  assert.equal(validatePageInput({ name: '' }), 'Nombre inválido')
  assert.equal(validatePageInput({ name: 'x'.repeat(81) }), 'Nombre inválido')
  assert.equal(validatePageInput({ published: 'yes' }), 'published debe ser boolean')
  assert.equal(validatePageInput({ blocks: 'x' }), 'blocks debe ser una lista')
  assert.equal(validatePageInput({ blocks: Array.from({ length: MAX_BLOCKS + 1 }, (_, i) => blk(`b${i}`, 'link')) }), `Máximo ${MAX_BLOCKS} bloques por página`)
  assert.equal(validateBlocks([blk('a', 'link'), blk('a', 'link')]), 'IDs de bloque duplicados')
  assert.equal(validateBlocks([{ id: 1 }]), 'Bloque con formato inválido')
  assert.equal(validateSettings({ primaryColor: 'red' }), 'primaryColor debe ser un color hex (#RRGGBB)')
  assert.equal(validateSettings({ fontFamily: '<b>' }), 'fontFamily inválido')
  assert.equal(validateSettings([]), 'settings inválido')
  assert.equal(validatePageInput({ name: 'ok', published: true, blocks: [blk('a', 'link')], settings: { primaryColor: '#ABCDEF' } }), null)
})

test('plan limits: a free account cannot write pro block types; pro can', async () => {
  const blocks = [blk('a', 'link'), blk('b', 'featured')]
  assert.deepEqual(await evaluatePageWrite({ blocks }, ctx('free')), { ok: false, status: 403, error: 'El bloque "featured" requiere plan Pro' })
  assert.equal((await evaluatePageWrite({ blocks }, ctx('pro'))).ok, true)
  assert.equal((await evaluatePageWrite({ blocks: [blk('a', 'link')] }, ctx('free'))).ok, true)
})

test('staged-rollout flags: new gated types are refused unless the page already had them', async () => {
  const menu = [blk('m', 'order_menu')]
  const refused = await evaluatePageWrite({ blocks: menu }, ctx('pro'))
  assert.deepEqual(refused, { ok: false, status: 403, error: 'Esta función todavía no está disponible para tu cuenta' })
  assert.equal((await evaluatePageWrite({ blocks: menu }, ctx('pro', menu))).ok, true, 'already on the page')
  assert.equal((await evaluatePageWrite({ blocks: menu }, ctx('pro', [], flags(['order_menu_block'])))).ok, true, 'flag on')
})

test('plan/flags are only loaded when blocks are written (same queries as before the refactor)', async () => {
  let loads = 0
  const lazy = { existingBlocks: [], getPlan: async () => { loads++; return 'free' as const }, getFlags: async () => { loads++; return flags() } }
  assert.equal((await evaluatePageWrite({ name: 'Solo nombre', settings: { primaryColor: '#000000' } }, lazy)).ok, true)
  assert.equal(loads, 0)
})

test('sanitizers run on every write: unsafe URLs are stripped, name is trimmed', async () => {
  const r = await evaluatePageWrite({
    name: '  Mi página  ',
    blocks: [blk('a', 'link', { url: 'javascript:alert(1)', title: 'ok' })],
    settings: { primaryColor: '#000000', profile: { avatarUrl: 'data:text/html,x', tagline: 'x'.repeat(500) }, seo: { ogImage: 'javascript:1' } },
  }, ctx('pro'))
  assert.ok(r.ok)
  if (!r.ok) return
  const upd = r.update as { name: string; blocks: { data: { url: string } }[]; settings: { profile: { avatarUrl: string; tagline: string }; seo: { ogImage: unknown } } }
  assert.equal(upd.name, 'Mi página')
  assert.equal(upd.blocks[0].data.url, '')
  assert.equal(upd.settings.profile.avatarUrl, '')
  assert.equal(upd.settings.profile.tagline.length, 160)
  assert.equal(upd.settings.seo.ogImage, null)
})

test('size limit and database error mapping', async () => {
  const big = [blk('a', 'link', { blob: 'x'.repeat(600 * 1024) })]
  assert.deepEqual(await evaluatePageWrite({ blocks: big }, ctx('pro')), { ok: false, status: 413, error: 'Payload demasiado grande' })
  assert.deepEqual(pageWriteError({ message: 'plan_limit_exceeded: block type x' }), { status: 403, error: 'Tu plan no permite este contenido' })
  assert.deepEqual(pageWriteError({ message: 'boom' }), { status: 500, error: 'No se pudo guardar' })
})
