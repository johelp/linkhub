import Link from 'next/link'
import type { Metadata } from 'next'
import { LivePreview } from './LivePreview'
import { Reveal, Parallax, LandingNav, StickyCta } from './landing/ScrollFx'
import { HeroShowcase } from './HeroShowcase'
import { BLOCK_REGISTRY } from '@/lib/blocks/registry'
import { blockRequiresPro } from '@/types'
import { QR_TOOLS } from '@/lib/qrTools'
import { VERTICALS } from '@/lib/verticals'

export const metadata: Metadata = {
  title: 'LinkHub — Crea tu página de enlaces profesional',
  description: 'Crea páginas de enlaces profesionales con bloques visuales, multiidioma, analíticas y QR.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'LinkHub — Tu página de enlaces, profesional y en minutos',
    description: 'Catálogo con pedidos por WhatsApp, horarios, multiidioma y QR. Para negocios, profesionales y creadores.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
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
  { icon: '🔗', title: 'Bloques visuales', desc: 'Links, acordeones, destacados, redes y más. Arrastrá y soltá, o tocá directo sobre la vista previa.' },
  { icon: '🛒', title: 'Pedidos por WhatsApp', desc: 'Armá tu mini tienda o menú de delivery: el cliente elige, arma su pedido y te llega ordenado a WhatsApp.' },
  { icon: '🖥️', title: 'Linda en celular y en PC', desc: 'Se adapta a cualquier pantalla: en computadora muestra tu perfil y tus bloques en dos columnas.' },
  { icon: '🌍', title: 'Multiidioma', desc: 'Contenido en ES, EN, PT y más. Cada bloque con su traducción independiente.' },
  { icon: '📱', title: 'QR incluido', desc: 'Cada página genera un QR listo para imprimir o compartir en redes.' },
  { icon: '📊', title: 'Analíticas', desc: 'Vistas, clics por bloque, dispositivos y países en tiempo real.' },
  { icon: '🌨️', title: 'Filtros de temporada', desc: 'Mostrá bloques solo en invierno, verano u off. Automático.' },
  { icon: '📅', title: 'Solicitud de citas — próximamente', desc: 'Para profesionales, peluquerías y clases: tus clientes piden turno desde tu página. Estamos terminándolo.' },
  { icon: '⚡', title: 'Rápida y optimizada para SEO', desc: 'SSG + ISR. Carga instantánea y pensada para buscadores e IA.' },
]

// Precios y comisiones relevados en sep. 2026 desde los sitios de cada
// plataforma (o coberturas de terceros recientes cuando el sitio oficial no
// publica el número) -- no son datos inventados, pero cada plataforma puede
// cambiarlos en cualquier momento. LinkHub no cobra comisión propia por
// venta salvo que el dueño de la página la active a propósito (ver
// MERCADOPAGO_PLATFORM_FEE_PERCENT en SETUP.md), así que el 0% de acá es el
// comportamiento por defecto real, no una promesa de marketing.
const comparison = [
  { name: 'LinkHub', free: true, paidFrom: '€19/mes', fee: '0%', mercadoPago: true, highlight: true },
  { name: 'Linktree', free: true, paidFrom: '$8/mes', fee: '9–12%*', mercadoPago: false },
  { name: 'Beacons', free: true, paidFrom: '$10/mes', fee: '9%*', mercadoPago: false },
  { name: 'Stan Store', free: false, paidFrom: '$29/mes', fee: '0%', mercadoPago: false },
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

// Founding-member requests land here until there's a WhatsApp number or a
// real form — update once hola@linkhub.app is an inbox you actually own
// (or swap the domain). See SETUP.md §9 (Dar plan Pro gratis).
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

      {/* NAV (sticky, frosted on scroll, progress bar) */}
      <LandingNav />

      {/* HERO */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden className="hero-glow" style={{
          position: 'absolute', top: -200, left: '50%', width: 700, height: 700, marginLeft: -520, borderRadius: '50%',
          filter: 'blur(80px)', opacity: 0.32, background: `radial-gradient(circle, ${R} 0%, transparent 70%)`, pointerEvents: 'none',
        }} />
        <div aria-hidden className="hero-glow" style={{
          position: 'absolute', top: -140, right: '50%', width: 600, height: 600, marginRight: -620, borderRadius: '50%',
          filter: 'blur(80px)', opacity: 0.28, background: 'radial-gradient(circle, #FF8C00 0%, transparent 70%)', pointerEvents: 'none', animationDelay: '-6s',
        }} />
        {/* dotted grid, faded at the edges: texture without weight */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5,
          backgroundImage: 'radial-gradient(rgba(26,27,28,0.12) 1px, transparent 1px)', backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, #000 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, #000 30%, transparent 75%)',
        }} />

        <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto', padding: '36px 24px 88px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 48, alignItems: 'center' }}
          className="lg:!grid-cols-[1.05fr_0.95fr]">
          <div style={{ textAlign: 'center' }} className="lg:!text-left">
            <div className="hero-fade-up" style={{ animationDelay: '0s', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, background: '#fff', color: INK, padding: '6px 14px 6px 8px', borderRadius: 999, border: `1px solid ${BORDER}`, boxShadow: '0 2px 10px rgba(26,27,28,0.06)', marginBottom: 22 }}>
              <span style={{ background: R, color: '#fff', fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 999, letterSpacing: '.4px' }}>NUEVO</span>
              Pedidos y delivery por WhatsApp
            </div>
            <h1 className="hero-fade-up" style={{ animationDelay: '.08s', fontSize: 'clamp(36px, 5.6vw, 64px)', fontWeight: 700, color: INK, lineHeight: 1.04, letterSpacing: '-1.5px', marginBottom: 22 }}>
              Todo tu negocio<br />en{' '}
              <span style={{ backgroundImage: `linear-gradient(90deg, ${R}, #FF8C00)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>un solo link</span>
            </h1>
            <p className="hero-fade-up mx-auto lg:!mx-0" style={{ animationDelay: '.16s', fontSize: 'clamp(16px, 1.7vw, 19px)', color: MUTED, lineHeight: 1.55, marginBottom: 32, maxWidth: 520 }}>
              Mostrá tu catálogo, recibí pedidos por WhatsApp y compartí tu horario, tus redes y tu QR.
              Una página que se ve increíble en el celular y en la computadora.
            </p>
            <div className="hero-fade-up justify-center lg:!justify-start" style={{ animationDelay: '.24s', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/auth" className="hero-cta"
                style={{ fontSize: 16, fontWeight: 700, color: '#fff', background: R, padding: '16px 34px', borderRadius: 999, textDecoration: 'none', display: 'inline-block', boxShadow: '0 12px 30px rgba(232,21,10,0.32)' }}>
                Crear mi página gratis →
              </Link>
              <a href="#probalo" style={{ fontSize: 16, fontWeight: 600, color: INK, padding: '16px 26px', borderRadius: 999, textDecoration: 'none', border: `1.5px solid ${BORDER}`, background: 'rgba(255,255,255,0.8)', display: 'inline-block' }}>
                Ver cómo queda ↓
              </a>
            </div>
            <ul className="hero-fade-up justify-center lg:!justify-start" style={{ animationDelay: '.32s', display: 'flex', gap: '8px 20px', flexWrap: 'wrap', listStyle: 'none', padding: 0, margin: '22px 0 0', fontSize: 13, color: MUTED }}>
              {['Sin tarjeta de crédito', 'Free para siempre', 'Lista en minutos'].map(t => (
                <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span aria-hidden style={{ color: '#16A34A', fontWeight: 700 }}>✓</span>{t}</li>
              ))}
            </ul>
          </div>

          {/* Phone + floating proof chips (depth via parallax; chips are
              illustrative UI, not real metrics) */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <HeroShowcase />
            <Parallax speed={0.1} style={{ position: 'absolute', left: '2%', top: '18%', zIndex: 2 }} >
              <div className="hero-chip hidden sm:flex" style={{ alignItems: 'center', gap: 10, background: '#fff', padding: '10px 14px', borderRadius: 14, boxShadow: '0 14px 34px rgba(26,27,28,0.16)', border: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: 20 }}>🛒</span>
                <span style={{ fontSize: 12.5, lineHeight: 1.3, color: INK }}><b>Pedido recibido</b><br /><span style={{ color: MUTED }}>por WhatsApp</span></span>
              </div>
            </Parallax>
            <Parallax speed={0.2} style={{ position: 'absolute', right: '0%', top: '55%', zIndex: 2 }}>
              <div className="hero-chip hidden sm:flex" style={{ animationDelay: '-3s', alignItems: 'center', gap: 10, background: '#fff', padding: '10px 14px', borderRadius: 14, boxShadow: '0 14px 34px rgba(26,27,28,0.16)', border: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: 20 }}>🕒</span>
                <span style={{ fontSize: 12.5, lineHeight: 1.3, color: INK }}><b>Abierto ahora</b><br /><span style={{ color: MUTED }}>se actualiza solo</span></span>
              </div>
            </Parallax>
          </div>
        </div>
      </section>

      <LivePreview />

      {/* USE CASES */}
      <Reveal><section style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 72px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: INK, textAlign: 'center', marginBottom: 8 }}>¿Para quién es LinkHub?</h2>
        <p style={{ fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 36 }}>Negocios, creadores y equipos que quieren algo más profesional que un link en bio simple.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          {useCases.map((u, i) => (
            <Reveal key={u.title} delay={i * 90} style={{ height: '100%' }}><div style={{ background: '#fff', borderRadius: 16, padding: 22, border: `1px solid ${BORDER}`, height: '100%' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{u.icon}</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: INK, marginBottom: 6 }}>{u.title}</p>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55 }}>{u.desc}</p>
            </div></Reveal>
          ))}
        </div>
      </section></Reveal>

      {/* VERTICALS */}
      <Reveal><section id="rubros" style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 72px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: INK, textAlign: 'center', marginBottom: 8 }}>LinkHub para tu rubro</h2>
        <p style={{ fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 36 }}>
          Mirá qué bloques te sirven y cómo queda tu página, según el tipo de negocio.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {VERTICALS.map(v => (
            <Link key={v.slug} href={`/para/${v.slug}`}
              style={{ background: '#fff', borderRadius: 14, padding: 16, border: `1px solid ${BORDER}`, textDecoration: 'none' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 4 }}>{v.label}</p>
              <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{v.intro}</p>
            </Link>
          ))}
        </div>
      </section></Reveal>

      {/* HOW IT WORKS */}
      <Reveal><section style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 72px' }}>
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
      </section></Reveal>

      {/* FEATURES */}
      <Reveal><section id="funciones" style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 72px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: INK, textAlign: 'center', marginBottom: 36 }}>Todo lo que necesitás</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 90} style={{ height: '100%' }}><div style={{ background: '#fff', borderRadius: 16, padding: 20, border: `1px solid ${BORDER}`, height: '100%' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: INK, marginBottom: 6 }}>{f.title}</p>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.55 }}>{f.desc}</p>
            </div></Reveal>
          ))}
        </div>
      </section></Reveal>

      {/* BLOCKS */}
      <Reveal><section style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 72px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: INK, textAlign: 'center', marginBottom: 8 }}>Bloques para armar tu página</h2>
        <p style={{ fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 36 }}>
          Arrastrá y soltá los que necesites. {BLOCK_REGISTRY.length} bloques y sumando.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {BLOCK_REGISTRY.map(b => (
            <div key={b.type} style={{ background: '#fff', borderRadius: 14, padding: 16, border: `1px solid ${BORDER}`, position: 'relative' }}>
              {blockRequiresPro(b.type) && (
                <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 9, fontWeight: 700, letterSpacing: '.3px', textTransform: 'uppercase', color: R, background: '#FEF0EF', padding: '2px 7px', borderRadius: 20 }}>
                  Pro
                </span>
              )}
              <div style={{ fontSize: 22, marginBottom: 8 }}>{b.icon}</div>
              <p style={{ fontSize: 13, fontWeight: 600, color: INK, marginBottom: 4 }}>{b.label}</p>
              <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{b.description}</p>
            </div>
          ))}
        </div>
      </section></Reveal>

      {/* FREE TOOLS TEASER */}
      <Reveal><section style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 72px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: INK, textAlign: 'center', marginBottom: 8 }}>Herramientas gratis</h2>
        <p style={{ fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 36 }}>
          Generadores de QR sin registro — no hace falta cuenta para probarlos.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {QR_TOOLS.map(t => (
            <Link key={t.slug} href={`/herramientas/${t.slug}`}
              style={{ background: '#fff', borderRadius: 14, padding: 16, border: `1px solid ${BORDER}`, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22 }}>{t.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{t.label}</span>
            </Link>
          ))}
        </div>
      </section></Reveal>

      {/* PRICING */}
      <Reveal><section id="precios" style={{ maxWidth: 620, margin: '0 auto', padding: '0 24px 80px' }}>
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
      </section></Reveal>

      {/* COMPARISON */}
      <Reveal><section style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: INK, textAlign: 'center', marginBottom: 10 }}>Cómo nos comparamos</h2>
        <p style={{ fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 32 }}>
          Frente a los link-in-bio más conocidos, LinkHub arranca más barato y no te cobra por vender.
        </p>
        <div style={{ overflowX: 'auto', border: `1px solid ${BORDER}`, borderRadius: 16, background: '#fff' }}>
          <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '14px 16px', color: LIGHT, fontWeight: 600, fontSize: 12 }}></th>
                {comparison.map(c => (
                  <th key={c.name} style={{
                    textAlign: 'center', padding: '14px 12px', fontWeight: 700, color: c.highlight ? R : INK,
                    background: c.highlight ? '#FEF0EF' : 'transparent',
                  }}>
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {([
                { label: 'Plan gratis', get: (c: typeof comparison[number]) => c.free ? '✓' : '—' },
                { label: 'Plan pago desde', get: (c: typeof comparison[number]) => c.paidFrom },
                { label: 'Comisión propia sobre ventas', get: (c: typeof comparison[number]) => c.fee },
                { label: 'Mercado Pago (LatAm)', get: (c: typeof comparison[number]) => c.mercadoPago ? '✓' : '—' },
              ]).map((row, i) => (
                <tr key={row.label} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td style={{ padding: '12px 16px', color: MUTED, fontWeight: 500 }}>{row.label}</td>
                  {comparison.map(c => (
                    <td key={c.name} style={{
                      textAlign: 'center', padding: '12px 12px', fontWeight: 600,
                      color: row.get(c) === '✓' ? '#16A34A' : row.get(c) === '—' ? LIGHT : INK,
                      background: c.highlight ? '#FEF0EF' : i % 2 === 0 ? 'transparent' : 'transparent',
                    }}>
                      {row.get(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 11, color: LIGHT, textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
          *Linktree y Beacons bajan la comisión a 0% recién en sus planes más caros ($35/mes y $30-90/mes respectivamente).
          Precios públicos relevados en septiembre 2026, cada plataforma puede cambiarlos — confirmá en su sitio antes de decidir.
        </p>
      </section></Reveal>

      {/* CLOSING CTA */}
      <Reveal>
        <section id="empezar" style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 88px' }}>
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 28, padding: 'clamp(36px, 6vw, 72px) 24px', textAlign: 'center', background: `linear-gradient(135deg, ${INK}, #2B1210 60%, #4A1410)`, color: '#fff' }}>
            <div aria-hidden style={{ position: 'absolute', width: 420, height: 420, right: -120, top: -160, borderRadius: '50%', background: `radial-gradient(circle, ${R}99, transparent 70%)`, filter: 'blur(40px)' }} />
            <h2 style={{ position: 'relative', fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 700, letterSpacing: '-0.8px', lineHeight: 1.1, marginBottom: 14 }}>Tu página lista en minutos</h2>
            <p style={{ position: 'relative', fontSize: 16, color: 'rgba(255,255,255,0.72)', maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.55 }}>
              Empezá gratis, sin tarjeta. Cuando tu negocio crezca, pasás a Pro.
            </p>
            <Link href="/auth" className="hero-cta" style={{ position: 'relative', display: 'inline-block', fontSize: 16, fontWeight: 700, color: '#fff', background: R, padding: '16px 36px', borderRadius: 999, textDecoration: 'none', boxShadow: '0 12px 30px rgba(232,21,10,0.45)' }}>
              Crear mi página gratis →
            </Link>
          </div>
        </section>
      </Reveal>

      <StickyCta />

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${BORDER}`, padding: '24px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: LIGHT }}>© {new Date().getFullYear()} LinkHub · Hecho para negocios reales</p>
      </footer>
    </div>
  )
}
