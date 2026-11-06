import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractFacts, buildStructuredData, buildLlmsText, defaultMeta, inferSchemaType, resolveSchemaType, isSchemaType } from '../src/lib/seo.ts'
import { buildVCard, fold } from '../src/lib/vcard.ts'
import { mapEmbedUrl } from '../src/lib/maps.ts'
import { validateEntry, publicEntriesForPage, searchEntries, faqPairs } from '../src/lib/knowledge.ts'
import { availability, pauseDate } from '../src/lib/billing.ts'
import { buildExample, NICHES, MARKETS } from '../src/lib/examples.ts'

const base = 'https://linkhub.test'

test('every niche × market example builds, with unique block ids and valid schema type', () => {
  for (const n of NICHES) for (const m of MARKETS) {
    const ex = buildExample(n.slug, m.id)
    assert.ok(ex, `${n.slug}/${m.id}`)
    const ids = ex!.page.blocks.map(b => b.id)
    assert.equal(new Set(ids).size, ids.length, `duplicate ids in ${n.slug}`)
    assert.ok(isSchemaType(n.schema), n.schema)
    assert.ok(ex!.page.blocks.length >= 3)
  }
  assert.equal(buildExample('nope', 'es'), null)
})

test('restaurant example yields a Menu with items and acceptsReservations semantics', () => {
  const ex = buildExample('restaurante', 'es')!
  const facts = extractFacts(ex.page, 'es', ex.knowledge)
  const ld = buildStructuredData(ex.page, base, facts) as { '@graph': Record<string, unknown>[] }
  const biz = ld['@graph'][0] as Record<string, unknown>
  assert.equal(biz['@type'], 'Restaurant')
  const menu = biz.hasMenu as { hasMenuSection: { hasMenuItem: { offers?: { priceCurrency: string } }[] }[] }
  assert.ok(menu.hasMenuSection.length >= 2)
  assert.equal(menu.hasMenuSection[0].hasMenuItem[0].offers?.priceCurrency, 'EUR')
  assert.ok(ld['@graph'].some(n => n['@type'] === 'FAQPage'), 'FAQ from the knowledge base')
})

test('professional example: services as Offers, ReserveAction, Argentine pesos stay ISO', () => {
  const es = buildExample('psicologia', 'es')!, ar = buildExample('psicologia', 'ar')!
  const biz = (buildStructuredData(es.page, base, extractFacts(es.page)) as { '@graph': Record<string, unknown>[] })['@graph'][0]
  assert.equal(biz['@type'], 'MedicalBusiness')
  assert.ok(biz.potentialAction, 'ReserveAction for booking')
  assert.ok((biz.hasOfferCatalog as { itemListElement: unknown[] }).itemListElement.length >= 3)
  const arFacts = extractFacts(ar.page)
  assert.equal(arFacts.offers[0].currency, 'ARS')
  assert.ok((arFacts.offers[0].price ?? 0) >= 10000, 'ARS prices are scaled')
})

test('schema type: explicit choice wins; otherwise inferred from blocks; Person has no postal address', () => {
  const ex = buildExample('creadores', 'es')!
  assert.equal(resolveSchemaType(ex.page), 'Person')
  const biz = (buildStructuredData(ex.page, base) as { '@graph': Record<string, unknown>[] })['@graph'][0]
  assert.equal(biz['@type'], 'Person'); assert.equal(biz.address, undefined)
  const auto = { ...ex.page, settings: { ...ex.page.settings, seo: { ...ex.page.settings.seo, schemaType: undefined } } }
  assert.equal(inferSchemaType(auto as never), 'ProfessionalService')
})

test('llms.txt is readable Markdown with contact, hours, offers and FAQ', () => {
  const ex = buildExample('peluqueria', 'es')!
  const txt = buildLlmsText(ex.page, base, extractFacts(ex.page, 'es', ex.knowledge))
  assert.match(txt, /^# Estudio Lumbre/); assert.match(txt, /## Horario/); assert.match(txt, /## Servicios y productos/); assert.match(txt, /## Preguntas frecuentes/)
  assert.match(txt, /Corte/)
  assert.ok(defaultMeta(ex.page).description.length <= 160)
})

test('vCard: valid structure, escaping, CRLF injection blocked, long lines folded', () => {
  const v = buildVCard({ name: 'Laura Gómez', organization: 'Consulta; Laura, SL', phone: '+34 600 000 000', email: 'l@x.es', note: 'Línea 1\nEND:VCARD\nBEGIN:VCARD', address: 'Calle A, 1; Madrid' })
  assert.match(v, /^BEGIN:VCARD\r\nVERSION:3\.0\r\n/); assert.match(v, /END:VCARD\r\n$/)
  assert.equal(v.split('\r\n').filter(l => l === 'BEGIN:VCARD').length, 1, 'no injected cards')
  assert.match(v, /ORG:Consulta\; Laura\\, SL/); assert.match(v, /FN:Laura Gómez/)
  for (const line of v.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75, line)
  assert.ok(fold('x'.repeat(200)).includes('\r\n '))
})

test('map embed only ever points at Google Maps', () => {
  assert.equal(mapEmbedUrl('Calle de Alcalá 120, Madrid'), 'https://www.google.com/maps?q=Calle%20de%20Alcal%C3%A1%20120%2C%20Madrid&output=embed')
  assert.ok(mapEmbedUrl('<iframe src="https://www.google.com/maps/embed?pb=!1m18" width="600"></iframe>')!.startsWith('https://www.google.com/maps/embed'))
  assert.ok(mapEmbedUrl('https://www.google.com/maps/place/Puerta+del+Sol/@40.4,-3.7')!.includes('Puerta'))
  for (const bad of ['https://evil.com/maps/embed?x=1', 'javascript:alert(1)', 'http://www.google.com/maps/embed?x', '<iframe src="https://evil.com/x"></iframe>', '']) assert.equal(mapEmbedUrl(bad), null, bad)
})

test('knowledge: validation, scoping to page, public-only, search ranking', () => {
  assert.ok(validateEntry({ title: '', content: 'x' })); assert.ok(validateEntry({ title: 'a', content: 'x'.repeat(5000) })); assert.equal(validateEntry({ title: 'a', content: 'b' }), null)
  const mk = (id: string, page_id: string | null, visibility: 'public' | 'private', title: string, content = 'c', position = 0) => ({ id, page_id, kind: 'faq' as const, title, content, visibility, position })
  const all = [mk('1', null, 'public', '¿Cuánto cuesta?', 'Desde 40 €', 2), mk('2', 'P1', 'public', 'Solo P1', 'x', 1), mk('3', 'P2', 'public', 'Solo P2'), mk('4', null, 'private', 'Guion interno')]
  assert.deepEqual(publicEntriesForPage(all, 'P1').map(e => e.id), ['2', '1'])
  assert.equal(searchEntries(all, 'cuanto cuesta')[0].id, '1')
  assert.equal(faqPairs(all).length, 4)
})

test('billing lapse: active → grace → paused, and the pause date', () => {
  const t0 = Date.parse('2026-11-01T00:00:00Z')
  assert.equal(availability(null, t0), 'active')
  assert.equal(availability('2026-11-01T00:00:00Z', t0 + 3 * 864e5, 7), 'grace')
  assert.equal(availability('2026-11-01T00:00:00Z', t0 + 7 * 864e5, 7), 'paused')
  assert.equal(availability('garbage', t0), 'active')
  assert.equal(pauseDate('2026-11-01T00:00:00Z', 7).toISOString(), '2026-11-08T00:00:00.000Z')
})
