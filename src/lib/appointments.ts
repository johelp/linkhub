import type { AppointmentRequestBlock, DaySchedule, Lang } from '@/types'
import { formatMoney } from '@/lib/orders'

type Data = AppointmentRequestBlock['data']

export interface LocalNow { y: number; m: number; d: number; minutes: number }

// "Now" as a calendar date + minutes-since-midnight in the business's own
// timezone (the visitor may be anywhere). Falls back to UTC on a bad tz.
export function localNow(timezone: string, at: Date = new Date()): LocalNow {
  let parts: Intl.DateTimeFormatPart[]
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(at)
  } catch {
    return localNow('UTC', at)
  }
  const n = (t: string) => Number(parts.find(p => p.type === t)?.value ?? 0)
  const hour = n('hour') % 24 // some engines emit "24" at midnight
  return { y: n('year'), m: n('month'), d: n('day'), minutes: hour * 60 + n('minute') }
}

export interface DayOption {
  key: string        // YYYY-MM-DD
  weekday: number    // 0 = Sunday
  label: string      // "jue 14 nov"
  slots: string[]    // ["09:00", "10:00", ...]
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}
const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

// Offered start times for one day: every `step` minutes from opening until the
// service would still fit before closing.
export function slotsForDay(day: DaySchedule | undefined, durationMin: number, step: number): string[] {
  if (!day || day.closed) return []
  const open = toMin(day.open)
  const close = toMin(day.close)
  const s = Math.max(step, 5)
  const out: string[] = []
  for (let t = open; t + durationMin <= close; t += s) out.push(toHHMM(t))
  return out
}

// The bookable days, starting today (in the business's timezone). Today's
// slots are trimmed by the minimum notice; days with nothing left are dropped.
export function buildDays(data: Data, durationMin: number, now: LocalNow, lang: Lang): DayOption[] {
  const out: DayOption[] = []
  const horizon = Math.min(Math.max(data.daysAhead || 14, 1), 60)
  const fmt = new Intl.DateTimeFormat(lang, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
  for (let i = 0; i <= horizon; i++) {
    const date = new Date(Date.UTC(now.y, now.m - 1, now.d + i))
    const weekday = date.getUTCDay()
    let slots = slotsForDay(data.schedule.find(s => s.day === weekday), durationMin, data.slotMinutes)
    if (i === 0) {
      const earliest = now.minutes + Math.max(data.minNoticeHours || 0, 0) * 60
      slots = slots.filter(t => toMin(t) >= earliest)
    }
    if (slots.length) {
      out.push({ key: date.toISOString().slice(0, 10), weekday, label: fmt.format(date).replace(/\./g, ''), slots })
    }
  }
  return out
}

export function longDayLabel(key: string, lang: Lang): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)))
}

export interface AppointmentRequest {
  serviceId: string
  dayKey: string
  time: string
  name: string
  phone: string
  notes: string
}

function serviceName(s: Data['services'][number], lang: Lang) {
  return s.translations[lang]?.name?.trim() || s.translations.es?.name?.trim() || 'Servicio'
}

export function validateAppointment(data: Data, req: AppointmentRequest): { ok: boolean; error?: string } {
  if (!data.services.some(s => s.id === req.serviceId)) return { ok: false, error: 'Elegí un servicio' }
  if (!req.dayKey) return { ok: false, error: 'Elegí un día' }
  if (!req.time) return { ok: false, error: 'Elegí un horario' }
  if (!req.name.trim()) return { ok: false, error: 'Decinos tu nombre' }
  if (data.whatsapp.replace(/\D/g, '').length < 8) return { ok: false, error: 'Este negocio todavía no configuró su WhatsApp' }
  return { ok: true }
}

export function buildAppointmentMessage(opts: { data: Data; pageName: string; req: AppointmentRequest; lang: Lang }): string {
  const { data, pageName, req, lang } = opts
  const svc = data.services.find(s => s.id === req.serviceId)
  const lines = [
    `*Solicitud de turno · ${pageName}*`,
    '',
    `Servicio: ${svc ? serviceName(svc, lang) : '—'}${svc ? ` (${svc.durationMin} min)` : ''}`,
    `Día: ${longDayLabel(req.dayKey, lang)}`,
    `Hora: ${req.time}`,
    `Nombre: ${req.name.trim()}`,
  ]
  if (req.phone.trim()) lines.push(`Teléfono: ${req.phone.trim()}`)
  if (svc?.price) lines.push(`Precio: ${formatMoney(svc.price, data.currency)}`)
  if (req.notes.trim()) lines.push(`Notas: ${req.notes.trim()}`)
  lines.push('', '¿Me confirmás disponibilidad? Gracias.')
  return lines.join('\n').slice(0, 1500)
}
