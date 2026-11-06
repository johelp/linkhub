import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { NICHES } from '@/lib/examples'

export const metadata: Metadata = {
  title: 'Ejemplos de páginas por tipo de negocio | LinkHub',
  description: 'Mira cómo queda tu página de LinkHub según tu negocio: psicología, abogacía, peluquería, restaurantes, tiendas, eventos y más. Ejemplos interactivos para España, Argentina y México.',
  alternates: { canonical: '/ejemplos' },
}

export default function ExamplesIndex() {
  return (
    <main className="min-h-screen" style={{ background: '#FAFAF8', color: '#111314' }}>
      <div className="mx-auto max-w-[1160px] px-5 sm:px-8 py-14 lg:py-20">
        <Link href="/" className="text-[14px] font-semibold no-underline" style={{ color: '#5B6064' }}>← LinkHub</Link>
        <p className="mt-8 text-[13px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#5B6064' }}>Ejemplos</p>
        <h1 className="mt-3 font-bold max-w-[760px]" style={{ fontSize: 'clamp(32px, 4.4vw, 52px)', lineHeight: 1.08, letterSpacing: '-0.03em' }}>Mira cómo quedaría tu página según tu negocio</h1>
        <p className="mt-5 max-w-[640px] text-[18px] leading-relaxed" style={{ color: '#3F4346' }}>Cada ejemplo es una página real y funcional: pide una cita, arma un pedido o abre las preguntas frecuentes. Los datos son ficticios y puedes verlos con precios y formato de España, Argentina o México.</p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NICHES.map(n => (
            <Link key={n.slug} href={`/ejemplos/${n.slug}`} className="group block rounded-2xl bg-white p-6 no-underline transition-shadow hover:shadow-[0_10px_30px_-12px_rgba(17,19,20,.25)]" style={{ border: '1px solid rgba(17,19,20,.10)', color: '#111314' }}>
              <span aria-hidden className="block h-1.5 w-12 rounded-full" style={{ background: n.color }} />
              <h2 className="mt-5 text-[19px] font-semibold">{n.label}</h2>
              <p className="mt-1 text-[14.5px]" style={{ color: '#5B6064' }}>{n.who}</p>
              <ul className="mt-4 space-y-1.5 text-[14px]" style={{ color: '#3F4346', listStyle: 'none', padding: 0 }}>
                {n.shows.map(s => <li key={s}>· {s}</li>)}
              </ul>
              <span className="mt-5 inline-flex items-center gap-1 text-[14px] font-semibold">Ver ejemplo <ArrowRight size={14} aria-hidden className="transition-transform group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
