import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageView } from '../../p/[slug]/PageView'
import { VERTICALS, getVertical } from '@/lib/verticals'

const R = '#E8150A'
const INK = '#1A1B1C'
const MUTED = '#5A5D60'
const LIGHT = '#9A9D9F'
const SNOW = '#F6F6F5'
const BORDER = 'rgba(26,27,28,0.09)'

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return VERTICALS.map(v => ({ slug: v.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const v = getVertical(slug)
  if (!v) return { title: 'Página no encontrada' }
  return {
    title: v.metaTitle,
    description: v.metaDescription,
    alternates: { canonical: `/para/${v.slug}` },
    openGraph: { title: v.metaTitle, description: v.metaDescription, type: 'website' },
    robots: { index: true, follow: true },
  }
}

export default async function VerticalPage({ params }: Props) {
  const { slug } = await params
  const v = getVertical(slug)
  if (!v) notFound()

  const demoPage = v.demoPage()
  const others = VERTICALS.filter(x => x.slug !== v.slug)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: v.title,
    description: v.metaDescription,
  }

  return (
    <div style={{ minHeight: '100vh', background: SNOW }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav style={{ maxWidth: 1080, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontSize: 18, fontWeight: 700, color: INK, textDecoration: 'none' }}>
          Link<span style={{ color: R }}>Hub</span>
        </Link>
        <Link href="/auth" style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: R, padding: '9px 18px', borderRadius: 20, textDecoration: 'none' }}>
          Crear mi página gratis
        </Link>
      </nav>

      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '20px 24px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 40, alignItems: 'center', marginBottom: 56 }} className="lg:!grid-cols-[1.1fr_0.9fr]">
          <div style={{ textAlign: 'center' }} className="lg:!text-left">
            <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '.7px', textTransform: 'uppercase', background: '#FEF0EF', color: R, padding: '4px 12px', borderRadius: 20, marginBottom: 18 }}>
              {v.label}
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: INK, lineHeight: 1.2, marginBottom: 16, textWrap: 'balance' }}>{v.title}</h1>
            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, marginBottom: 26, maxWidth: 480 }} className="mx-auto lg:!mx-0">{v.intro}</p>
            <div style={{ display: 'flex', justifyContent: 'center' }} className="lg:!justify-start">
              <Link href="/auth" style={{ fontSize: 14, fontWeight: 600, color: '#fff', background: R, padding: '13px 28px', borderRadius: 25, textDecoration: 'none', display: 'inline-block' }}>
                Crear mi página gratis →
              </Link>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: 280, borderRadius: 36, border: '10px solid #1A1B1C', background: '#fff',
              overflow: 'hidden', boxShadow: '0 30px 70px rgba(26,27,28,0.16)', maxHeight: 540, position: 'relative',
            }}>
              <div style={{ maxHeight: 520, overflow: 'hidden' }}>
                <PageView page={demoPage} />
              </div>
              <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, pointerEvents: 'none',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0), #fff)',
              }} />
            </div>
          </div>
        </div>

        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: INK, textAlign: 'center', marginBottom: 28 }}>
            Lo que le sirve a {v.label.toLowerCase()}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {v.highlights.map(h => (
              <div key={h} style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: `1px solid ${BORDER}`, display: 'flex', gap: 10 }}>
                <span style={{ color: v.accent, fontWeight: 700, flexShrink: 0 }}>✓</span>
                <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55 }}>{h}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ background: '#fff', borderRadius: 18, padding: 28, border: `1px solid ${BORDER}`, textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 6 }}>Empezá gratis, en minutos</p>
          <p style={{ fontSize: 13, color: MUTED, marginBottom: 18, maxWidth: 440, margin: '0 auto 18px', lineHeight: 1.6 }}>
            Sin tarjeta de crédito. Elegí un nombre, armá tus bloques, publicá y compartí el link o el QR.
          </p>
          <Link href="/auth" style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', background: R, padding: '12px 26px', borderRadius: 25, textDecoration: 'none', display: 'inline-block' }}>
            Crear mi página gratis →
          </Link>
        </section>

        <section>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase', color: LIGHT, textAlign: 'center', marginBottom: 14 }}>
            LinkHub para otros rubros
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {others.map(o => (
              <Link key={o.slug} href={`/para/${o.slug}`}
                style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: `1px solid ${BORDER}`, textDecoration: 'none' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{o.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: '24px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: LIGHT }}>© {new Date().getFullYear()} LinkHub · Hecho para negocios reales</p>
      </footer>
    </div>
  )
}
