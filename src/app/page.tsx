import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LinkHub — Crea tu página de enlaces profesional',
}

const features = [
  { icon: '🔗', title: 'Bloques visuales', desc: 'Links, acordeones, destacados, redes y más. Arrastrá y soltá.' },
  { icon: '🌍', title: 'Multiidioma', desc: 'Contenido en ES, EN, PT y más. Cada bloque con su traducción.' },
  { icon: '🌨️', title: 'Filtros de temporada', desc: 'Mostrá bloques solo en invierno, verano u off. Automático.' },
  { icon: '📱', title: 'QR incluido', desc: 'Cada página genera un QR listo para imprimir o compartir.' },
  { icon: '📊', title: 'Analíticas', desc: 'Vistas, clics, dispositivos y países en tiempo real.' },
  { icon: '⚡', title: '100 en Lighthouse', desc: 'SSG + ISR. Velocidad máxima y SEO optimizado para LLMs.' },
]

const plans = [
  {
    name: 'Free', price: '0', suffix: '',
    badge: '', border: 'border-bdr',
    features: ['1 página', 'Links simples y separadores', '1 idioma', 'Sin filtros de temporada', 'QR básico', 'Analíticas de vistas'],
    cta: 'Empezar gratis', href: '/auth', primary: false,
  },
  {
    name: 'Pro', price: '19', suffix: '/mes',
    badge: 'Más popular', border: 'border-red ring-2 ring-red',
    features: ['Páginas ilimitadas', 'Todos los bloques', 'Multiidioma (ES, EN, PT…)', 'Filtros de temporada', 'QR personalizado', 'Analíticas completas'],
    cta: 'Empezar Pro', href: '/auth?plan=pro', primary: true,
  },
  {
    name: 'Agency', price: '49', suffix: '/mes',
    badge: '', border: 'border-bdr',
    features: ['Todo lo de Pro', 'Dominio propio', 'Export CSV', 'Soporte prioritario'],
    cta: 'Empezar Agency', href: '/auth?plan=agency', primary: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{background:'#F6F6F5'}}>
      <nav className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
        <span className="text-xl font-bold" style={{color:'#1A1B1C'}}>Link<span style={{color:'#E8150A'}}>Hub</span></span>
        <div className="flex gap-3">
          <Link href="/auth" className="text-sm font-medium px-4 py-2 transition-colors" style={{color:'#5A5D60'}}>Iniciar sesión</Link>
          <Link href="/auth" className="text-sm font-semibold px-4 py-2 rounded-full text-white transition-colors" style={{background:'#E8150A'}}>Empezar gratis</Link>
        </div>
      </nav>

      <section className="max-w-3xl mx-auto px-4 pt-16 pb-20 text-center">
        <div className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-6 tracking-wide uppercase" style={{background:'#FEF0EF',color:'#E8150A'}}>
          MVP · LinkHub v1.0
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-5" style={{color:'#1A1B1C'}}>
          Tu página de enlaces,<br/>
          <span style={{color:'#E8150A'}}>profesional y en minutos</span>
        </h1>
        <p className="text-lg mb-8 max-w-xl mx-auto leading-relaxed" style={{color:'#5A5D60'}}>
          Bloques visuales, multiidioma, filtros de temporada y QR. Para negocios que necesitan más que un link en bio.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/auth" className="font-semibold px-8 py-3 rounded-full text-white text-sm transition-colors" style={{background:'#E8150A'}}>Crear mi página gratis →</Link>
          <Link href="/p/demo" className="bg-white font-medium px-8 py-3 rounded-full text-sm transition-colors" style={{color:'#1A1B1C',border:'1px solid rgba(26,27,28,0.15)'}}>Ver ejemplo</Link>
        </div>
        <p className="text-xs mt-4" style={{color:'#9A9D9F'}}>Sin tarjeta de crédito. Free para siempre.</p>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-center mb-12" style={{color:'#1A1B1C'}}>Todo lo que necesitás</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(f => (
            <div key={f.title} className="bg-white rounded-2xl p-5" style={{border:'1px solid rgba(26,27,28,0.09)'}}>
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-1" style={{color:'#1A1B1C'}}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{color:'#5A5D60'}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-24">
        <h2 className="text-2xl font-bold text-center mb-3" style={{color:'#1A1B1C'}}>Precios simples</h2>
        <p className="text-center mb-12 text-sm" style={{color:'#5A5D60'}}>Empezá gratis. El salto a Pro es cuando necesitás más bloques.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {plans.map(p => (
            <div key={p.name} className={`bg-white rounded-2xl p-6 relative border-2 ${p.border}`}>
              {p.badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-3 py-1 rounded-full" style={{background:'#E8150A'}}>{p.badge}</div>}
              <div className="font-bold text-lg mb-1" style={{color:'#1A1B1C'}}>{p.name}</div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold" style={{color:'#1A1B1C'}}>€{p.price}</span>
                <span className="text-sm" style={{color:'#9A9D9F'}}>{p.suffix}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {p.features.map(f => (
                  <li key={f} className="text-sm flex gap-2" style={{color:'#5A5D60'}}>
                    <span style={{color:'#E8150A'}}>✓</span><span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href={p.href} className="block text-center text-sm font-semibold py-2.5 rounded-full transition-colors"
                style={p.primary ? {background:'#E8150A',color:'#fff'} : {background:'#F2F3F4',color:'#1A1B1C'}}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center" style={{borderColor:'rgba(26,27,28,0.09)'}}>
        <p className="text-xs" style={{color:'#9A9D9F'}}>© {new Date().getFullYear()} LinkHub · Hecho para negocios reales</p>
      </footer>
    </div>
  )
}
