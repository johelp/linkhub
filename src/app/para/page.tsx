import Link from 'next/link'
import type { Metadata } from 'next'
import { VERTICALS } from '@/lib/verticals'

const R = '#E8150A'
const INK = '#1A1B1C'
const MUTED = '#5A5D60'
const LIGHT = '#9A9D9F'
const SNOW = '#F6F6F5'
const BORDER = 'rgba(26,27,28,0.09)'

export const metadata: Metadata = {
  title: 'LinkHub para cada tipo de negocio',
  description: 'La página de enlaces armada para tu rubro: peluquerías, bares, restaurantes, eventos y negocios de temporada.',
  alternates: { canonical: '/para' },
  robots: { index: true, follow: true },
}

export default function VerticalsIndexPage() {
  return (
    <div style={{ minHeight: '100vh', background: SNOW }}>
      <nav style={{ maxWidth: 900, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ fontSize: 18, fontWeight: 700, color: INK, textDecoration: 'none' }}>
          Link<span style={{ color: R }}>Hub</span>
        </Link>
        <Link href="/auth" style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: R, padding: '9px 18px', borderRadius: 20, textDecoration: 'none' }}>
          Crear mi página gratis
        </Link>
      </nav>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 64px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: INK, marginBottom: 10 }}>LinkHub para cada tipo de negocio</h1>
        <p style={{ fontSize: 14, color: MUTED, marginBottom: 32, lineHeight: 1.6 }}>
          Elegí tu rubro para ver qué bloques te sirven y cómo queda tu página.
        </p>
        <div style={{ display: 'grid', gap: 12 }}>
          {VERTICALS.map(v => (
            <Link key={v.slug} href={`/para/${v.slug}`}
              style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', border: `1px solid ${BORDER}`, textDecoration: 'none', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: INK }}>{v.label}</span>
              <span style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>{v.intro}</span>
            </Link>
          ))}
        </div>
      </main>

      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: '24px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: LIGHT }}>© {new Date().getFullYear()} LinkHub · Hecho para negocios reales</p>
      </footer>
    </div>
  )
}
