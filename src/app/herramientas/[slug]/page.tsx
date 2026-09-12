import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { QR_TOOLS, getQrTool } from '@/lib/qrTools'
import { QrToolClient } from './QrToolClient'

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
  return QR_TOOLS.map(t => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tool = getQrTool(slug)
  if (!tool) return { title: 'Herramienta no encontrada' }
  return {
    title: tool.metaTitle,
    description: tool.metaDescription,
    alternates: { canonical: `/herramientas/${tool.slug}` },
    openGraph: { title: tool.metaTitle, description: tool.metaDescription, type: 'website' },
    robots: { index: true, follow: true },
  }
}

export default async function QrToolPage({ params }: Props) {
  const { slug } = await params
  const tool = getQrTool(slug)
  if (!tool) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.title,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: tool.metaDescription,
  }

  const others = QR_TOOLS.filter(t => t.slug !== tool.slug)

  return (
    <div style={{ minHeight: '100vh', background: SNOW }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav style={{ maxWidth: 900, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontSize: 18, fontWeight: 700, color: INK, textDecoration: 'none' }}>
          Link<span style={{ color: R }}>Hub</span>
        </Link>
        <Link href="/auth" style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: R, padding: '9px 18px', borderRadius: 20, textDecoration: 'none' }}>
          Crear mi página gratis
        </Link>
      </nav>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '20px 24px 64px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>{tool.icon}</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: INK, marginBottom: 10, textWrap: 'balance' }}>{tool.title}</h1>
          <p style={{ fontSize: 14.5, color: MUTED, maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>{tool.intro}</p>
        </div>

        <QrToolClient config={tool} />

        <section style={{ marginTop: 56, background: '#fff', borderRadius: 18, padding: 28, border: `1px solid ${BORDER}`, textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 6 }}>
            Esto es un vistazo rápido de lo que hace LinkHub
          </p>
          <p style={{ fontSize: 13, color: MUTED, marginBottom: 18, maxWidth: 460, margin: '0 auto 18px', lineHeight: 1.6 }}>
            Con LinkHub armás una página completa con enlaces, redes, horarios, captura de email y su propio QR
            personalizado — no solo un código suelto.
          </p>
          <Link href="/auth" style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', background: R, padding: '12px 26px', borderRadius: 25, textDecoration: 'none', display: 'inline-block' }}>
            Crear mi página gratis →
          </Link>
        </section>

        <section style={{ marginTop: 40 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase', color: LIGHT, textAlign: 'center', marginBottom: 14 }}>
            Otras herramientas gratis
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {others.map(t => (
              <Link key={t.slug} href={`/herramientas/${t.slug}`}
                style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: `1px solid ${BORDER}`, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>{t.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{t.label}</span>
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
