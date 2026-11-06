import test from 'node:test'
import assert from 'node:assert/strict'
import { sanitizeDraft, heuristicDraft, draftToPage, createLimiter } from '../src/lib/aiDraft.ts'

const okSchema = (v: unknown) => v === 'HairSalon'

test('sanitizeDraft strips markup, clamps lengths and drops bad values', () => {
  const d = sanitizeDraft({
    tagline: '<img onerror=x> Peluquería  de barrio', bio: 'b'.repeat(900),
    services: Array.from({ length: 10 }, (_, i) => ({ title: `S${i}`, description: 'd' })),
    faq: [{ question: '¿Q?', answer: '' }, { question: '¿Ok?', answer: 'Sí' }],
    schemaType: 'Nope', color: 'red',
  }, okSchema)!
  assert.doesNotMatch(d.tagline, /[<>]/)
  assert.equal(d.bio.length, 500)
  assert.equal(d.services.length, 6)
  assert.equal(d.faq.length, 1)
  assert.equal(d.schemaType, 'LocalBusiness')
  assert.equal(d.color, '#E8150A')
})

test('sanitizeDraft accepts a valid schema type and rejects empty output', () => {
  assert.equal(sanitizeDraft({ tagline: 'x', schemaType: 'HairSalon' }, okSchema)!.schemaType, 'HairSalon')
  assert.equal(sanitizeDraft({}, okSchema), null)
  assert.equal(sanitizeDraft('texto', okSchema), null)
})

test('heuristicDraft always yields something usable', () => {
  const d = heuristicDraft({ businessName: 'Ana', description: 'Soy dietista en Sevilla. Hago planes personalizados.' })
  assert.equal(d.tagline, 'Soy dietista en Sevilla.')
})

test('draftToPage builds ordered blocks with no external URLs', () => {
  let n = 0
  const page = draftToPage({ tagline: 't', bio: 'bio', services: [{ title: 'A', description: '' }], faq: [{ question: 'q', answer: 'a' }], schemaType: 'Store', color: '#112233' }, () => `id${n++}`)
  assert.deepEqual(page.blocks.map(b => b.type), ['text', 'section_label', 'link', 'faq', 'contact_card'])
  assert.deepEqual(page.blocks.map(b => b.order), [0, 1, 2, 3, 4])
  assert.equal((page.blocks[2].data as { url: string }).url, '#')
  assert.equal(page.knowledge.length, 1)
})

test('limiter allows N hits per window', () => {
  let now = 0
  const ok = createLimiter(2, 1000, () => now)
  assert.equal(ok('u'), true); assert.equal(ok('u'), true); assert.equal(ok('u'), false)
  assert.equal(ok('v'), true)
  now = 2000
  assert.equal(ok('u'), true)
})
