'use client'
import { useState, useEffect } from 'react'
import { HERO_EXAMPLES } from './demoPage'
import { CalendarCheck, ShoppingBag, CreditCard } from 'lucide-react'
import { PageView } from './p/[slug]/PageView'

const INK = '#111314'

// The real PageView with example data inside a plain device frame: it can't go
// stale, and it shows exactly what a customer's page looks like.
export function HeroShowcase() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setIndex(i => (i + 1) % HERO_EXAMPLES.length), 6000)
    return () => clearInterval(id)
  }, [paused])

  return (
    <div className="relative flex flex-col items-center" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div aria-hidden className="hero-glow-bg" />
      <div aria-hidden className="hidden lg:flex hero-chip-pos hero-chip-in items-center gap-2 rounded-2xl px-3.5 py-2.5 text-[13px] font-semibold" style={{ ['--c' as string]: 0, left: -18, top: '16%', background: '#fff', color: INK, boxShadow: '0 12px 30px -10px rgba(17,19,20,.28)', border: '1px solid rgba(17,19,20,.06)' }}>
        <span className="hero-chip flex items-center gap-2"><CalendarCheck size={16} style={{ color: '#15803D' }} /> Cita solicitada · jueves 17:30</span>
      </div>
      <div aria-hidden className="hidden lg:flex hero-chip-pos hero-chip-in items-center gap-2 rounded-2xl px-3.5 py-2.5 text-[13px] font-semibold" style={{ ['--c' as string]: 1, right: -26, top: '46%', background: '#fff', color: INK, boxShadow: '0 12px 30px -10px rgba(17,19,20,.28)', border: '1px solid rgba(17,19,20,.06)' }}>
        <span className="hero-chip flex items-center gap-2" style={{ animationDelay: '1.2s' }}><ShoppingBag size={16} style={{ color: '#E8150A' }} /> Pedido por WhatsApp</span>
      </div>
      <div aria-hidden className="hidden lg:flex hero-chip-pos hero-chip-in items-center gap-2 rounded-2xl px-3.5 py-2.5 text-[13px] font-semibold" style={{ ['--c' as string]: 2, left: 6, bottom: '18%', background: '#fff', color: INK, boxShadow: '0 12px 30px -10px rgba(17,19,20,.28)', border: '1px solid rgba(17,19,20,.06)' }}>
        <span className="hero-chip flex items-center gap-2" style={{ animationDelay: '2.1s' }}><CreditCard size={16} style={{ color: '#1D4ED8' }} /> Cobro recibido · 45 €</span>
      </div>
      <div className="hero-phone-in relative z-[1]" style={{ width: 'min(100%, 320px)' }}>
      <div style={{ width: '100%', borderRadius: 40, border: `10px solid ${INK}`, background: '#fff', overflow: 'hidden', boxShadow: '0 1px 2px rgba(17,19,20,.06), 0 40px 80px -30px rgba(17,19,20,.35)', maxHeight: 590, position: 'relative' }}
        role="group" aria-label={`Ejemplo de página de LinkHub: ${HERO_EXAMPLES[index].label}`}>
        <div key={HERO_EXAMPLES[index].page.id} className="hero-fade-up" style={{ animationDuration: '0.35s', maxHeight: 570, overflow: 'hidden', pointerEvents: 'none' }} inert>
          <PageView page={HERO_EXAMPLES[index].page} />
        </div>
        <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(255,255,255,0), #fff)' }} />
      </div>
      </div>
      <div role="tablist" aria-label="Ejemplos" className="mt-6 inline-flex p-1 rounded-full" style={{ background: 'rgba(17,19,20,.06)' }}>
        {HERO_EXAMPLES.map((ex, i) => (
          <button key={ex.page.id} role="tab" aria-selected={i === index} onClick={() => { setIndex(i); setPaused(true) }}
            className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors"
            style={{ background: i === index ? '#fff' : 'transparent', color: i === index ? INK : '#5B6064', boxShadow: i === index ? '0 1px 3px rgba(17,19,20,.15)' : 'none' }}>
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  )
}
