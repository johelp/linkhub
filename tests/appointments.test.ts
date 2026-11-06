import { test } from 'node:test'
import assert from 'node:assert/strict'
import { slotsForDay, buildDays, localNow, validateAppointment, buildAppointmentMessage } from '../src/lib/appointments.ts'

const L = (name: string) => Object.fromEntries(['es', 'en', 'pt', 'fr', 'de', 'it'].map(l => [l, { name: l === 'es' ? name : '' }]))
const schedule = [0, 1, 2, 3, 4, 5, 6].map(day => ({ day, closed: day === 0, open: '09:00', close: '12:00' }))
const data = { whatsapp: '+5491123456789', timezone: 'America/Argentina/Buenos_Aires', currency: 'ARS', schedule, slotMinutes: 60, daysAhead: 7, minNoticeHours: 2,
  translations: {}, services: [{ id: 's', translations: L('Corte'), durationMin: 45, price: 9000 }] } as never

test('slots stop when the service no longer fits before closing', () => {
  assert.deepEqual(slotsForDay(schedule[1], 60, 60), ['09:00', '10:00', '11:00'])
  assert.deepEqual(slotsForDay(schedule[1], 90, 30), ['09:00', '09:30', '10:00', '10:30'])
  assert.deepEqual(slotsForDay(schedule[0], 30, 30), [])
})

test('today is trimmed by minimum notice; closed days are skipped', () => {
  // Wednesday 2026-11-04, 10:30 local -> earliest bookable is 12:30 -> nothing today
  const now = { y: 2026, m: 11, d: 4, minutes: 10 * 60 + 30 }
  const days = buildDays(data, 60, now, 'es')
  assert.equal(days[0].key, '2026-11-05')
  assert.ok(!days.some(d => d.weekday === 0), 'Sunday is closed')
  const early = buildDays(data, 60, { ...now, minutes: 6 * 60 }, 'es')
  assert.equal(early[0].key, '2026-11-04')
  assert.deepEqual(early[0].slots, ['09:00', '10:00', '11:00'])
})

test('localNow reads the calendar date in the business timezone', () => {
  // 2026-11-05T02:30Z is still Nov 4, 23:30 in Buenos Aires (UTC-3)
  const n = localNow('America/Argentina/Buenos_Aires', new Date('2026-11-05T02:30:00Z'))
  assert.deepEqual([n.y, n.m, n.d, n.minutes], [2026, 11, 4, 23 * 60 + 30])
  assert.equal(localNow('Not/AZone', new Date('2026-11-05T02:30:00Z')).d, 5) // bad tz falls back to UTC
})

test('validation and message', () => {
  const base = { serviceId: 's', dayKey: '2026-11-05', time: '10:00', name: 'Ana', phone: '', notes: '' }
  assert.equal(validateAppointment(data, { ...base, serviceId: 'x' }).ok, false)
  assert.equal(validateAppointment(data, { ...base, name: ' ' }).ok, false)
  assert.equal(validateAppointment(data, base).ok, true)
  const m = buildAppointmentMessage({ data, pageName: 'Estudio', req: base, lang: 'es' })
  assert.match(m, /Servicio: Corte \(45 min\)/)
  assert.match(m, /Hora: 10:00/)
})
