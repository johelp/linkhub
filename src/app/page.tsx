import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LinkHub — Crea tu página de enlaces profesional',
  description: 'Crea páginas de enlaces profesionales con bloques visuales, multiidioma, filtros de temporada y QR.',
}

const R = '#E8150A'
const INK = '#1A1B1C'
const MUTED = '#5A5D60'
const LIGHT = '#9A9D9F'
const SNOW = '#F6F6F5'
const BORDER = 'rgba(26,27,28,0.09)'

const features = [
  { icon: '🔗', title: 'Bloques visuales', desc: 'Links, acordeones, destacados, redes y más. Arrastrá y soltá.' },
  { icon: '🌍', title: 'Multiidioma', desc: 'Contenido en ES, EN, PT y más. Cada bloque con su traducción independiente.' },
  { icon: '🌨️', title: 'Filtros de temporada', desc: 'Mostrá bloques solo en invierno, verano u off. Automático.' },
  { icon: '📱', title: 'QR incluido', desc: 'Cada página genera un QR listo para imprimir o compartir en redes.' },
  { icon: '📊', title: 'Analíticas', desc: 'Vistas, clics por bloque, dispositivos y países en tiempo real.' },
  { icon: '⚡', title: '100 en Lighthouse', desc: 'SSG + ISR. Velocidad máxima y SEO optimizado para buscadores e IA.' },
]

const plans = [
  {
    name: 'Free', price: '0', suffix: '',
    highlight: false,
    features: ['1 página', 'Links simples y separadores', '1 idioma', 'Sin filtros de temporada', 'QR básico', 'Analíticas de vistas'],
    cta: 'Empezar gratis', href: '/auth',
  },
  {
    name: 'Pro', price: '19', suffix: '/mes',
    highlight: true,
    features: ['Páginas ilimitadas', 'Todos los bloques', 'Multiidioma (ES, EN, PT…)', 'Filtros de temporada', 'QR personalizado SVG+PNG', 'Analíticas completas'],
    cta: 'Empezar Pro', href: '/auth',
  },
  {
    name: 'Agency', price: '49', suffix: '/mes',
    highlight: false,
    features: ['Todo lo de Pro', 'Dominio propio', 'Export CSV de analíticas', 'Soporte prioritario'],
    cta: 'Contactar', href: '/auth',
  },
]

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: SNOW, fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif" }}>

      {/* NAV */}
      <nav style={{ maxWidth: 960, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: INK }}>Link<span style={{ color: R }}>Hub</span></span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/auth" style={{ fontSize: 13, fontWeight: 500, color: MUTED, textDecoration: 'none', padding: '8px 12px' }}>
            Iniciar sesión
          </Link>
          <Link href="/auth" style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: R, padding: '9px 18px', borderRadius: 20, textDecoration: 'none' }}>
            Empezar gratis
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 680, margin: '0 auto', padding: '56px 24px 64px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '.7px', textTransform: 'uppercase', background: '#FEF0EF', color: R, padding: '4px 12px', borderRadius: 20, marginBottom: 24 }}>
          MVP · LinkHub v1.0
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 700, color: INK, lineHeight: 1.15, marginBottom: 20 }}>
          Tu página de enlaces,<br />
          <span style={{ color: R }}>profesional y en minutos</span>
        </h1>
        <p style={{ fontSize: 17, color: MUTED, lineHeight: 1.6, marginBottom: 32, maxWidth: 520, margin: '0 auto 32px' }}>
          Bloques visuales, multiidioma, filtros de temporada y QR.<br />
          Para negocios que necesitan más que un simple link en bio.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth" style={{ fontSize: 14, fontWeight: 600, color: '#fff', background: R, padding: '13px 28px', borderRadius: 25, textDecoration: 'none' }}>
            Crear mi página gratis →
          </Link>
        </div>
        <p style={{ fontSize: 12, color: LIGHT, marginTop: 14 }}>Sin tarjeta de crédito. Free para siempre.</p>
      </section>

      {/* FEATURES */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 72px' }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: INK, textAlign: 'center', marginBottom: 40 }}>Todo lo que necesitás</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: '#fff', borderRadius: 16, padding: 20, border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: INK, marginBottom: 6 }}>{f.title}</p>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: INK, textAlign: 'center', marginBottom: 10 }}>Precios simples</h2>
        <p style={{ fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 40 }}>
          El salto a Pro es cuando necesitás más bloques.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {plans.map(p => (
            <div key={p.name} style={{ background: '#fff', borderRadius: 18, padding: 24, position: 'relative', border: p.highlight ? `2px solid ${R}` : `1px solid ${BORDER}` }}>
              {p.highlight && (
                <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 700, background: R, color: '#fff', padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  Más popular
                </div>
              )}
              <p style={{ fontSize: 17, fontWeight: 700, color: INK, marginBottom: 6 }}>{p.name}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                <span style={{ fontSize: 34, fontWeight: 700, color: INK }}>€{p.price}</span>
                <span style={{ fontSize: 13, color: LIGHT }}>{p.suffix}</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {p.features.map(f => (
                  <li key={f} style={{ fontSize: 13, color: MUTED, display: 'flex', gap: 8 }}>
                    <span style={{ color: R, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href={p.href}
                style={{ display: 'block', textAlign: 'center', fontSize: 13, fontWeight: 600, padding: '11px 0', borderRadius: 12, textDecoration: 'none', background: p.highlight ? R : '#F2F3F4', color: p.highlight ? '#fff' : INK }}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: '24px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: LIGHT }}>© {new Date().getFullYear()} LinkHub · Hecho para negocios reales</p>
      </footer>
    </div>
  )
}
