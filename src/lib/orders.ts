import type { Lang, OrderMenuBlock } from '@/types'

export type Fulfillment = 'delivery' | 'pickup'

export interface CartLine { itemId: string; qty: number }

export interface OrderCustomer {
  name: string
  fulfillment: Fulfillment
  address: string
  notes: string
}

export const MAX_QTY = 50
// wa.me links break somewhere past ~2000 chars; keep a safe margin.
const MAX_MESSAGE_CHARS = 1500

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency, maximumFractionDigits: amount % 1 ? 2 : 0 }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

type Data = OrderMenuBlock['data']

function nameOf(t: Record<Lang, { name: string; description?: string }> | undefined, lang: Lang): string {
  return t?.[lang]?.name?.trim() || t?.es?.name?.trim() || 'Producto'
}

export function resolveCart(data: Data, cart: CartLine[], lang: Lang) {
  const byId = new Map(data.categories.flatMap(c => c.items).map(i => [i.id, i]))
  const lines = cart
    .map(l => {
      const item = byId.get(l.itemId)
      if (!item || !item.available || l.qty <= 0) return null
      const qty = Math.min(l.qty, MAX_QTY)
      return { id: item.id, name: nameOf(item.translations, lang), qty, unit: item.price, total: item.price * qty }
    })
    .filter((l): l is NonNullable<typeof l> => l !== null)
  return { lines, subtotal: lines.reduce((s, l) => s + l.total, 0), count: lines.reduce((s, l) => s + l.qty, 0) }
}

export function orderTotals(data: Data, subtotal: number, fulfillment: Fulfillment) {
  const fee = fulfillment === 'delivery' ? Math.max(data.deliveryFee || 0, 0) : 0
  return { fee, total: subtotal + fee }
}

// Plain-text order the owner receives in WhatsApp. Pure and deterministic so
// it can be unit-tested and previewed in the editor.
export function buildOrderMessage(opts: {
  data: Data
  pageName: string
  cart: CartLine[]
  customer: OrderCustomer
  lang: Lang
}): string {
  const { data, pageName, cart, customer, lang } = opts
  const { lines, subtotal } = resolveCart(data, cart, lang)
  const { fee, total } = orderTotals(data, subtotal, customer.fulfillment)
  const cur = data.currency
  const out: string[] = [`*Nuevo pedido · ${pageName}*`, '']
  for (const l of lines) out.push(`• ${l.qty} × ${l.name} — ${formatMoney(l.total, cur)}`)
  out.push('')
  out.push(`Subtotal: ${formatMoney(subtotal, cur)}`)
  if (customer.fulfillment === 'delivery' && fee > 0) out.push(`Envío: ${formatMoney(fee, cur)}`)
  out.push(`*Total: ${formatMoney(total, cur)}*`, '')
  out.push(`Cliente: ${customer.name.trim()}`)
  if (customer.fulfillment === 'delivery') out.push(`Entrega a domicilio: ${customer.address.trim()}`)
  else out.push('Retiro en el local')
  if (customer.notes.trim()) out.push(`Notas: ${customer.notes.trim()}`)
  const text = out.join('\n')
  return text.length > MAX_MESSAGE_CHARS ? `${text.slice(0, MAX_MESSAGE_CHARS - 1)}…` : text
}

export function whatsappOrderUrl(number: string, message: string): string {
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
}

export interface OrderValidation { ok: boolean; error?: string }

export function validateOrder(data: Data, cart: CartLine[], customer: OrderCustomer, lang: Lang): OrderValidation {
  const { lines, subtotal } = resolveCart(data, cart, lang)
  if (lines.length === 0) return { ok: false, error: 'Tu pedido está vacío' }
  if (data.minOrder > 0 && subtotal < data.minOrder) {
    return { ok: false, error: `El pedido mínimo es ${formatMoney(data.minOrder, data.currency)}` }
  }
  if (!customer.name.trim()) return { ok: false, error: 'Decinos tu nombre' }
  if (customer.fulfillment === 'delivery' && !customer.address.trim()) return { ok: false, error: 'Indicá la dirección de entrega' }
  if (data.whatsapp.replace(/\D/g, '').length < 8) return { ok: false, error: 'Este negocio todavía no configuró su WhatsApp' }
  return { ok: true }
}
