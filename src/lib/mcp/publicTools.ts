// Public tier: read-only tools anyone (an assistant, a chatbot) can call about a
// PUBLISHED, indexable, non-paused page. No credentials, no side effects: the
// "link" tools only build a prefilled WhatsApp URL for the human to open --
// nothing is stored or sent from the server.
import type { AppointmentRequestBlock, Lang, OrderMenuBlock, Page } from '../../types/index.ts'
import { buildStructuredData, defaultMeta, extractFacts, resolveSchemaType } from '../seo.ts'
import { buildAppointmentMessage, buildDays, localNow, validateAppointment } from '../appointments.ts'
import { MAX_QTY, buildOrderMessage, formatMoney, orderTotals, resolveCart, validateOrder, whatsappOrderUrl, type Fulfillment } from '../orders.ts'
import { searchEntries } from '../knowledge.ts'
import { plain, untrusted } from './results.ts'
import { DATE_PATTERN, ID_PATTERN, TIME_PATTERN, slugSchema, str, type Schema } from './validate.ts'
import { ToolError, type ToolContext, type ToolDef } from './types.ts'

const LANGS = ['es', 'en', 'pt', 'fr', 'de', 'it'] as const
const langSchema: Schema = { type: 'string', description: 'Idioma del contenido (por defecto el de la página).', enum: LANGS }
const PHONE_PATTERN = '^[+0-9 ()\\-]{5,30}$'

async function loadPage(slug: unknown, ctx: ToolContext): Promise<Page> {
  const page = await ctx.deps.publicStore.getPublicPage(String(slug))
  // Same answer for "doesn't exist", "unpublished", "noindex" and "paused": nothing to learn.
  if (!page) throw new ToolError('Página no encontrada o no disponible para asistentes.')
  return page
}

const pickLang = (page: Page, lang: unknown): Lang => (typeof lang === 'string' ? lang : page.settings.defaultLang) as Lang
const nameOf = (t: Record<string, { name?: string; description?: string } | undefined> | undefined, lang: Lang, fallback: string) =>
  t?.[lang]?.name?.trim() || t?.es?.name?.trim() || fallback
const descOf = (t: Record<string, { name?: string; description?: string } | undefined> | undefined, lang: Lang) =>
  t?.[lang]?.description?.trim() || t?.es?.description?.trim() || undefined

const visible = <T extends { visible: boolean; type: string }>(page: Page, type: string) =>
  (page.blocks as unknown as T[]).filter(b => b.visible && b.type === type)

const NOTHING_SENT = 'No se ha enviado ni guardado nada: enseña el enlace a la persona para que ella lo abra y pulse enviar en WhatsApp.'

function offersOf(page: Page, lang: Lang) {
  const services = visible<AppointmentRequestBlock>(page, 'appointment_request').flatMap(b => b.data.services.map(s => ({
    id: s.id, name: nameOf(s.translations, lang, 'Servicio'), description: descOf(s.translations, lang), duration_min: s.durationMin,
    price: s.price || undefined, currency: b.data.currency,
  })))
  const orderBlocks = visible<OrderMenuBlock>(page, 'order_menu')
  const items = orderBlocks.flatMap(b => b.data.categories.flatMap(c => c.items.map(i => ({
    id: i.id, category: nameOf(c.translations, lang, 'Carta'), name: nameOf(i.translations, lang, 'Producto'), description: descOf(i.translations, lang),
    price: i.price, currency: b.data.currency, available: i.available,
  }))))
  const ordering = orderBlocks[0] && { delivery: orderBlocks[0].data.delivery, pickup: orderBlocks[0].data.pickup, delivery_fee: orderBlocks[0].data.deliveryFee, min_order: orderBlocks[0].data.minOrder, currency: orderBlocks[0].data.currency }
  return { services, items, ordering }
}

export const publicTools: ToolDef[] = [
  {
    name: 'get_business', title: 'Datos del negocio', scope: null, readOnly: true,
    description: 'Ficha del negocio: nombre, descripción, contacto, horario, servicios/productos, perfiles sociales y tipo schema.org. Usa el slug de la URL linkhub /p/{slug}.',
    inputSchema: { type: 'object', required: ['slug'], properties: { slug: slugSchema, lang: langSchema } },
    async run(a, ctx) {
      const page = await loadPage(a.slug, ctx)
      const lang = pickLang(page, a.lang)
      const facts = extractFacts(page, lang)
      const knowledge = await ctx.deps.publicStore.getPublicKnowledge(page)
      const base = ctx.deps.baseUrl
      return untrusted({
        slug: page.slug, url: `${base}/p/${page.slug}`, language: lang, languages: page.settings.enabledLangs,
        schema_type: resolveSchemaType(page), meta: defaultMeta(page, facts), facts,
        capabilities: { booking: facts.hasBooking, ordering: offersOf(page, lang).items.length > 0, knowledge_entries: knowledge.length },
        links: { llms_txt: `${base}/p/${page.slug}/llms.txt`, facts_json: `${base}/p/${page.slug}/facts.json`, vcard: `${base}/p/${page.slug}/contact.vcf` },
        structured_data: buildStructuredData(page, base, facts),
      }, 'Ficha del negocio.')
    },
  },
  {
    name: 'list_offers', title: 'Servicios y productos', scope: null, readOnly: true,
    description: 'Lista servicios reservables (con service_id y duración) y productos pedibles (con item_id y precio), más condiciones de envío/retiro. Los ids sirven para get_availability, create_booking_link y create_order_link.',
    inputSchema: { type: 'object', required: ['slug'], properties: { slug: slugSchema, lang: langSchema } },
    async run(a, ctx) {
      const page = await loadPage(a.slug, ctx)
      const lang = pickLang(page, a.lang)
      const { services, items, ordering } = offersOf(page, lang)
      return untrusted({ slug: page.slug, language: lang, bookable_services: services, orderable_items: items, ordering, all_offers: extractFacts(page, lang).offers },
        `${services.length} servicios reservables, ${items.length} productos.`)
    },
  },
  {
    name: 'search_knowledge', title: 'Buscar en la base de conocimiento', scope: null, readOnly: true,
    description: 'Busca preguntas frecuentes e información PÚBLICA del negocio (políticas, formas de pago, parking...). Solo devuelve entradas marcadas como públicas.',
    inputSchema: { type: 'object', required: ['slug', 'query'], properties: { slug: slugSchema, query: str('Pregunta o palabras clave.', { minLength: 3, maxLength: 200 }), limit: { type: 'integer', description: 'Máximo de resultados (1-10, por defecto 5).', minimum: 1, maximum: 10 } } },
    async run(a, ctx) {
      const page = await loadPage(a.slug, ctx)
      const entries = await ctx.deps.publicStore.getPublicKnowledge(page)
      // Defence in depth: even if a store returned private rows, they never leave here.
      const hits = searchEntries(entries.filter(e => e.visibility === 'public'), String(a.query), (a.limit as number | undefined) ?? 5)
      return untrusted({ slug: page.slug, query: a.query, results: hits.map(e => ({ kind: e.kind, title: e.title, content: e.content })) },
        hits.length ? `${hits.length} resultado(s).` : 'Sin resultados: no inventes la respuesta; sugiere contactar con el negocio (get_contact).')
    },
  },
  {
    name: 'get_availability', title: 'Disponibilidad para reservar', scope: null, readOnly: true,
    description: 'Horarios ofrecidos por el negocio para un servicio (según su calendario semanal, zona horaria del negocio y antelación mínima). Sin `date` devuelve los próximos 7 días con huecos. No comprueba reservas ya hechas: el negocio confirma por WhatsApp.',
    inputSchema: { type: 'object', required: ['slug', 'service_id'], properties: { slug: slugSchema, service_id: str('Id del servicio (de list_offers).', { pattern: ID_PATTERN }), date: { type: 'string', description: 'Día YYYY-MM-DD en la zona horaria del negocio.', pattern: DATE_PATTERN, format: 'date', maxLength: 10 }, lang: langSchema } },
    async run(a, ctx) {
      const page = await loadPage(a.slug, ctx)
      const lang = pickLang(page, a.lang)
      const hit = visible<AppointmentRequestBlock>(page, 'appointment_request').map(b => ({ b, s: b.data.services.find(s => s.id === a.service_id) })).find(x => x.s)
      if (!hit?.s) throw new ToolError('Servicio no encontrado: usa un service_id de list_offers.')
      const { b, s } = hit
      const days = buildDays(b.data, s.durationMin, localNow(b.data.timezone, ctx.now), lang)
      const chosen = a.date ? days.filter(d => d.key === a.date) : days.slice(0, 7)
      return plain({
        slug: page.slug, service_id: s.id, duration_min: s.durationMin, timezone: b.data.timezone,
        days: chosen.map(d => ({ date: d.key, slots: d.slots })),
        note: a.date && !chosen.length ? 'Sin huecos ese día (cerrado, pasado, fuera del plazo o sin antelación suficiente).' : 'Horarios según el calendario semanal del negocio; las citas existentes no se comprueban. La cita se confirma por WhatsApp.',
      }, chosen.length ? `${chosen.length} día(s) con huecos.` : 'No hay huecos.')
    },
  },
  {
    name: 'create_booking_link', title: 'Enlace de WhatsApp para pedir cita', scope: null, readOnly: true,
    description: 'Construye el mensaje y el enlace de WhatsApp para SOLICITAR una cita. No reserva nada ni envía nada: la persona abre el enlace y envía el mensaje; el negocio confirma. Pide siempre a la persona su nombre y confirma servicio, día y hora antes de llamar.',
    inputSchema: { type: 'object', required: ['slug', 'service_id', 'date', 'time', 'name'], properties: {
      slug: slugSchema, service_id: str('Id del servicio (de list_offers).', { pattern: ID_PATTERN }),
      date: { type: 'string', description: 'Día YYYY-MM-DD.', pattern: DATE_PATTERN, format: 'date', maxLength: 10 },
      time: { type: 'string', description: 'Hora HH:MM, una de las de get_availability.', pattern: TIME_PATTERN, maxLength: 5 },
      name: str('Nombre de la persona.', { minLength: 1, maxLength: 80 }),
      phone: str('Teléfono de contacto (opcional).', { pattern: PHONE_PATTERN, maxLength: 30 }),
      notes: str('Notas para el negocio (opcional).', { maxLength: 500 }), lang: langSchema } },
    async run(a, ctx) {
      const page = await loadPage(a.slug, ctx)
      const lang = pickLang(page, a.lang)
      const hit = visible<AppointmentRequestBlock>(page, 'appointment_request').find(b => b.data.services.some(s => s.id === a.service_id))
      if (!hit) throw new ToolError('Servicio no encontrado: usa un service_id de list_offers.')
      const svc = hit.data.services.find(s => s.id === a.service_id)!
      const req = { serviceId: String(a.service_id), dayKey: String(a.date), time: String(a.time), name: String(a.name), phone: String(a.phone ?? ''), notes: String(a.notes ?? '') }
      const v = validateAppointment(hit.data, req)
      if (!v.ok) throw new ToolError(v.error ?? 'Solicitud no válida')
      const day = buildDays(hit.data, svc.durationMin, localNow(hit.data.timezone, ctx.now), lang).find(d => d.key === req.dayKey)
      if (!day || !day.slots.includes(req.time)) throw new ToolError('Ese día u hora no está disponible: consulta get_availability y elige un hueco.')
      const message = buildAppointmentMessage({ data: hit.data, pageName: page.name, req, lang })
      return plain({ sent: false, whatsapp_url: whatsappOrderUrl(hit.data.whatsapp, message), message, service: { id: svc.id, name: nameOf(svc.translations, lang, 'Servicio'), duration_min: svc.durationMin }, date: req.dayKey, time: req.time, note: NOTHING_SENT },
        'Enlace de solicitud de cita listo.')
    },
  },
  {
    name: 'create_order_link', title: 'Enlace de WhatsApp para hacer un pedido', scope: null, readOnly: true,
    description: 'Construye el resumen del pedido y el enlace de WhatsApp para ENVIARLO al negocio. No cobra ni envía nada: la persona abre el enlace. Usa item_id de list_offers; confirma con la persona los productos, el total, el nombre y si es envío o retiro.',
    inputSchema: { type: 'object', required: ['slug', 'items', 'name', 'fulfillment'], properties: {
      slug: slugSchema,
      items: { type: 'array', description: 'Productos y cantidades.', minItems: 1, maxItems: 30, items: { type: 'object', required: ['item_id', 'qty'], properties: { item_id: str('Id del producto (de list_offers).', { pattern: ID_PATTERN }), qty: { type: 'integer', minimum: 1, maximum: MAX_QTY } } } },
      name: str('Nombre de la persona.', { minLength: 1, maxLength: 80 }),
      fulfillment: { type: 'string', description: 'delivery (envío a domicilio) o pickup (retiro en el local).', enum: ['delivery', 'pickup'] },
      address: str('Dirección de entrega (obligatoria si fulfillment=delivery).', { maxLength: 200 }),
      notes: str('Notas para el negocio (opcional).', { maxLength: 500 }), lang: langSchema } },
    async run(a, ctx) {
      const page = await loadPage(a.slug, ctx)
      const lang = pickLang(page, a.lang)
      const block = visible<OrderMenuBlock>(page, 'order_menu')[0]
      if (!block) throw new ToolError('Este negocio no tiene pedidos online.')
      const fulfillment = a.fulfillment as Fulfillment
      if (fulfillment === 'delivery' && !block.data.delivery) throw new ToolError('Este negocio no hace envíos a domicilio: usa fulfillment=pickup.')
      if (fulfillment === 'pickup' && !block.data.pickup) throw new ToolError('Este negocio no ofrece retiro en el local: usa fulfillment=delivery.')
      const cart = (a.items as { item_id: string; qty: number }[]).map(i => ({ itemId: i.item_id, qty: i.qty }))
      const resolved = resolveCart(block.data, cart, lang)
      if (resolved.lines.length !== cart.length) throw new ToolError('Algún item_id no existe o no está disponible: revisa list_offers.')
      const customer = { name: String(a.name), fulfillment, address: String(a.address ?? ''), notes: String(a.notes ?? '') }
      const v = validateOrder(block.data, cart, customer, lang)
      if (!v.ok) throw new ToolError(v.error ?? 'Pedido no válido')
      const message = buildOrderMessage({ data: block.data, pageName: page.name, cart, customer, lang })
      const { fee, total } = orderTotals(block.data, resolved.subtotal, fulfillment)
      const cur = block.data.currency
      return plain({
        sent: false, whatsapp_url: whatsappOrderUrl(block.data.whatsapp, message), message,
        lines: resolved.lines.map(l => ({ item_id: l.id, name: l.name, qty: l.qty, total: l.total })),
        subtotal: resolved.subtotal, delivery_fee: fee, total, currency: cur, total_formatted: formatMoney(total, cur), note: NOTHING_SENT,
      }, `Pedido de ${formatMoney(total, cur)} listo para enviar por WhatsApp.`)
    },
  },
  {
    name: 'get_contact', title: 'Contacto del negocio', scope: null, readOnly: true,
    description: 'Teléfono, WhatsApp, email, dirección, mapa, horario y perfiles del negocio, más la URL de su tarjeta de contacto vCard.',
    inputSchema: { type: 'object', required: ['slug'], properties: { slug: slugSchema } },
    async run(a, ctx) {
      const page = await loadPage(a.slug, ctx)
      const f = extractFacts(page)
      const base = ctx.deps.baseUrl
      const wa = f.whatsapp?.replace(/\D/g, '')
      return untrusted({
        slug: page.slug, name: page.name, phone: f.phone, email: f.email, address: f.address, map_url: f.mapUrl,
        whatsapp: wa ? { number: `+${wa}`, url: `https://wa.me/${wa}` } : undefined,
        opening_hours: f.hours, timezone: f.timezone, profiles: f.sameAs,
        vcard_url: `${base}/p/${page.slug}/contact.vcf`, page_url: `${base}/p/${page.slug}`,
      }, 'Contacto del negocio.')
    },
  },
]
