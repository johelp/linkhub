import { VERTICALS } from '@/lib/verticals'
import { REGIONS, formatPrice } from '@/lib/pricing'
import { NICHES } from '@/lib/examples'

// llms.txt for LinkHub itself: what the product is, in a form AI assistants can quote.
export const revalidate = 3600

export function GET() {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://linkhub.app').replace(/\/$/, '')
  const body = `# LinkHub

> Tu presencia profesional sin necesidad de una web. LinkHub reúne en una sola página los servicios, la agenda, los pedidos y los cobros de autónomos y pequeños negocios en España y Latinoamérica, y se comparte desde Instagram, WhatsApp o un código QR.

## Qué ofrece
- Editor visual con vista previa en vivo (móvil y ordenador).
- Solicitud de citas con horarios libres y pedidos con carrito, enviados por WhatsApp.
- Cobros online con Mercado Pago, Stripe y Redsys (el dinero va directo al negocio).
- Visibilidad en Google y asistentes de IA: datos estructurados (schema.org) según el tipo de negocio, llms.txt por página, base de conocimiento y preguntas frecuentes.
- Tarjeta de contacto (vCard), mapa de Google, QR, analíticas, varios idiomas.
- Conector MCP para asistentes de IA y API para integraciones propias.

## Para quién
${VERTICALS.map(v => `- [${v.label}](${base}/para/${v.slug}): ${v.intro}`).join('\n')}

## Ejemplos por nicho
${NICHES.map(n => `- [${n.label}](${base}/ejemplos/${n.slug})`).join('\n')}

## Precios (plan Pro, por mes)
${REGIONS.map(r => `- ${r.label}: ${formatPrice(r.pro, r.currency, r.locale)}`).join('\n')}
Hay un plan Free sin coste.

## Enlaces
- [Inicio](${base}/)
- [Ejemplos](${base}/ejemplos)
- [Herramientas gratuitas de QR](${base}/herramientas)
`
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600' } })
}
