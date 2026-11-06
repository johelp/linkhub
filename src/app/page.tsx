import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { ArrowRight, Check, CalendarClock, ShoppingBag, CreditCard, BarChart3, Stethoscope, Scissors, GraduationCap, Utensils, Ticket, Mountain, QrCode, Languages, MonitorSmartphone, SlidersHorizontal, LifeBuoy, Wallet, Search, Bot, Minus } from 'lucide-react'
import { LivePreview } from './LivePreview'
import { Reveal, LandingNav, StickyCta } from './landing/ScrollFx'
import { HeroShowcase } from './HeroShowcase'
import { ROADMAP } from '@/lib/roadmap'
import { Pricing } from './landing/Pricing'
import { QR_TOOLS } from '@/lib/qrTools'
import { VERTICALS } from '@/lib/verticals'
import { NICHES } from '@/lib/examples'

export const metadata: Metadata = {
  title: 'LinkHub — Tu presencia profesional sin necesidad de una web',
  description: 'Reúne servicios, citas, pedidos y cobros en una sola página que compartes desde Instagram, WhatsApp o un código QR. Para autónomos y profesionales en España y Latinoamérica.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'LinkHub — Tu presencia profesional sin necesidad de una web',
    description: 'Citas, pedidos y cobros en una sola página para autónomos y profesionales.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
}

// Design tokens for this page: one neutral scale, one accent (used only for the
// primary action). No gradients, no glows: the product screenshots carry the colour.
const INK = '#111314'
const BODY = '#3F4346'
const MUTED = '#5B6064'
const LINE = 'rgba(17,19,20,0.10)'
const PAPER = '#FAFAF8'
const ACCENT = '#E8150A'

const LAUNCH_OFFER_HREF = 'mailto:hola@linkhub.app?subject=Acceso%20de%20lanzamiento%20LinkHub'

const segments = [
  { icon: Stethoscope, title: 'Salud y bienestar', text: 'Consultas, terapias y fisioterapia con solicitud de cita y horarios claros.', href: '/para/profesionales-y-clases' },
  { icon: Scissors, title: 'Belleza y estética', text: 'Peluquerías y centros con reservas por WhatsApp y horario siempre al día.', href: '/para/peluquerias-y-salones' },
  { icon: GraduationCap, title: 'Clases y formación', text: 'Profesores y entrenadores con servicios, tarifas y reserva de plaza.', href: '/para/profesionales-y-clases' },
  { icon: Utensils, title: 'Gastronomía y comercio', text: 'Carta, catálogo y pedidos a domicilio o para recoger, directos a tu móvil.', href: '/para/restaurantes' },
  { icon: Ticket, title: 'Eventos', text: 'Venta de entradas con código QR y validación en la puerta.', href: '/para/eventos' },
  { icon: Mountain, title: 'Turismo y temporada', text: 'Contenido que cambia con la temporada y en varios idiomas.', href: '/para/turismo-y-temporada' },
]

const steps = [
  { n: '01', title: 'Crea tu página', text: 'Elige una plantilla o empieza en blanco. Tu enlace queda listo al instante.' },
  { n: '02', title: 'Añade lo que ofreces', text: 'Servicios, horarios, catálogo, contacto y redes. Editas directamente sobre la vista previa.' },
  { n: '03', title: 'Compártela y empieza a recibir', text: 'Ponla en tu biografía de Instagram, en WhatsApp o imprime el QR. Las citas y pedidos llegan a tu móvil.' },
]

const faqs = [
  { q: '¿En qué se diferencia de un panel de enlaces o una tarjeta de visita?', a: 'Un panel de enlaces solo reúne enlaces. Con LinkHub tus clientes también reservan citas, hacen pedidos y pagan, y tu página incluye los datos que Google y los asistentes de IA necesitan para entender tu negocio. La tarjeta de contacto (vCard) es uno más de los módulos.' },
  { q: '¿Quién controla mi página y mis datos?', a: 'Tú. Editas todo cuando quieras, conectas tu propia pasarela de cobro y puedes exportar tus contactos y tus cobros. Si dejas LinkHub, te llevas tu información.' },
  { q: '¿Me ayudáis a ponerlo en marcha?', a: 'Sí. La plataforma incluye un asistente paso a paso para crear tu página y conectar tus cobros, y puedes escribirnos a hola@linkhub.app si te atascas.' },
  { q: '¿Necesito tener una página web?', a: 'No. LinkHub está pensado para quien trabaja desde Instagram, WhatsApp o el boca a boca: tu página reúne lo que ofreces y la compartes con un enlace o un código QR. Si más adelante quieres tu propio dominio, el plan Pro lo incluye.' },
  { q: '¿Cómo recibo los pagos?', a: 'Conectas tu propia cuenta (Mercado Pago, Stripe o el TPV de tu banco con Redsys) y el dinero va directo a ti. LinkHub no retiene fondos. Elige la pasarela que mejor encaje con tu país y tu banco.' },
  { q: '¿Cobráis comisión por las ventas, pedidos o citas?', a: 'Las citas y los pedidos llegan por WhatsApp y no pasan por nosotros. Por defecto LinkHub no aplica ninguna comisión sobre tus ventas; solo pagas la suscripción si eliges Pro. Las pasarelas de pago cobran sus propias tarifas.' },
  { q: '¿Qué pasa con los datos de mis clientes?', a: 'Los pedidos y las solicitudes de cita se envían directamente a tu WhatsApp. Solo guardamos los emails que tus visitantes dejen en un formulario de contacto, y las credenciales de cobro se almacenan cifradas.' },
  { q: '¿Funciona fuera de España?', a: 'Sí. Está pensado para España y Latinoamérica: monedas locales, varias pasarelas y WhatsApp como canal principal. Puedes ofrecer tu página en varios idiomas.' },
  { q: '¿Puedo cancelar cuando quiera?', a: 'Sí. Gestionas tu suscripción desde tu cuenta y puedes volver al plan gratuito en cualquier momento.' },
]

// Headline split into words so each one can rise into place in sequence; the
// key phrase gets an accent underline that draws itself afterwards.
function HeadlineWords() {
  const lead = ['Tu', 'presencia', 'profesional,']
  const key = ['sin', 'necesidad', 'de', 'una', 'web']
  const word = (w: string, i: number) => (
    <span key={w + i}><span className="hw"><span style={{ ['--i' as string]: i }}>{w}</span></span>{' '}</span>
  )
  return (
    <>
      {lead.map((w, i) => word(w, i))}
      <span className="hero-em">{key.map((w, i) => word(w, lead.length + i))}</span>
    </>
  )
}

export default function LandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'SoftwareApplication', name: 'LinkHub', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', offers: [{ '@type': 'Offer', price: '0', priceCurrency: 'EUR', name: 'Free' }, { '@type': 'Offer', price: '19', priceCurrency: 'EUR', name: 'Pro (EUR)' }, { '@type': 'Offer', price: '20', priceCurrency: 'USD', name: 'Pro (USD)' }] },
      { '@type': 'FAQPage', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    ],
  }

  return (
    <div style={{ background: PAPER, color: INK }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      {/* Announcement: plain text, one link */}
      <div style={{ background: INK, color: '#fff', textAlign: 'center', fontSize: 13, padding: '9px 16px' }}>
        Lanzamiento: plan Pro gratuito para los primeros negocios.{' '}
        <Link href={LAUNCH_OFFER_HREF} style={{ color: '#fff', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>Solicitar acceso</Link>
      </div>

      <LandingNav />

      <main id="contenido">
        {/* HERO */}
        <section aria-labelledby="hero-h" style={{ borderBottom: `1px solid ${LINE}` }}>
          <div className="mx-auto max-w-[1160px] px-5 sm:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24 grid gap-14 lg:grid-cols-[1.05fr_0.95fr] items-center">
            <div className="text-center lg:text-left">
              <p className="hero-fade-up text-[13px] font-semibold uppercase tracking-[0.12em]" style={{ color: MUTED, animationDelay: '0s' }}>Para autónomos y profesionales</p>
              <h1 id="hero-h" className="hero-fade-up mt-4 font-bold" style={{ fontSize: 'clamp(36px, 5.2vw, 60px)', lineHeight: 1.06, letterSpacing: '-0.035em', animationDelay: '.06s' }}>
                <HeadlineWords />
              </h1>
              <p className="hero-fade-up mx-auto lg:mx-0 mt-6 max-w-[560px]" style={{ fontSize: 'clamp(17px, 1.6vw, 19px)', lineHeight: 1.6, color: BODY, animationDelay: '.12s' }}>
                Reúne en una sola página tus servicios, tu agenda, tus pedidos y tus cobros. La compartes desde Instagram, WhatsApp o un código QR, y tus clientes reservan o compran sin salir de ahí.
              </p>
              <div className="hero-fade-up mt-8 flex flex-wrap gap-3 justify-center lg:justify-start" style={{ animationDelay: '.18s' }}>
                <Link href="/auth" className="inline-flex items-center gap-2 rounded-full px-7 text-[16px] font-semibold text-white no-underline transition-colors hover:brightness-95" style={{ background: ACCENT, height: 52 }}>
                  Crear mi página gratis <ArrowRight size={17} aria-hidden />
                </Link>
                <a href="#probar" className="inline-flex items-center rounded-full px-6 text-[16px] font-semibold no-underline transition-colors hover:bg-white" style={{ height: 52, color: INK, border: `1.5px solid ${LINE}` }}>
                  Ver un ejemplo
                </a>
              </div>
              <p className="hero-fade-up mt-5 text-[13px] lg:text-left text-center" style={{ color: MUTED, animationDelay: '.3s' }}>
                Cobra con <strong style={{ color: INK }}>Mercado Pago</strong>, <strong style={{ color: INK }}>Stripe</strong> o <strong style={{ color: INK }}>Redsys</strong>, y te ayudamos a ponerla en marcha.
              </p>
              <ul className="hero-fade-up mt-6 flex flex-wrap gap-x-6 gap-y-2 justify-center lg:justify-start text-[14px]" style={{ color: MUTED, listStyle: 'none', padding: 0, animationDelay: '.24s' }}>
                {['Gratis para empezar', 'Sin tarjeta de crédito', 'Publicada en minutos'].map(t => (
                  <li key={t} className="flex items-center gap-2"><Check size={15} aria-hidden style={{ color: '#15803D' }} />{t}</li>
                ))}
              </ul>
            </div>
            <HeroShowcase />
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section id="rubros" aria-labelledby="rubros-h" className="mx-auto max-w-[1160px] px-5 sm:px-8 py-20 lg:py-28">
          <Reveal>
            <SectionHead id="rubros-h" eyebrow="Para quién" title="Hecho para quien trabaja desde sus redes" lead="Si tus clientes te encuentran en Instagram o por recomendación, LinkHub te da un lugar profesional al que dirigirlos." />
          </Reveal>
          <div className="mt-12 grid gap-px rounded-2xl overflow-hidden sm:grid-cols-2 lg:grid-cols-3" style={{ background: LINE, border: `1px solid ${LINE}` }}>
            {segments.map((s, i) => (
              <Reveal key={s.title} delay={(i % 3) * 70} style={{ background: '#fff' }}>
                <Link href={s.href} className="group block h-full p-7 no-underline transition-colors hover:bg-[#FAFAF8]">
                  <s.icon size={22} strokeWidth={1.75} aria-hidden />
                  <h3 className="mt-5 text-[17px] font-semibold" style={{ color: INK }}>{s.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed" style={{ color: BODY }}>{s.text}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-[14px] font-semibold" style={{ color: INK }}>Ver ejemplo <ArrowRight size={14} aria-hidden className="transition-transform group-hover:translate-x-1" /></span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* PRODUCT */}
        <section id="funciones" aria-labelledby="func-h" style={{ background: '#fff', borderBlock: `1px solid ${LINE}` }}>
          <div className="mx-auto max-w-[1160px] px-5 sm:px-8 py-20 lg:py-28">
            <Reveal><SectionHead id="func-h" eyebrow="El producto" title="Todo lo que tu negocio necesita en un solo enlace" lead="Sin instalar nada y sin conocimientos técnicos." /></Reveal>

            <div className="mt-16 space-y-24 lg:space-y-32">
              <Feature icon={MonitorSmartphone} title="Un editor que se entiende a la primera"
                text="Haz clic sobre cualquier parte de tu página para editarla. Ves el resultado al instante en móvil, tableta u ordenador, y los cambios se guardan solos."
                points={['Edición directa sobre la vista previa', 'Bloques para servicios, horarios, contacto, redes y mapa de Google', 'Se adapta a móvil y ordenador']}>
                <Shot src="/landing/editor.webp" w={1600} h={1000} alt="Editor de LinkHub: estructura de la página a la izquierda, vista previa en el centro y ajustes del bloque a la derecha" />
              </Feature>

              <Feature flip icon={CalendarClock} title="Citas y pedidos que llegan a tu WhatsApp"
                text="Tus clientes eligen el servicio y un horario libre, o arman su pedido, y te llega un mensaje ordenado. Tú confirmas por chat, como siempre."
                points={['Solicitud de cita con servicios, duración y precio', 'Carrito de pedidos para catálogo o carta', 'Sin comisiones sobre tus ventas']}>
                <div className="relative">
                  <Shot src="/landing/pagina-escritorio.webp" w={1400} h={875} alt="Página pública de una psicóloga con solicitud de cita, bono de sesiones y horario de consulta" />
                  <div className="hidden sm:block absolute -bottom-8 -right-3 lg:-right-8 w-[28%] rounded-[22px] overflow-hidden" style={{ border: `6px solid ${INK}`, boxShadow: '0 20px 50px rgba(17,19,20,.25)' }}>
                    <Image src="/landing/pagina-movil.webp" width={640} height={1385} alt="La misma página vista en un teléfono" sizes="200px" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                </div>
              </Feature>

              <Feature icon={CreditCard} title="Cobra online con la pasarela de tu país"
                text="Conecta tu cuenta con un asistente paso a paso. El dinero va directo a ti y puedes consultar el detalle de cada cobro cuando lo necesites."
                points={['Mercado Pago, Stripe y Redsys (TPV de tu banco)', 'Cada cliente elige su pasarela', 'Historial completo y exportación a CSV']}
                >
                <Shot src="/landing/cobros.webp" w={1100} h={990} alt="Asistente de cobros de LinkHub con la elección de pasarela de pago" />
              </Feature>

              <Feature flip icon={BarChart3} title="Entiende qué funciona"
                text="Consulta cuántas personas visitan tu página, qué enlaces y servicios generan más clics y desde qué dispositivos entran."
                points={['Visitas y clics con comparación del periodo anterior', 'Bloques más clicados', 'Datos por página']}>
                <Shot src="/landing/analiticas.webp" w={1200} h={900} alt="Panel de analíticas con gráfico de visitas y clics y bloques más clicados" />
              </Feature>
            </div>
          </div>
        </section>

        {/* BEYOND LINK-IN-BIO */}
        <section id="diferencia" aria-labelledby="dif-h" style={{ background: '#fff', borderBlock: `1px solid ${LINE}` }}>
          <div className="mx-auto max-w-[1160px] px-5 sm:px-8 py-20 lg:py-28">
            <Reveal><SectionHead id="dif-h" eyebrow="La diferencia" title="Más que un panel de enlaces o una tarjeta de visita" lead="Un panel de enlaces solo apunta a otros sitios. LinkHub es tu presencia completa: la gente te encuentra, te entiende y contrata sin salir de ahí." /></Reveal>

            <div className="mt-12 overflow-x-auto rounded-2xl" style={{ border: `1px solid ${LINE}` }}>
              <table className="w-full min-w-[640px] text-left text-[15px]">
                <caption className="sr-only">Comparación entre un panel de enlaces o tarjeta de contacto y LinkHub</caption>
                <thead>
                  <tr style={{ background: PAPER }}>
                    <th scope="col" className="px-5 py-4 font-semibold">Qué necesitas</th>
                    <th scope="col" className="px-5 py-4 font-semibold" style={{ color: MUTED }}>Panel de enlaces / vCard</th>
                    <th scope="col" className="px-5 py-4 font-semibold">LinkHub</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Reunir tus enlaces y redes', true, true],
                    ['Guardar tu contacto en la agenda (vCard)', true, true],
                    ['Citas con horarios libres y pedidos con carrito', false, true],
                    ['Cobros online con tu pasarela', false, true],
                    ['Aparecer en Google con datos estructurados según tu tipo de negocio', false, true],
                    ['Que los asistentes de IA entiendan y recomienden tu negocio', false, true],
                    ['Base de conocimiento y preguntas frecuentes', false, true],
                    ['Mapa de Google, horario en vivo y ficha local', false, true],
                    ['Analíticas de visitas y clics por bloque', 'Básicas', true],
                    ['Conector para asistentes de IA (MCP) y API propia', false, 'Por invitación'],
                  ].map(([what, other, mine]) => (
                    <tr key={String(what)} style={{ borderTop: `1px solid ${LINE}` }}>
                      <th scope="row" className="px-5 py-4 font-medium" style={{ color: INK }}>{what}</th>
                      <td className="px-5 py-4">{other === true ? <><Check size={18} aria-hidden style={{ color: '#15803D' }} /><span className="sr-only">Sí</span></> : other === false ? <><Minus size={18} aria-hidden style={{ color: '#9AA0A5' }} /><span className="sr-only">No</span></> : <span style={{ color: MUTED }}>{other}</span>}</td>
                      <td className="px-5 py-4 font-semibold">{mine === true ? <><Check size={18} aria-hidden style={{ color: '#15803D' }} /><span className="sr-only">Sí</span></> : <span>{mine}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {[
                { icon: Search, title: 'Te encuentran en Google', text: 'Tu página incluye datos estructurados (schema.org) adaptados a tu tipo de negocio: carta y reservas si eres restaurante, servicios y citas si eres profesional, cursos si das clases, entradas si organizas eventos.' },
                { icon: Bot, title: 'Los asistentes de IA te entienden', text: 'Cada página publica una versión limpia para IA (llms.txt) con tus servicios, precios, horario y respuestas, y tu base de conocimiento alimenta las preguntas frecuentes.' },
                { icon: Wallet, title: 'Se conecta con tus herramientas', text: 'Conector MCP y API para que tu chatbot o tus automatizaciones lean y gestionen tu página y tu base de conocimiento. Disponible por invitación.' },
              ].map((c, i) => (
                <Reveal key={c.title} delay={i * 80}>
                  <div className="h-full rounded-2xl p-7" style={{ background: PAPER, border: `1px solid ${LINE}` }}>
                    <c.icon size={22} strokeWidth={1.75} aria-hidden />
                    <h3 className="mt-4 text-[18px] font-semibold">{c.title}</h3>
                    <p className="mt-2.5 text-[15px] leading-relaxed" style={{ color: BODY }}>{c.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* EXAMPLES */}
        <section aria-labelledby="ejemplos-h" className="mx-auto max-w-[1160px] px-5 sm:px-8 py-20 lg:py-24">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <SectionHead id="ejemplos-h" eyebrow="Ejemplos" title="Mira páginas reales de tu sector" lead="Doce ejemplos interactivos con datos de España, Argentina y México. Pide una cita, arma un pedido, abre las preguntas." />
              <Link href="/ejemplos" className="inline-flex items-center gap-2 rounded-full px-6 text-[15px] font-semibold no-underline hover:bg-white" style={{ height: 48, border: `1.5px solid ${LINE}`, color: INK }}>Ver todos los ejemplos <ArrowRight size={16} aria-hidden /></Link>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {NICHES.slice(0, 8).map(n => (
              <Link key={n.slug} href={`/ejemplos/${n.slug}`} className="group flex items-center justify-between gap-3 rounded-xl bg-white px-5 py-4 no-underline transition-colors hover:bg-[#FAFAF8]" style={{ border: `1px solid ${LINE}`, color: INK }}>
                <span className="flex items-center gap-3 min-w-0"><span aria-hidden className="h-8 w-1.5 rounded-full flex-shrink-0" style={{ background: n.color }} /><span className="text-[15px] font-semibold truncate">{n.label}</span></span>
                <ArrowRight size={15} aria-hidden className="flex-shrink-0 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </section>

        {/* CONTROL / ONBOARDING / GATEWAYS */}
        <section aria-labelledby="control-h" className="mx-auto max-w-[1160px] px-5 sm:px-8 py-20 lg:py-28">
          <Reveal><SectionHead id="control-h" eyebrow="Tú decides" title="Control total sobre tu página, desde el primer día" lead="Sin depender de un desarrollador ni de una agencia." /></Reveal>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {[
              { icon: SlidersHorizontal, title: 'Control total sobre tu página', text: 'Editas contenido, diseño, idiomas y enlaces cuando quieras, sin pedir permiso. Tus contactos y tus datos son tuyos y puedes exportarlos.', items: ['Edición sin límites y guardado automático', 'Dominio propio en el plan Pro', 'Exporta tus contactos y tus cobros a CSV'] },
              { icon: LifeBuoy, title: 'Puesta en marcha asistida', text: 'Un asistente te guía paso a paso para crear tu página y conectar tus cobros, y te acompañamos si te atascas.', items: ['Plantillas por tipo de negocio', 'Asistente de cobros en 3 pasos', 'Soporte por correo'] },
              { icon: Wallet, title: 'Cobros con tu pasarela', text: 'Cada cliente elige cómo cobrar. El dinero va directo a tu cuenta; LinkHub no retiene fondos.', items: ['Mercado Pago', 'Stripe', 'Redsys (TPV de tu banco)'] },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i * 80}>
                <div className="h-full rounded-2xl p-8" style={{ background: '#fff', border: `1px solid ${LINE}` }}>
                  <c.icon size={24} strokeWidth={1.75} aria-hidden />
                  <h3 className="mt-5 text-[19px] font-semibold">{c.title}</h3>
                  <p className="mt-3 text-[15.5px] leading-relaxed" style={{ color: BODY }}>{c.text}</p>
                  <ul className="mt-5 space-y-2.5" style={{ listStyle: 'none', padding: 0 }}>
                    {c.items.map(it => <li key={it} className="flex gap-3 text-[15px]" style={{ color: BODY }}><Check size={17} aria-hidden className="flex-shrink-0 mt-0.5" style={{ color: '#15803D' }} />{it}</li>)}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-[13.5px]" style={{ color: MUTED }}>Mercado Pago, Stripe y Redsys son marcas de sus respectivos titulares. La disponibilidad de cada pasarela depende de tu país y se está activando de forma gradual.</p>
        </section>

        {/* TRY IT */}
        <LivePreview />

        {/* HOW IT WORKS */}
        <section aria-labelledby="como-h" className="mx-auto max-w-[1160px] px-5 sm:px-8 pb-20 lg:pb-28">
          <Reveal><SectionHead id="como-h" eyebrow="Cómo funciona" title="De cero a tu primera cita en una tarde" /></Reveal>
          <ol className="mt-12 grid gap-10 md:grid-cols-3" style={{ listStyle: 'none', padding: 0 }}>
            {steps.map((s, i) => (
              <li key={s.n}>
                <Reveal delay={i * 80}>
                  <p className="text-[13px] font-semibold tabular-nums" style={{ color: MUTED }}>{s.n}</p>
                  <div className="mt-3 pt-5" style={{ borderTop: `2px solid ${INK}` }}>
                    <h3 className="text-[19px] font-semibold">{s.title}</h3>
                    <p className="mt-2 text-[16px] leading-relaxed" style={{ color: BODY }}>{s.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        {/* MARKETS */}
        <section aria-labelledby="mercados-h" style={{ background: '#fff', borderBlock: `1px solid ${LINE}` }}>
          <div className="mx-auto max-w-[1160px] px-5 sm:px-8 py-20 lg:py-24">
            <Reveal><SectionHead id="mercados-h" eyebrow="Mercados" title="Pensado para España y Latinoamérica" lead="Cada mercado paga y se comunica a su manera. LinkHub se adapta." /></Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {[
                { t: 'España', items: ['Cobros en euros con Redsys (TPV de tu banco) o Stripe', 'Pensado para autónomos y profesionales', 'WhatsApp como canal de citas y pedidos'] },
                { t: 'Latinoamérica', items: ['Cobros con Mercado Pago en moneda local', 'Pesos argentinos, mexicanos, chilenos, colombianos y más', 'WhatsApp como canal de ventas y atención'] },
              ].map((m, i) => (
                <Reveal key={m.t} delay={i * 80}>
                  <div className="h-full rounded-2xl p-8" style={{ border: `1px solid ${LINE}`, background: PAPER }}>
                    <h3 className="text-[20px] font-semibold">{m.t}</h3>
                    <ul className="mt-5 space-y-3" style={{ listStyle: 'none', padding: 0 }}>
                      {m.items.map(it => <li key={it} className="flex gap-3 text-[16px]" style={{ color: BODY }}><Check size={18} aria-hidden className="flex-shrink-0 mt-0.5" style={{ color: '#15803D' }} />{it}</li>)}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
            <p className="mt-6 flex items-center gap-2 text-[14px]" style={{ color: MUTED }}><Languages size={16} aria-hidden />Tu página puede mostrarse en varios idiomas, útil si atiendes a turistas o clientes internacionales.</p>
          </div>
        </section>

        {/* PRICING */}
        <section id="precios" aria-labelledby="precios-h" className="mx-auto max-w-[960px] px-5 sm:px-8 py-20 lg:py-28">
          <Reveal><SectionHead id="precios-h" eyebrow="Precios" title="Empieza gratis. Pasa a Pro cuando lo necesites" lead="Pagas en la moneda de tu país y sin permanencia." /></Reveal>
          <Pricing />
        </section>

        {/* LISTENING */}
        <section id="escuchamos" aria-labelledby="escuchamos-h" className="mx-auto max-w-[1160px] px-5 sm:px-8 py-20 lg:py-24">
          <Reveal>
            <SectionHead id="escuchamos-h" eyebrow="Escuchamos tus necesidades" title="Lo próximo lo decides tú" lead="Estamos estudiando estas funciones. Los clientes votan desde su panel y construimos primero lo que más piden." />
          </Reveal>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" style={{ listStyle: 'none', padding: 0 }}>
            {ROADMAP.map((r, i) => (
              <li key={r.key}><Reveal delay={(i % 3) * 70} className="h-full">
                <div className="h-full rounded-2xl p-6" style={{ background: '#fff', border: `1px solid ${LINE}` }}>
                  <span aria-hidden className="text-2xl">{r.icon}</span>
                  <h3 className="mt-3 text-[16px] font-semibold" style={{ color: INK }}>{r.title} <span className="ml-1 align-middle text-[11px] font-semibold rounded-full px-2 py-0.5" style={{ background: '#F2F3F4', color: MUTED }}>En estudio</span></h3>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed" style={{ color: BODY }}>{r.text}</p>
                </div>
              </Reveal></li>
            ))}
          </ul>
          <p className="mt-6 text-[14px]" style={{ color: MUTED }}>¿Te falta algo? Cuéntanos qué necesitas en <a href="mailto:hola@linkhub.johelpastorino.com" className="underline">hola@linkhub.johelpastorino.com</a>.</p>
        </section>

        {/* FAQ */}
        <section id="faq" aria-labelledby="faq-h" style={{ background: '#fff', borderBlock: `1px solid ${LINE}` }}>
          <div className="mx-auto max-w-[780px] px-5 sm:px-8 py-20 lg:py-24">
            <Reveal><SectionHead id="faq-h" eyebrow="Preguntas frecuentes" title="Lo que suelen preguntarnos" /></Reveal>
            <div className="mt-10" style={{ borderTop: `1px solid ${LINE}` }}>
              {faqs.map(f => (
                <details key={f.q} className="group" style={{ borderBottom: `1px solid ${LINE}` }}>
                  <summary className="flex cursor-pointer items-center justify-between gap-4 py-5 text-[17px] font-semibold" style={{ listStyle: 'none' }}>
                    {f.q}
                    <span aria-hidden className="text-[22px] leading-none transition-transform group-open:rotate-45" style={{ color: MUTED }}>+</span>
                  </summary>
                  <p className="pb-6 pr-8 text-[16px] leading-relaxed" style={{ color: BODY }}>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* FREE TOOLS */}
        <section aria-labelledby="tools-h" className="mx-auto max-w-[1160px] px-5 sm:px-8 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div><h2 id="tools-h" className="text-[22px] font-semibold">Herramientas gratuitas</h2><p className="mt-1 text-[15px]" style={{ color: MUTED }}>Generadores de código QR, sin registro.</p></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {QR_TOOLS.map(t => (
              <Link key={t.slug} href={`/herramientas/${t.slug}`} className="flex items-center gap-3 rounded-xl px-5 py-4 no-underline bg-white transition-colors hover:bg-[#FAFAF8]" style={{ border: `1px solid ${LINE}`, color: INK }}>
                <QrCode size={20} strokeWidth={1.75} aria-hidden /><span className="text-[15px] font-semibold">{t.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* CLOSING CTA */}
        <section id="empezar" aria-labelledby="cta-h" className="mx-auto max-w-[1160px] px-5 sm:px-8 pb-20 lg:pb-28">
          <Reveal>
            <div className="rounded-3xl px-6 py-16 sm:py-20 text-center" style={{ background: INK, color: '#fff' }}>
              <h2 id="cta-h" className="font-bold mx-auto max-w-[640px]" style={{ fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.1, letterSpacing: '-0.03em' }}>Crea tu página profesional hoy</h2>
              <p className="mt-4 mx-auto max-w-[480px] text-[17px]" style={{ color: 'rgba(255,255,255,.75)' }}>Gratis para empezar, sin tarjeta. Cuando tu negocio crezca, pasas a Pro.</p>
              <Link href="/auth" className="mt-8 inline-flex items-center gap-2 rounded-full px-8 text-[16px] font-semibold text-white no-underline hover:brightness-95" style={{ background: ACCENT, height: 52 }}>Crear mi página gratis <ArrowRight size={17} aria-hidden /></Link>
            </div>
          </Reveal>
        </section>
      </main>

      <StickyCta />

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${LINE}`, background: '#fff' }}>
        <div className="mx-auto max-w-[1160px] px-5 sm:px-8 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 text-[14px]">
          <div>
            <p className="text-[19px] font-bold">Link<span style={{ color: ACCENT }}>Hub</span></p>
            <p className="mt-3 max-w-[240px] leading-relaxed" style={{ color: MUTED }}>Presencia profesional para autónomos y pequeños negocios.</p>
          </div>
          <FooterCol title="Producto" links={[['Funciones', '#funciones'], ['Precios', '#precios'], ['Preguntas frecuentes', '#faq'], ['Iniciar sesión', '/auth']]} />
          <FooterCol title="Para tu rubro" links={VERTICALS.map(v => [v.label, `/para/${v.slug}`] as [string, string])} />
          <FooterCol title="Contacto" links={[['hola@linkhub.app', 'mailto:hola@linkhub.app'], ['Herramientas QR', '/herramientas']]} />
        </div>
        <p className="mx-auto max-w-[1160px] px-5 sm:px-8 pb-10 text-[13px] flex flex-wrap gap-x-5 gap-y-2" style={{ color: MUTED }}>
          <span>© {new Date().getFullYear()} LinkHub</span>
          <a href="/legal/privacidad" className="underline">Privacidad</a>
          <a href="/legal/terminos" className="underline">Términos</a>
          <a href="/legal/cookies" className="underline">Cookies</a>
        </p>
      </footer>
    </div>
  )
}

function SectionHead({ id, eyebrow, title, lead }: { id: string; eyebrow: string; title: string; lead?: string }) {
  return (
    <div className="max-w-[720px]">
      <p className="text-[13px] font-semibold uppercase tracking-[0.12em]" style={{ color: MUTED }}>{eyebrow}</p>
      <h2 id={id} className="mt-3 font-bold" style={{ fontSize: 'clamp(28px, 3.6vw, 40px)', lineHeight: 1.12, letterSpacing: '-0.03em' }}>{title}</h2>
      {lead && <p className="mt-4 text-[18px] leading-relaxed" style={{ color: BODY }}>{lead}</p>}
    </div>
  )
}

function Feature({ icon: Icon, title, text, points, note, flip, children }: { icon: typeof ShoppingBag; title: string; text: string; points: string[]; note?: string; flip?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid gap-10 lg:gap-16 lg:grid-cols-2 items-center">
      <Reveal className={flip ? 'lg:order-2' : ''}>
        <div className="max-w-[500px]">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: PAPER, border: `1px solid ${LINE}` }}><Icon size={22} strokeWidth={1.75} aria-hidden /></span>
          <h3 className="mt-5 font-bold" style={{ fontSize: 'clamp(24px, 2.6vw, 30px)', lineHeight: 1.15, letterSpacing: '-0.025em' }}>{title}</h3>
          <p className="mt-4 text-[17px] leading-relaxed" style={{ color: BODY }}>{text}</p>
          <ul className="mt-6 space-y-3" style={{ listStyle: 'none', padding: 0 }}>
            {points.map(p => <li key={p} className="flex gap-3 text-[16px]" style={{ color: BODY }}><Check size={18} aria-hidden className="flex-shrink-0 mt-0.5" style={{ color: '#15803D' }} />{p}</li>)}
          </ul>
          {note && <p className="mt-4 text-[14px]" style={{ color: MUTED }}>{note}</p>}
        </div>
      </Reveal>
      <Reveal delay={90} className={flip ? 'lg:order-1' : ''}>{children}</Reveal>
    </div>
  )
}

function Shot({ src, w, h, alt }: { src: string; w: number; h: number; alt: string }) {
  return (
    <div className="overflow-hidden rounded-2xl" style={{ border: `1px solid ${LINE}`, boxShadow: '0 1px 2px rgba(17,19,20,.04), 0 24px 60px -24px rgba(17,19,20,.28)', background: '#fff' }}>
      <Image src={src} width={w} height={h} alt={alt} sizes="(min-width: 1024px) 560px, 92vw" style={{ width: '100%', height: 'auto', display: 'block' }} />
    </div>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="font-semibold">{title}</p>
      <ul className="mt-4 space-y-2.5" style={{ listStyle: 'none', padding: 0 }}>
        {links.map(([label, href]) => <li key={label}><Link href={href} className="no-underline hover:underline" style={{ color: MUTED }}>{label}</Link></li>)}
      </ul>
    </div>
  )
}
