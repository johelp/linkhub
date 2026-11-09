import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildOrderMessage, validateOrder, resolveCart, orderTotals, whatsappOrderUrl } from '../src/lib/orders.ts'

const L = (name: string) => Object.fromEntries(['es', 'en', 'pt', 'fr', 'de', 'it'].map(l => [l, { name: l === 'es' ? name : '' }]))
const data = {
  currency: 'ARS', whatsapp: '+54 9 11 2345 6789', delivery: true, pickup: true, deliveryFee: 1500, minOrder: 10000, notesPlaceholder: '',
  translations: {},
  categories: [{ id: 'c', translations: L('Burgers'), items: [
    { id: 'a', translations: L('Clásica'), price: 8500, available: true },
    { id: 'b', translations: L('Agotada'), price: 9000, available: false },
  ] }],
} as never

test('cart ignores unavailable and unknown items and caps quantity', () => {
  const r = resolveCart(data, [{ itemId: 'a', qty: 2 }, { itemId: 'b', qty: 1 }, { itemId: 'zzz', qty: 1 }, { itemId: 'a', qty: 999 }], 'es')
  assert.equal(r.lines.length, 2)
  assert.equal(r.lines.find(l => l.id === 'a' && l.qty === 2)!.total, 17000)
})

test('totals add delivery fee only for delivery', () => {
  assert.equal(orderTotals(data, 10000, 'delivery').total, 11500)
  assert.equal(orderTotals(data, 10000, 'pickup').total, 10000)
})

test('validation: empty cart, minimum, name, address', () => {
  const c = { name: '', fulfillment: 'delivery' as const, address: '', notes: '' }
  assert.equal(validateOrder(data, [], c, 'es').ok, false)
  assert.match(validateOrder(data, [{ itemId: 'a', qty: 0 }], c, 'es').error!, /vacío/)
  assert.match(validateOrder(data, [{ itemId: 'a', qty: 1 }], c, 'es').error!, /mínimo/)
  assert.match(validateOrder(data, [{ itemId: 'a', qty: 2 }], c, 'es').error!, /nombre/)
  assert.match(validateOrder(data, [{ itemId: 'a', qty: 2 }], { ...c, name: 'Ana' }, 'es').error!, /dirección/)
  assert.equal(validateOrder(data, [{ itemId: 'a', qty: 2 }], { ...c, name: 'Ana', address: 'Thames 1' }, 'es').ok, true)
})

test('message is complete and url-encodes safely', () => {
  const msg = buildOrderMessage({ data, pageName: 'Don Pepe', cart: [{ itemId: 'a', qty: 2 }], customer: { name: 'Ana', fulfillment: 'delivery', address: 'Thames 1', notes: 'sin sal & pimienta' }, lang: 'es' })
  assert.match(msg, /2 × Clásica/)
  assert.match(msg, /Entrega a domicilio: Thames 1/)
  const url = whatsappOrderUrl('+54 9 11 2345 6789', msg)
  assert.ok(url.startsWith('https://wa.me/5491123456789?text='))
  assert.ok(!url.includes(' ') && !url.includes('&p'))
})
