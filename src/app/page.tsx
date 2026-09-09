import Link from 'next/link'
import type { Metadata } from 'next'
import { buildDemoPage } from './demoPage'
import { PageView } from './p/[slug]/PageView'
import { LivePreview } from './LivePreview'

export const metadata: Metadata = {
  title: 'LinkHub — Crea tu página de enlaces profesional',
  description: 'Crea páginas de enlaces profesionales con bloques visuales, multiidioma, analíticas y QR.',
}

const R = '#E8150A'
const INK = '#1A1B1C'
const MUTED = '#5A5D60'
const LIGHT = '#9A9D9F'
const SNOW = '#F6F6F5'
const BORDER = 'rgba(26,27,28,0.09)'

const useCases = [
  { icon: '💇', title: 'Servicios y comercios locales', desc: 'WhatsApp, ubicación, horarios y redes sociales — todo lo que un cliente necesita antes de visitarte.' },
  { icon: '🎨', title: 'Creadores y freelancers', desc: 'Portfolio, redes, contacto y captura de email para tu lista, todo en un solo link.' },
  { icon: '🏔️', title: 'Turismo y negocios de temporada', desc: 'Filtros automáticos por temporada cuando tu oferta cambia con el año — invierno, verano, o lo que sea.' },
  { icon: '🎉', title: 'Eventos y lanzamientos', desc: 'Un link temporal con toda la info, listo para compartir por QR o redes.' },
]

const steps = [
  { n: '1', title: 'Creá tu página', desc: 'Elegí un nombre, tu página queda lista en segundos con un slug único.' },
  { n: '2', title: 'Armá tus bloques', desc: 'Arrastrá y soltá links, destacados, redes, contacto — sin tocar código.' },
  { n: '3', title: 'Compartí el QR o el link', desc: 'Imprimí el QR, pegalo en redes, o poné el link en tu Instagram bio.' },
]

const features = [
  { icon: '🔗', title: 'Bloques visuales', desc: 'Links, acordeones, destacados, redes y más. Arrastrá y soltá.' },
  { icon: '🌍', title: 'Multiidioma', desc: 'Contenido en ES, EN, PT y más. Cada bloque con su traducción independiente.' },
  { icon: '🌨️', title: 'Filtros de temporada', desc: 'Mostrá bloques solo en invierno, verano u off. Automático.' },
  { icon: '📱', title: 'QR incluido', desc: 'Cada página genera un QR listo para imprimir o compartir en redes.' },
  { icon: '📊', title: 'Analíticas', desc: 'Vistas, clics por bloque, dispositivos y países en tiempo real.' },
  { icon: '⚡', title: 'Rápida y optimizada para SEO', desc: 'SSG + ISR. Carga instantánea y pensada para buscadores e IA.' },
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
    features: ['Páginas ilimitadas', 'Todos los bloques', 'Multiidioma (ES, EN, PT…)', 'Filtros de temporada', 'QR personalizado SVG+PNG', 'Analíticas completas + export CSV', 'Dominio propio', 'Soporte prioritario'],
    cta: 'Empezar Pro', href: '/auth',
  },
]

const demoPage = buildDemoPage()

// Founding-member requests land here until there's a WhatsApp number or a
// real form — update once hola@linkhub.app is an inbox you actually own
// (or swap the domain). See SETUP.md §7.
const LAUNCH_OFFER_HREF = 'mailto:hola@linkhub.app?subject=Cupo%20de%20lanzamiento%20LinkHub'

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: SNOW }}>

      {/* LAUNCH BANNER */}
      <Link href={LAUNCH_OFFER_HREF} style={{
        display: 'block', textAlign: 'center', fontSize: 12.5, fontWeight: 600,
        color: '#fff', background: `linear-gradient(90deg, ${R}, #FF8C00)`,
        padding: '9px 16px', textDecoration: 'none',
      }}>
        🎉 Cupos de lanzamiento: los primeros negocios se llevan plan Pro gratis — Escribinos →
      </Link>

      {/* NAV */}
      <nav style={{ maxWidth: 1080, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Ambient gradient blobs */}
        <div aria-hidden className="hero-glow" style={{
          position: 'absolute', top: -180, left: '50%', width: 620, height: 620,
          marginLeft: -420, borderRadius: '50%', filter: 'blur(70px)', opacity: 0.35,
          background: `radial-gradient(circle, ${R} 0%, transparent 70%)`, pointerEvents: 'none',
        }} />
        <div aria-hidden className="hero-glow" style={{
          position: 'absolute', top: -120, right: '50%', width: 520, height: 520,
          marginRight: -460, borderRadius: '50%', filter: 'blur(70px)', opacity: 0.3,
          background: 'radial-gradient(circle, #FF8C00 0%, transparent 70%)', pointerEvents: 'none',
          animationDelay: '-6s',
        }} />

        <div style={{ position: 'relative', maxWidth: 1080, margin: '0 auto', padding: '40px 24px 72px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 40, alignItems: 'center' }}
          className="lg:!grid-cols-[1.1fr_0.9fr]">
          <div style={{ textAlign: 'center' }} className="lg:!text-left">
            <div className="hero-fade-up" style={{ animationDelay: '0s', display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '.7px', textTransform: 'uppercase', background: '#FEF0EF', color: R, padding: '4px 12px', borderRadius: 20, marginBottom: 20 }}>
              Beta de lanzamiento abierta
            </div>
            <h1 className="hero-fade-up" style={{ animationDelay: '.08s', fontSize: 42, fontWeight: 700, color: INK, lineHeight: 1.15, marginBottom: 18 }}>
              Tu página de enlaces,<br />
              <span style={{ backgroundImage: `linear-gradient(90deg, ${R}, #FF8C00)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>profesional y en minutos</span>
            </h1>
            <p className="hero-fade-up mx-auto lg:!mx-0" style={{ animationDelay: '.16s', fontSize: 16, color: MUTED, lineHeight: 1.6, marginBottom: 28, maxWidth: 480 }}>
              Bloques visuales, multiidioma, captura de email y QR.
              Para negocios y creadores que necesitan más que un simple link en bio.
            </p>
            <div className="hero-fade-up justify-center lg:!justify-start" style={{ animationDelay: '.24s', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/auth" className="hero-cta"
                style={{ fontSize: 14, fontWeight: 600, color: '#fff', background: R, padding: '13px 28px', borderRadius: 25, textDecoration: 'none', display: 'inline-block' }}>
                Crear mi página gratis →
              </Link>
            </div>
            <p className="hero-fade-up" style={{ animationDelay: '.3s', fontSize: 12, color: LIGHT, marginTop: 14 }}>Sin tarjeta de crédito. Free para siempre. Lista en minutos.</p>
          </div>

          {/* Phone mockup — real PageView component, not a screenshot */}
          <div className="hero-scale-in" style={{ animationDelay: '.2s', display: 'flex', justifyContent: 'center', perspective: 1200 }}>
            <div className="hero-float">
              <div className="hero-phone-tilt">
                <div style={{
                  width: 300, borderRadius: 36, border: '10px solid #1A1B1C', background: '#fff',
                  overflow: 'hidden', boxShadow: '0 30px 70px rgba(26,27,28,0.22)', maxHeight: 560,
                }}>
                  <div style={{ maxHeight: 540, overflow: 'hidden' }}>
                    <PageView page={demoPage} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LivePreview />

      {/* USE CASES */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 72px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: INK, textAlign: 'center', marginBottom: 8 }}>¿Para quién es LinkHub?</h2>
        <p style={{ fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 36 }}>Negocios, creadores y equipos que quieren algo más profesional que un link en bio simple.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {useCases.map(u => (
            <div key={u.title} style={{ background: '#fff', borderRadius: 16, padding: 22, border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{u.icon}</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: INK, marginBottom: 6 }}>{u.title}</p>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55 }}>{u.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 72px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: INK, textAlign: 'center', marginBottom: 36 }}>Cómo funciona</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
          {steps.map(s => (
            <div key={s.n} style={{ textAlign: 'center' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 20, background: R, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, margin: '0 auto 14px',
              }}>{s.n}</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: INK, marginBottom: 6 }}>{s.title}</p>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 72px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: INK, textAlign: 'center', marginBottom: 36 }}>Todo lo que necesitás</h2>
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
      <section style={{ maxWidth: 620, margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: INK, textAlign: 'center', marginBottom: 10 }}>Precios simples</h2>
        <p style={{ fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 40 }}>
          Empezá gratis. El salto a Pro es cuando necesitás más bloques.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
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
