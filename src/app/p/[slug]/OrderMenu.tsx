'use client'
import { useMemo, useState } from 'react'
import type { Lang, OrderMenuBlock } from '@/types'
import {
  MAX_QTY, buildOrderMessage, formatMoney, orderTotals, resolveCart, validateOrder, whatsappOrderUrl,
  type CartLine, type Fulfillment,
} from '@/lib/orders'

interface Props {
  block: OrderMenuBlock
  lang: Lang
  pc: string            // page primary color
  pageName: string
  editing: boolean
  onSent?: (url: string) => void
}

const INK = '#1A1B1C'
const MUTED = '#5A5D60'
const BORDER = 'rgba(26,27,28,0.09)'

// Public mini-store: browse by category, build a cart, review, and send the
// order to the owner's WhatsApp. No payment is taken by LinkHub.
export function OrderMenu({ block, lang, pc, pageName, editing, onSent }: Props) {
  const d = block.data
  const t = d.translations[lang]?.title ? d.translations[lang] : d.translations.es
  const [cart, setCart] = useState<CartLine[]>([])
  const [step, setStep] = useState<'browse' | 'checkout'>('browse')
  const [fulfillment, setFulfillment] = useState<Fulfillment>(d.delivery ? 'delivery' : 'pickup')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const resolved = useMemo(() => resolveCart(d, cart, lang), [d, cart, lang])
  const mode: Fulfillment = fulfillment === 'delivery' && !d.delivery ? 'pickup' : fulfillment === 'pickup' && !d.pickup ? 'delivery' : fulfillment
  const { fee, total } = orderTotals(d, resolved.subtotal, mode)
  const qtyOf = (id: string) => cart.find(l => l.itemId === id)?.qty ?? 0

  function setQty(itemId: string, qty: number) {
    const q = Math.max(0, Math.min(qty, MAX_QTY))
    setCart(c => {
      const rest = c.filter(l => l.itemId !== itemId)
      return q ? [...rest, { itemId, qty: q }] : rest
    })
    setError(null)
  }

  function send() {
    const customer = { name, fulfillment: mode, address, notes }
    const v = validateOrder(d, cart, customer, lang)
    if (!v.ok) { setError(v.error ?? null); return }
    const url = whatsappOrderUrl(d.whatsapp, buildOrderMessage({ data: d, pageName, cart, customer, lang }))
    onSent?.(url)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const field: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${BORDER}`, fontSize: 14,
    fontFamily: 'inherit', color: INK, background: '#fff', outline: 'none', boxSizing: 'border-box',
  }
  const isEmpty = d.categories.every(c => c.items.length === 0)

  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, marginBottom: 8, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 6px' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>🛒 {t?.title || 'Hacé tu pedido'}</div>
        {t?.description && <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>{t.description}</div>}
      </div>

      {isEmpty && editing && (
        <div style={{ padding: '18px 16px', fontSize: 12, color: '#9A9D9F', textAlign: 'center' }}>Agregá productos para armar tu catálogo</div>
      )}

      {step === 'browse' && (
        <div style={{ padding: '4px 16px 14px' }}>
          {d.categories.map(cat => {
            const items = cat.items.filter(i => (editing || i.available) && (i.translations[lang]?.name || i.translations.es?.name))
            if (items.length === 0) return null
            return (
              <div key={cat.id}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9A9D9F', letterSpacing: '.8px', textTransform: 'uppercase', margin: '14px 0 6px' }}>
                  {cat.translations[lang]?.name || cat.translations.es?.name}
                </div>
                {items.map(item => {
                  const it = item.translations[lang]?.name ? item.translations[lang] : item.translations.es
                  const q = qtyOf(item.id)
                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid ${BORDER}`, opacity: item.available ? 1 : 0.45 }}>
                      {item.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" width={48} height={48} loading="lazy" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{it?.name}{!item.available && ' · Agotado'}</div>
                        {it?.description && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.35 }}>{it.description}</div>}
                        <div style={{ fontSize: 13, fontWeight: 700, color: pc, marginTop: 2 }}>{formatMoney(item.price, d.currency)}</div>
                      </div>
                      {item.available && (q === 0 ? (
                        <button className="lh-press" type="button" onClick={() => setQty(item.id, 1)} aria-label={`Agregar ${it?.name}`}
                          style={{ width: 34, height: 34, borderRadius: 17, border: 'none', background: pc, color: '#fff', fontSize: 20, lineHeight: 1, cursor: 'pointer', flexShrink: 0 }}>+</button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                          <button className="lh-press" type="button" onClick={() => setQty(item.id, q - 1)} aria-label="Quitar uno"
                            style={{ width: 30, height: 30, borderRadius: 15, border: `1.5px solid ${BORDER}`, background: '#fff', fontSize: 18, lineHeight: 1, cursor: 'pointer', color: INK }}>−</button>
                          <span key={q} className="lh-bump" style={{ minWidth: 24, textAlign: 'center', fontSize: 14, fontWeight: 700, color: INK }} aria-live="polite">{q}</span>
                          <button className="lh-press" type="button" onClick={() => setQty(item.id, q + 1)} aria-label="Agregar uno más"
                            style={{ width: 30, height: 30, borderRadius: 15, border: 'none', background: pc, color: '#fff', fontSize: 18, lineHeight: 1, cursor: 'pointer' }}>+</button>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )
          })}

          {resolved.count > 0 && (
            <button className="lh-press lh-pop" type="button" onClick={() => setStep('checkout')}
              style={{ marginTop: 14, width: '100%', padding: '13px 16px', borderRadius: 12, border: 'none', background: pc, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontFamily: 'inherit' }}>
              <span>Ver mi pedido ({resolved.count})</span>
              <span>{formatMoney(resolved.subtotal, d.currency)}</span>
            </button>
          )}
        </div>
      )}

      {step === 'checkout' && (
        <div className="lh-expand" style={{ padding: '8px 16px 16px' }}>
          <button className="lh-press" type="button" onClick={() => setStep('browse')}
            style={{ border: 'none', background: 'none', color: MUTED, fontSize: 13, cursor: 'pointer', padding: '4px 0 8px', fontFamily: 'inherit' }}>← Seguir pidiendo</button>

          {resolved.lines.map(l => (
            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, padding: '5px 0', color: INK }}>
              <span>{l.qty} × {l.name}</span><span>{formatMoney(l.total, d.currency)}</span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 8, paddingTop: 8, fontSize: 13, color: MUTED }}>
            {fee > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Envío</span><span>{formatMoney(fee, d.currency)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: INK, marginTop: 2 }}><span>Total</span><span>{formatMoney(total, d.currency)}</span></div>
          </div>

          <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
            {d.delivery && d.pickup && (
              <div role="radiogroup" aria-label="Forma de entrega" style={{ display: 'flex', gap: 6 }}>
                {(['delivery', 'pickup'] as const).map(m => (
                  <button className="lh-press" key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setFulfillment(m)}
                    style={{ flex: 1, padding: '9px 8px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      border: `1.5px solid ${mode === m ? pc : BORDER}`, background: mode === m ? pc : '#fff', color: mode === m ? '#fff' : INK }}>
                    {m === 'delivery' ? '🛵 Envío' : '🏪 Retiro'}
                  </button>
                ))}
              </div>
            )}
            <input aria-label="Tu nombre" placeholder="Tu nombre" value={name} maxLength={60} onChange={e => setName(e.target.value)} style={field} />
            {mode === 'delivery' && (
              <input aria-label="Dirección de entrega" placeholder="Dirección de entrega" value={address} maxLength={120} onChange={e => setAddress(e.target.value)} style={field} />
            )}
            <textarea aria-label="Notas" placeholder={d.notesPlaceholder || 'Aclaraciones'} value={notes} maxLength={200} rows={2}
              onChange={e => setNotes(e.target.value)} style={{ ...field, resize: 'none' }} />
          </div>

          {error && <div role="alert" style={{ marginTop: 8, fontSize: 12.5, color: '#B50F07' }}>{error}</div>}

          <button className="lh-press" type="button" onClick={send}
            style={{ marginTop: 12, width: '100%', padding: '13px 16px', borderRadius: 12, border: 'none', background: '#25D366', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            💬 Enviar pedido por WhatsApp
          </button>
          <div style={{ marginTop: 6, fontSize: 11, color: '#9A9D9F', textAlign: 'center' }}>Se abrirá WhatsApp con tu pedido listo para enviar</div>
        </div>
      )}
    </div>
  )
}
