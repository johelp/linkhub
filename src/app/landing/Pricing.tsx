'use client'
import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { Check } from 'lucide-react'
import { REGIONS, REGION_COOKIE, formatPrice, guessRegion, regionById, type RegionId } from '@/lib/pricing'

const INK = '#111314', BODY = '#3F4346', MUTED = '#5B6064', LINE = 'rgba(17,19,20,0.10)', ACCENT = '#E8150A'

const plans = [
  { name: 'Free', pro: false, note: 'Para empezar y probar', features: ['1 página', 'Enlaces y separadores', '1 idioma', 'Código QR básico', 'Analíticas de visitas'], cta: 'Empezar gratis' },
  { name: 'Pro', pro: true, note: 'Para trabajar con clientes', features: ['Páginas ilimitadas', 'Todos los bloques: citas, pedidos, cobros, mapa', 'Varios idiomas', 'QR personalizado', 'Analíticas completas y exportación', 'Soporte prioritario'], cta: 'Empezar con Pro' },
]

// Region: remembered choice > best guess from the browser > Spain. External
// store so the server (and first paint) render the default without a mismatch.
const subscribe = (cb: () => void) => { window.addEventListener('lh-region', cb); return () => window.removeEventListener('lh-region', cb) }
const readRegion = (): RegionId => {
  try {
    const saved = localStorage.getItem(REGION_COOKIE)
    if (saved) return regionById(saved).id
  } catch { /* storage blocked */ }
  return guessRegion(navigator.language, Intl.DateTimeFormat().resolvedOptions().timeZone)
}
function chooseRegion(id: RegionId) {
  try { localStorage.setItem(REGION_COOKIE, id) } catch { /* ignore */ }
  // The cookie lets /dashboard/upgrade charge in the same currency the visitor saw.
  document.cookie = `${REGION_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`
  window.dispatchEvent(new Event('lh-region'))
}

export function Pricing() {
  const regionId = useSyncExternalStore(subscribe, readRegion, () => 'es' as RegionId)
  const region = regionById(regionId)

  return (
    <div>
      <div role="radiogroup" aria-label="Tu país" className="mt-8 inline-flex flex-wrap gap-1 p-1 rounded-full" style={{ background: 'rgba(17,19,20,.06)' }}>
        {REGIONS.map(r => (
          <button key={r.id} role="radio" aria-checked={r.id === region.id} onClick={() => chooseRegion(r.id)}
            className="px-4 py-2 rounded-full text-[14px] font-semibold transition-colors"
            style={{ background: r.id === region.id ? '#fff' : 'transparent', color: r.id === region.id ? INK : MUTED, boxShadow: r.id === region.id ? '0 1px 3px rgba(17,19,20,.15)' : 'none' }}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {plans.map(p => (
          <div key={p.name} className="h-full rounded-2xl p-8 flex flex-col" style={{ background: '#fff', border: p.pro ? `2px solid ${INK}` : `1px solid ${LINE}` }}>
            <div className="flex items-baseline justify-between">
              <h3 className="text-[20px] font-semibold">{p.name}</h3>
              {p.pro && <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ background: INK, color: '#fff' }}>Recomendado</span>}
            </div>
            <p className="mt-1 text-[14px]" style={{ color: MUTED }}>{p.note}</p>
            <p className="mt-5" aria-live="polite">
              <span className="text-[44px] font-bold tracking-tight">{p.pro ? formatPrice(region.pro, region.currency, region.locale) : formatPrice(0, region.currency, region.locale)}</span>
              {p.pro && <span className="text-[16px]" style={{ color: MUTED }}> /mes</span>}
            </p>
            {p.pro && <p className="text-[13px] mt-1 min-h-[18px]" style={{ color: MUTED }}>{region.note ?? `Facturado en ${region.currency}.`}</p>}
            <ul className="mt-6 space-y-3 flex-1" style={{ listStyle: 'none', padding: 0 }}>
              {p.features.map(f => <li key={f} className="flex gap-3 text-[15px]" style={{ color: BODY }}><Check size={17} aria-hidden className="flex-shrink-0 mt-0.5" style={{ color: '#15803D' }} />{f}</li>)}
            </ul>
            <Link href="/auth" className="mt-8 inline-flex items-center justify-center rounded-full text-[15px] font-semibold no-underline transition-colors" style={{ height: 48, background: p.pro ? ACCENT : 'transparent', color: p.pro ? '#fff' : INK, border: p.pro ? 'none' : `1.5px solid ${LINE}` }}>{p.cta}</Link>
          </div>
        ))}
      </div>
      <p className="mt-5 text-[13px]" style={{ color: MUTED }}>Sin permanencia. Los precios pueden incluir impuestos según tu país.</p>
    </div>
  )
}
