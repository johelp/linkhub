import Link from 'next/link'
import type { Metadata } from 'next'
import { QR_TOOLS } from '@/lib/qrTools'

const R = '#E8150A'
const INK = '#1A1B1C'
const MUTED = '#5A5D60'
const LIGHT = '#9A9D9F'
const SNOW = '#F6F6F5'
const BORDER = 'rgba(26,27,28,0.09)'

export const metadata: Metadata = {
  title: 'Herramientas gratis para generar códigos QR',
  description: 'Generadores de código QR gratis y sin registro: WiFi, Instagram y tarjeta de contacto (vCard). Todo se genera en tu navegador.',
  alternates: { canonical: '/herramientas' },
  robots: { index: true, follow: true },
}

export default function ToolsIndexPage() {
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
        <h1 style={{ fontSize: 26, fontWeight: 700, color: INK, marginBottom: 10 }}>Herramientas gratis</h1>
        <p style={{ fontSize: 14, color: MUTED, marginBottom: 32, lineHeight: 1.6 }}>
          Generadores de código QR sin registro — se crean en tu navegador, no guardamos nada.
        </p>
        <div style={{ display: 'grid', gap: 12 }}>
          {QR_TOOLS.map(t => (
            <Link key={t.slug} href={`/herramientas/${t.slug}`}
              style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', border: `1px solid ${BORDER}`, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left' }}>
              <span style={{ fontSize: 30, flexShrink: 0 }}>{t.icon}</span>
              <span>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: INK, marginBottom: 3 }}>{t.label}</span>
                <span style={{ display: 'block', fontSize: 12.5, color: MUTED, lineHeight: 1.5 }}>{t.intro}</span>
              </span>
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
