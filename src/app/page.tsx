import Link from 'next/link'
import type { Metadata } from 'next'
import type { Page } from '@/types'
import { PageView } from './p/[slug]/PageView'

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

const useCases = [
  { icon: '⛷️', title: 'Escuelas de esquí y estaciones', desc: 'Horarios de temporada, reserva de clases y forfaits en un solo link, con bloques que se activan solo en invierno.' },
  { icon: '🏖️', title: 'Alquileres y turismo de verano', desc: 'Mismo negocio, otra temporada: activá los bloques de playa/verano y ocultá los de nieve sin duplicar la página.' },
  { icon: '💇', title: 'Servicios y comercios locales', desc: 'WhatsApp, ubicación, horarios y redes sociales — todo lo que un cliente necesita antes de visitarte.' },
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

// Sample page rendered inside the hero phone mockup — it's the real PageView
// component with example data, not a screenshot, so it never goes stale.
const demoPage: Page = {
  id: 'demo', user_id: 'demo', slug: 'sierra-nevada-ski',
  name: 'Demo', published: true, qr_url: null, custom_domain: null, views: 0,
  created_at: '', updated_at: '',
  settings: {
    defaultLang: 'es', enabledLangs: ['es'], seasonMode: 'always',
    primaryColor: R, backgroundColor: '#FFFFFF', fontFamily: 'DM Sans', showPoweredBy: false,
    seo: { title: '', description: '', ogImage: null },
  },
  blocks: [
    {
      id: '1', type: 'featured', order: 0, visible: true, seasonFilter: 'always',
      data: {
        icon: '⛷️', colorScheme: 'blue',
        badge: { es: 'Temporada 25/26', en: '', pt: '', fr: '', de: '', it: '' },
        translations: {
          es: { title: 'Reservá tu clase', description: 'Grupos e individuales, todos los niveles' },
          en: { title: '', description: '' }, pt: { title: '', description: '' },
          fr: { title: '', description: '' }, de: { title: '', description: '' }, it: { title: '', description: '' },
        },
        url: '#',
      },
    },
    {
      id: '2', type: 'link', order: 1, visible: true, seasonFilter: 'always',
      data: {
        icon: '🎿', iconBg: 'blue', openInNewTab: false, url: '#',
        translations: {
          es: { title: 'Alquiler de equipo', description: 'Esquís, botas y bastones' },
          en: { title: '', description: '' }, pt: { title: '', description: '' },
          fr: { title: '', description: '' }, de: { title: '', description: '' }, it: { title: '', description: '' },
        },
      },
    },
    {
      id: '3', type: 'link', order: 2, visible: true, seasonFilter: 'always',
      data: {
        icon: '🎫', iconBg: 'green', openInNewTab: false, url: '#',
        translations: {
          es: { title: 'Forfaits y precios', description: 'Día, medio día y temporada' },
          en: { title: '', description: '' }, pt: { title: '', description: '' },
          fr: { title: '', description: '' }, de: { title: '', description: '' }, it: { title: '', description: '' },
        },
      },
    },
    {
      id: '4', type: 'contact_card', order: 3, visible: true, seasonFilter: 'always',
      data: { whatsapp: '34600000000', showHours: false },
    },
    {
      id: '5', type: 'social_grid', order: 4, visible: true, seasonFilter: 'always',
      data: {
        items: [
          { id: 's1', platform: 'instagram', url: '#', label: 'Instagram' },
          { id: 's2', platform: 'facebook', url: '#', label: 'Facebook' },
        ],
      },
    },
  ],
}

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: SNOW }}>

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
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 24px 72px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 40, alignItems: 'center' }}
        className="lg:!grid-cols-[1.1fr_0.9fr]">
        <div style={{ textAlign: 'center' }} className="lg:!text-left">
          <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '.7px', textTransform: 'uppercase', background: '#FEF0EF', color: R, padding: '4px 12px', borderRadius: 20, marginBottom: 20 }}>
            Pensado para negocios de temporada
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 700, color: INK, lineHeight: 1.15, marginBottom: 18 }}>
            Tu página de enlaces,<br />
            <span style={{ color: R }}>profesional y en minutos</span>
          </h1>
          <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.6, marginBottom: 28, maxWidth: 480 }} className="mx-auto lg:!mx-0">
            Bloques visuales, multiidioma, filtros de temporada y QR.
            Para negocios que necesitan más que un simple link en bio.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }} className="justify-center lg:!justify-start">
            <Link href="/auth" style={{ fontSize: 14, fontWeight: 600, color: '#fff', background: R, padding: '13px 28px', borderRadius: 25, textDecoration: 'none' }}>
              Crear mi página gratis →
            </Link>
          </div>
          <p style={{ fontSize: 12, color: LIGHT, marginTop: 14 }}>Sin tarjeta de crédito. Free para siempre.</p>
        </div>

        {/* Phone mockup — real PageView component, not a screenshot */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 300, borderRadius: 36, border: '10px solid #1A1B1C', background: '#fff',
            overflow: 'hidden', boxShadow: '0 24px 60px rgba(26,27,28,0.18)', maxHeight: 560,
          }}>
            <div style={{ maxHeight: 540, overflow: 'hidden' }}>
              <PageView page={demoPage} />
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 72px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: INK, textAlign: 'center', marginBottom: 8 }}>¿Para quién es LinkHub?</h2>
        <p style={{ fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 36 }}>Cualquier negocio cuya oferta cambia con la temporada o el mes.</p>
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
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px 80px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: INK, textAlign: 'center', marginBottom: 10 }}>Precios simples</h2>
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
