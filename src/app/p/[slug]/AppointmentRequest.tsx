'use client'
import { useMemo, useState, useSyncExternalStore } from 'react'
import type { AppointmentRequestBlock, Lang } from '@/types'
import { buildAppointmentMessage, buildDays, localNow, longDayLabel, validateAppointment } from '@/lib/appointments'
import { formatMoney, whatsappOrderUrl } from '@/lib/orders'

interface Props {
  block: AppointmentRequestBlock
  lang: Lang
  pc: string
  pageName: string
  editing: boolean
  onSent?: (url: string) => void
}

const INK = '#1A1B1C'
const MUTED = '#5A5D60'
const BORDER = 'rgba(26,27,28,0.09)'

// A minute-resolution clock that is 0 on the server: slots depend on "now",
// so they render only after hydration (no server/client mismatch, no effect).
const subscribeNoop = () => () => {}
const minuteNow = () => Math.floor(Date.now() / 60000)
const serverNow = () => 0

// Public appointment request: service -> day -> time -> name -> WhatsApp.
// Phase 1 only *requests* a slot; the owner confirms availability by chat.
export function AppointmentRequest({ block, lang, pc, pageName, editing, onSent }: Props) {
  const d = block.data
  const t = d.translations[lang]?.title ? d.translations[lang] : d.translations.es
  const minute = useSyncExternalStore(subscribeNoop, minuteNow, serverNow)

  const [serviceId, setServiceId] = useState(d.services[0]?.id ?? '')
  const [dayKey, setDayKey] = useState('')
  const [time, setTime] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const service = d.services.find(s => s.id === serviceId) ?? d.services[0]
  const days = useMemo(() => {
    if (!minute || !service) return []
    return buildDays(d, service.durationMin, localNow(d.timezone, new Date(minute * 60000)), lang)
  }, [minute, d, service, lang])
  const day = days.find(x => x.key === dayKey)

  function pickService(id: string) { setServiceId(id); setDayKey(''); setTime(''); setError(null) }
  function pickDay(key: string) { setDayKey(key); setTime(''); setError(null) }

  function send() {
    const req = { serviceId: service?.id ?? '', dayKey, time, name, phone, notes }
    const v = validateAppointment(d, req)
    if (!v.ok) { setError(v.error ?? null); return }
    const url = whatsappOrderUrl(d.whatsapp, buildAppointmentMessage({ data: d, pageName, req, lang }))
    onSent?.(url)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const field: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${BORDER}`, fontSize: 14,
    fontFamily: 'inherit', color: INK, background: '#fff', outline: 'none', boxSizing: 'border-box',
  }
  const chip = (active: boolean): React.CSSProperties => ({
    padding: '8px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, transition: 'background .15s, color .15s, border-color .15s, transform .1s',
    border: `1.5px solid ${active ? pc : BORDER}`, background: active ? pc : '#fff', color: active ? '#fff' : INK,
  })
  const label: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#9A9D9F', letterSpacing: '.8px', textTransform: 'uppercase', margin: '14px 0 6px' }

  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 16, marginBottom: 8, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 4px' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: INK }}>📅 {t?.title || 'Reservá tu turno'}</div>
        {t?.description && <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>{t.description}</div>}
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        {d.services.length > 1 && (
          <>
            <div style={label}>Servicio</div>
            <div style={{ display: 'grid', gap: 6 }} role="radiogroup" aria-label="Servicio">
              {d.services.map(s => {
                const n = s.translations[lang]?.name || s.translations.es?.name
                if (!n) return null
                const active = s.id === service?.id
                return (
                  <button className="lh-press" key={s.id} type="button" role="radio" aria-checked={active} onClick={() => pickService(s.id)}
                    style={{ ...chip(active), textAlign: 'left', display: 'flex', justifyContent: 'space-between', gap: 8, width: '100%' }}>
                    <span>{n}</span>
                    <span style={{ fontWeight: 500, opacity: 0.85 }}>{s.durationMin} min{s.price ? ` · ${formatMoney(s.price, d.currency)}` : ''}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        <div style={label}>Día</div>
        {days.length === 0 ? (
          <div style={{ fontSize: 12.5, color: '#9A9D9F' }}>{minute ? 'No hay turnos disponibles en los próximos días.' : 'Cargando disponibilidad…'}</div>
        ) : (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }} role="radiogroup" aria-label="Día">
            {days.map(x => (
              <button className="lh-press" key={x.key} type="button" role="radio" aria-checked={x.key === dayKey} onClick={() => pickDay(x.key)} style={chip(x.key === dayKey)}>{x.label}</button>
            ))}
          </div>
        )}

        {day && (
          <>
            <div style={label}>Horario</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} role="radiogroup" aria-label="Horario">
              {day.slots.map(s => (
                <button className="lh-press" key={s} type="button" role="radio" aria-checked={s === time} onClick={() => { setTime(s); setError(null) }} style={chip(s === time)}>{s}</button>
              ))}
            </div>
          </>
        )}

        {time && (
          <div className="lh-expand" style={{ display: 'grid', gap: 8, marginTop: 14 }}>
            <div style={{ fontSize: 13, color: MUTED }}>
              {service?.translations[lang]?.name || service?.translations.es?.name} · <b style={{ color: INK }}>{longDayLabel(dayKey, lang)}, {time}</b>
            </div>
            <input aria-label="Tu nombre" placeholder="Tu nombre" value={name} maxLength={60} onChange={e => setName(e.target.value)} style={field} />
            <input aria-label="Tu teléfono (opcional)" placeholder="Tu teléfono (opcional)" inputMode="tel" value={phone} maxLength={30} onChange={e => setPhone(e.target.value)} style={field} />
            <textarea aria-label="Notas" placeholder="Algo que debamos saber (opcional)" value={notes} maxLength={200} rows={2} onChange={e => setNotes(e.target.value)} style={{ ...field, resize: 'none' }} />
            {error && <div role="alert" style={{ fontSize: 12.5, color: '#B50F07' }}>{error}</div>}
            <button className="lh-press" type="button" onClick={send}
              style={{ width: '100%', padding: '13px 16px', borderRadius: 12, border: 'none', background: '#25D366', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              💬 Solicitar turno por WhatsApp
            </button>
            <div style={{ fontSize: 11, color: '#9A9D9F', textAlign: 'center' }}>Es una solicitud: te confirman la disponibilidad por WhatsApp</div>
          </div>
        )}
        {error && !time && <div role="alert" style={{ marginTop: 8, fontSize: 12.5, color: '#B50F07' }}>{error}</div>}
        {editing && d.whatsapp.replace(/\D/g, '').length < 8 && (
          <div style={{ marginTop: 10, fontSize: 11.5, color: '#B45309' }}>⚠ Falta tu número de WhatsApp para recibir solicitudes</div>
        )}
      </div>
    </div>
  )
}
