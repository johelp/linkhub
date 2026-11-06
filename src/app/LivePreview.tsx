'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarClock, ShoppingBag, MapPin, Clock3, Check } from 'lucide-react'
import { HERO_EXAMPLES, buildRestaurantExample } from './demoPage'
import { PageView } from './p/[slug]/PageView'
import type { Block, Page } from '@/types'

const INK = '#111314'
const BODY = '#3F4346'
const MUTED = '#5B6064'
const LINE = 'rgba(17,19,20,0.10)'

// Sector -> a real example page built from the same blocks customers use.
const SECTORS: { id: string; label: string; build: () => Page }[] = [
  { id: 'pro', label: 'Profesional', build: () => HERO_EXAMPLES[0].page },
  { id: 'salon', label: 'Estética', build: () => HERO_EXAMPLES[1].page },
  { id: 'cafe', label: 'Cafetería', build: () => HERO_EXAMPLES[2].page },
  { id: 'food', label: 'Restaurante', build: () => buildRestaurantExample() },
  { id: 'event', label: 'Eventos', build: () => HERO_EXAMPLES[3].page },
]

const COLORS = ['#E8150A', '#0F766E', '#1D4ED8', '#7C3AED', '#BE185D', '#C2410C']

// Modules the visitor can switch on/off to see the page change.
const MODULES: { id: string; label: string; icon: typeof Clock3; types: string[] }[] = [
  { id: 'book', label: 'Citas y pedidos', icon: CalendarClock, types: ['appointment_request', 'order_menu', 'menu', 'event_tickets'] },
  { id: 'hours', label: 'Horario en vivo', icon: Clock3, types: ['business_hours'] },
  { id: 'contact', label: 'Contacto y mapa', icon: MapPin, types: ['contact_card', 'map_embed'] },
  { id: 'social', label: 'Redes', icon: ShoppingBag, types: ['social_grid', 'link'] },
]

// Interactive proof: pick a sector, name, colour and modules, and use the page
// itself (book a slot, build an order): it is the real PageView in preview mode,
// so nothing opens WhatsApp and nothing is stored.
export function LivePreview() {
  const [name, setName] = useState('')
  const [sector, setSector] = useState(SECTORS[0].id)
  const [color, setColor] = useState<string | null>(null)
  const [off, setOff] = useState<Set<string>>(new Set())

  const page = useMemo<Page>(() => {
    const base = SECTORS.find(s => s.id === sector)!.build()
    const hidden = new Set(MODULES.filter(m => off.has(m.id)).flatMap(m => m.types))
    const shown = name.trim() || base.name
    // The example's own name also appears inside its blocks ("Bienvenido a X"): swap it everywhere.
    const renamed = JSON.parse(JSON.stringify(base.blocks).split(JSON.stringify(base.name).slice(1, -1)).join(JSON.stringify(shown).slice(1, -1))) as Block[]
    const blocks: Block[] = renamed.map(b => ({ ...b, visible: b.visible && !hidden.has(b.type) }))
    return {
      ...base,
      id: `example-live-${sector}`,   // "example*" ids run in preview mode (no real WhatsApp, no analytics)
      name: shown,
      settings: { ...base.settings, primaryColor: color ?? base.settings.primaryColor },
      blocks,
    }
  }, [sector, name, color, off])

  const toggle = (id: string) => setOff(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })

  const chip = (active: boolean): React.CSSProperties => ({
    minHeight: 44, padding: '0 16px', borderRadius: 999, fontSize: 14.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    border: `1.5px solid ${active ? INK : LINE}`, background: active ? INK : '#fff', color: active ? '#fff' : INK, transition: 'background .15s, color .15s, border-color .15s',
  })

  return (
    <section id="probar" aria-labelledby="probar-h" className="mx-auto max-w-[1160px] px-5 sm:px-8 py-20 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-[1fr_auto] items-start">
        <div className="max-w-[560px]">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em]" style={{ color: MUTED }}>Pruébalo ahora</p>
          <h2 id="probar-h" className="mt-3 font-bold" style={{ fontSize: 'clamp(30px, 4vw, 46px)', lineHeight: 1.08, letterSpacing: '-0.03em', color: INK }}>Monta tu página en 20 segundos</h2>
          <p className="mt-4 text-[18px] leading-relaxed" style={{ color: BODY }}>Elige tu sector, ponle tu nombre y tu color. Después usa la página de la derecha: pide una cita, arma un pedido. Es de verdad, solo que sin enviar nada.</p>

          <fieldset className="mt-8" style={{ border: 0, padding: 0, margin: '28px 0 0' }}>
            <legend className="text-[14px] font-semibold mb-2.5" style={{ color: INK }}>1 · Tu sector</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Sector">
              {SECTORS.map(s => <button key={s.id} type="button" role="radio" aria-checked={s.id === sector} onClick={() => setSector(s.id)} style={chip(s.id === sector)}>{s.label}</button>)}
            </div>
          </fieldset>

          <label className="block mt-6">
            <span className="block text-[14px] font-semibold mb-2" style={{ color: INK }}>2 · Tu nombre o el de tu negocio</span>
            <input type="text" value={name} maxLength={40} onChange={e => setName(e.target.value)} placeholder="Ej.: Clínica Aurora" autoComplete="organization"
              className="w-full rounded-xl px-4 text-[16px] outline-none bg-white focus:border-[#111314]" style={{ height: 52, border: `1.5px solid ${LINE}`, color: INK }} />
          </label>

          <fieldset className="mt-6" style={{ border: 0, padding: 0, margin: '28px 0 0' }}>
            <legend className="text-[14px] font-semibold mb-2.5" style={{ color: INK }}>3 · Tu color</legend>
            <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Color de marca">
              {COLORS.map(c => {
                const active = (color ?? page.settings.primaryColor) === c && color !== null
                return (
                  <button key={c} type="button" role="radio" aria-checked={active} aria-label={`Color ${c}`} onClick={() => setColor(c)}
                    style={{ width: 44, height: 44, borderRadius: 999, background: c, border: active ? `3px solid ${INK}` : '3px solid #fff', boxShadow: `0 0 0 1px ${LINE}`, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                    {active && <Check size={18} color="#fff" aria-hidden />}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset className="mt-6" style={{ border: 0, padding: 0, margin: '28px 0 0' }}>
            <legend className="text-[14px] font-semibold mb-2.5" style={{ color: INK }}>4 · Lo que quieres mostrar</legend>
            <div className="flex flex-wrap gap-2">
              {MODULES.map(m => {
                const on = !off.has(m.id)
                return (
                  <button key={m.id} type="button" aria-pressed={on} onClick={() => toggle(m.id)} style={{ ...chip(on), display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <m.icon size={16} aria-hidden /> {m.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <Link href="/auth" className="mt-8 inline-flex items-center gap-2 rounded-full px-7 text-[16px] font-semibold text-white no-underline hover:brightness-95" style={{ height: 52, background: '#E8150A' }}>
            {name.trim() ? `Crear la página de ${name.trim()}` : 'Crear mi página gratis'} <ArrowRight size={17} aria-hidden />
          </Link>
        </div>

        <div className="flex flex-col items-center lg:sticky lg:top-24">
          <div style={{ width: 'min(100%, 340px)', borderRadius: 44, border: `10px solid ${INK}`, background: '#fff', overflow: 'hidden', boxShadow: '0 1px 2px rgba(17,19,20,.06), 0 40px 80px -30px rgba(17,19,20,.4)' }}
            role="group" aria-label="Vista previa interactiva de tu página">
            {/* Scrollable and clickable: it is the real page in preview mode */}
            <div style={{ height: 600, overflowY: 'auto', overscrollBehavior: 'contain' }}
              onClickCapture={e => { if ((e.target as HTMLElement).closest('a')) e.preventDefault() }}>
              <PageView page={page} />
            </div>
          </div>
          <p className="mt-4 text-[13px] text-center" style={{ color: MUTED }}>Desplázate y pulsa dentro de la página. Nada se envía.</p>
        </div>
      </div>
    </section>
  )
}
