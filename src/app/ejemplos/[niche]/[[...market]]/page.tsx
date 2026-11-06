import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { PageView } from '@/app/p/[slug]/PageView'
import { MARKETS, NICHES, buildExample, marketById } from '@/lib/examples'

interface Props { params: Promise<{ niche: string; market?: string[] }> }

export function generateStaticParams() {
  return NICHES.flatMap(n => [{ niche: n.slug }, ...MARKETS.map(m => ({ niche: n.slug, market: [m.id] }))])
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { niche } = await params
  const n = NICHES.find(x => x.slug === niche)
  if (!n) return { title: 'Ejemplo no encontrado' }
  return {
    title: `Ejemplo de página para ${n.label.toLowerCase()} | LinkHub`,
    description: `Así quedaría la página de LinkHub de un negocio de ${n.label.toLowerCase()}: ${n.shows.join(', ').toLowerCase()}.`,
    // Fictional business data: keep the individual examples out of search results (the gallery is indexed).
    robots: { index: false, follow: true },
  }
}

export default async function ExamplePageRoute({ params }: Props) {
  const { niche, market } = await params
  const ex = buildExample(niche, market?.[0])
  if (!ex) notFound()
  const current = marketById(market?.[0])

  return (
    <div style={{ background: '#F7F7F5' }}>
      <div style={{ background: '#111314', color: '#fff' }}>
        <div className="mx-auto max-w-[1160px] px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[13px]">
          <span><Link href="/ejemplos" className="font-semibold no-underline" style={{ color: '#fff' }}>← Todos los ejemplos</Link> <span style={{ opacity: .7 }}>· Ejemplo de {ex.niche.label.toLowerCase()} (datos ficticios)</span></span>
          <nav aria-label="País del ejemplo" className="flex gap-1">
            {MARKETS.map(m => (
              <Link key={m.id} href={`/ejemplos/${ex.niche.slug}/${m.id}`} aria-current={m.id === current.id ? 'true' : undefined} className="rounded-full px-3 py-1 font-semibold no-underline"
                style={{ background: m.id === current.id ? '#fff' : 'rgba(255,255,255,.12)', color: m.id === current.id ? '#111314' : '#fff' }}>{m.flag} {m.label}</Link>
            ))}
          </nav>
        </div>
      </div>

      <PageView page={ex.page} knowledge={ex.knowledge} />

      <div className="fixed inset-x-3 bottom-3 z-40 flex justify-center pointer-events-none">
        <Link href="/auth" className="pointer-events-auto inline-flex items-center gap-2 rounded-full px-6 text-[15px] font-semibold text-white no-underline" style={{ height: 50, background: '#E8150A', boxShadow: '0 12px 30px rgba(232,21,10,.35)' }}>
          Crear una página así <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </div>
  )
}
