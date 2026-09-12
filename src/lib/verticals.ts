// Config for the /para/[slug] landing pages -- one per business vertical,
// each backed by a real demo page (the actual PageView component rendering
// real example data for that kind of business, not a screenshot or generic
// mockup) plus vertical-specific copy naming the blocks that actually matter
// for that business. That's the real per-page differentiator programmatic
// SEO needs to not read as spam: swap the vertical and the demo, the copy,
// and the highlighted blocks all change together.
import type { Page } from '@/types'
import { buildDemoPage, buildSalonExample, buildEventExample, buildCafeExample, buildRestaurantExample } from '@/app/demoPage'

export interface VerticalConfig {
  slug: string
  label: string           // short name, used in nav/cards
  title: string            // page H1
  metaTitle: string
  metaDescription: string
  intro: string
  highlights: string[]     // 3-4 reasons specific to this vertical, tied to real blocks
  accent: string
  demoPage: () => Page
}

export const VERTICALS: VerticalConfig[] = [
  {
    slug: 'peluquerias-y-salones',
    label: 'Peluquerías y salones',
    title: 'Página de enlaces para peluquerías y salones de belleza',
    metaTitle: 'Página de enlaces para peluquerías y salones de belleza — LinkHub',
    metaDescription: 'Armá la página de enlaces de tu peluquería o salón: horario que se actualiza solo, WhatsApp con mensaje predefinido para reservar, y tus redes, todo en un link.',
    intro: 'Para que quien te busca en Instagram sepa en dos segundos si estás abierto y pueda reservar por WhatsApp sin escribir de cero.',
    highlights: [
      'Horario de atención que muestra "abierto ahora" o "cerrado" solo, sin que lo actualices vos',
      'Botón de WhatsApp con un mensaje predefinido ("Hola, quería reservar un turno") para que reservar sea un toque',
      'Ficha de contacto con dirección y mapa, para quien todavía no te conoce',
      'Redes sociales agrupadas, sin mandar a nadie a buscar tu Instagram a mano',
    ],
    accent: '#DB2777',
    demoPage: buildSalonExample,
  },
  {
    slug: 'bares-y-cafeterias',
    label: 'Bares y cafeterías',
    title: 'Página de enlaces para bares y cafeterías',
    metaTitle: 'Página de enlaces para bares y cafeterías — LinkHub',
    metaDescription: 'La página de enlaces de tu bar o cafetería: tarjeta de sellos para que vuelvan, cobros por Mercado Pago y tus redes, en un solo link para pegar en la mesa.',
    intro: 'Pensada para lo que hace volver a un cliente de bar: que le convenga volver, no solo que te encuentre una vez.',
    highlights: [
      'Tarjeta de sellos digital: suma un sello por visita y ofrece un premio, sin una app aparte',
      'Cobrar por Mercado Pago, directo a tu propia cuenta, sin que LinkHub toque la plata',
      'QR para la mesa o la vidriera, listo para imprimir',
      'Redes sociales y ubicación, para quien pasa por al lado y no te conoce todavía',
    ],
    accent: '#B45309',
    demoPage: buildCafeExample,
  },
  {
    slug: 'restaurantes',
    label: 'Restaurantes',
    title: 'Página de enlaces para restaurantes, con carta digital',
    metaTitle: 'Página de enlaces para restaurantes con carta digital — LinkHub',
    metaDescription: 'La carta de tu restaurante con categorías y precios (no un PDF perdido), horario, reservas por WhatsApp y ubicación — todo en un link.',
    intro: 'La diferencia con un link a un PDF: acá la carta se lee como carta, con categorías y precios, directo en la página.',
    highlights: [
      'Carta con categorías y precios reales, no un PDF que hay que descargar y abrir aparte',
      'Reservas por WhatsApp con mensaje predefinido',
      'Horario que se actualiza solo según el día y la hora',
      'Ubicación y mapa, para quien llega por primera vez',
    ],
    accent: '#B91C1C',
    demoPage: buildRestaurantExample,
  },
  {
    slug: 'eventos',
    label: 'Eventos y lanzamientos',
    title: 'Página de enlaces para eventos, con venta de entradas',
    metaTitle: 'Página de enlaces para eventos con venta de entradas — LinkHub',
    metaDescription: 'Vendé entradas a tu evento con distintos tipos de precio, entrega automática por QR, y toda la info del evento en un link para compartir por redes.',
    intro: 'Para un evento puntual: se arma en minutos, vende entradas de verdad, y no queda dando vueltas después.',
    highlights: [
      'Venta de entradas con 2-3 tipos de precio (general, VIP) y cobro por Mercado Pago',
      'Cada entrada llega con un QR numerado para validar en la puerta, sin lista en papel',
      'Página lista en minutos — no hace falta armar un sitio para un evento de un solo día',
      'Pensada para compartir por redes o imprimir el QR en un flyer',
    ],
    accent: '#7C3AED',
    demoPage: buildEventExample,
  },
  {
    slug: 'turismo-y-temporada',
    label: 'Turismo y negocios de temporada',
    title: 'Página de enlaces para negocios de turismo y temporada',
    metaTitle: 'Página de enlaces para negocios de turismo y temporada — LinkHub',
    metaDescription: 'Para alquileres de equipo, excursiones y negocios que cambian con la temporada: contenido que se adapta solo a invierno o verano, y multiidioma para turistas.',
    intro: 'Para negocios cuya oferta cambia según la época del año, y que reciben turistas que no hablan español.',
    highlights: [
      'Filtros de temporada: mostrá bloques distintos en invierno, verano o temporada baja, sin duplicar la página',
      'Multiidioma — cada bloque con su traducción, para turistas extranjeros',
      'QR para imprimir y pegar en el local o el equipo que alquilás',
      'Precios y promociones siempre actualizados, sin reimprimir cartelería',
    ],
    accent: '#185FA5',
    demoPage: () => buildDemoPage(),
  },
]

export function getVertical(slug: string): VerticalConfig | undefined {
  return VERTICALS.find(v => v.slug === slug)
}
