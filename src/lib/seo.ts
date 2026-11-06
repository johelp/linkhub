import type { Page, Block, Lang } from '@/types'
import { faqPairs, type KnowledgeEntry } from './knowledge.ts'

// SEO / GEO (generative-engine) / LLM representation of a customer page.
// Search engines read JSON-LD; AI assistants read clean text and structured
// facts. Everything here is derived from the page's own blocks (no invented
// data) and is pure, so it is unit-tested.

// Business types the owner can pick (schema.org names). Each group maps to
// type-specific markup in buildStructuredData().
export const SCHEMA_OPTIONS = [
  { value: 'ProfessionalService', label: 'Profesional / autónomo (servicios)', group: 'Servicios profesionales' },
  { value: 'LegalService', label: 'Abogado / asesoría legal', group: 'Servicios profesionales' },
  { value: 'AccountingService', label: 'Contable / gestoría', group: 'Servicios profesionales' },
  { value: 'MedicalBusiness', label: 'Salud: clínica, psicología, fisioterapia', group: 'Salud y bienestar' },
  { value: 'Dentist', label: 'Dentista', group: 'Salud y bienestar' },
  { value: 'Physician', label: 'Médico', group: 'Salud y bienestar' },
  { value: 'HealthAndBeautyBusiness', label: 'Bienestar y belleza (general)', group: 'Salud y bienestar' },
  { value: 'HairSalon', label: 'Peluquería', group: 'Belleza' },
  { value: 'BeautySalon', label: 'Centro de estética', group: 'Belleza' },
  { value: 'DaySpa', label: 'Spa', group: 'Belleza' },
  { value: 'Restaurant', label: 'Restaurante', group: 'Gastronomía' },
  { value: 'CafeOrCoffeeShop', label: 'Cafetería', group: 'Gastronomía' },
  { value: 'BarOrPub', label: 'Bar', group: 'Gastronomía' },
  { value: 'Bakery', label: 'Panadería / pastelería', group: 'Gastronomía' },
  { value: 'Store', label: 'Tienda', group: 'Comercio' },
  { value: 'ClothingStore', label: 'Tienda de ropa', group: 'Comercio' },
  { value: 'Florist', label: 'Floristería', group: 'Comercio' },
  { value: 'EducationalOrganization', label: 'Clases, academia o formación', group: 'Educación y deporte' },
  { value: 'SportsActivityLocation', label: 'Deporte y actividades', group: 'Educación y deporte' },
  { value: 'TravelAgency', label: 'Turismo y excursiones', group: 'Turismo' },
  { value: 'LodgingBusiness', label: 'Alojamiento', group: 'Turismo' },
  { value: 'Person', label: 'Persona / creador', group: 'Otros' },
  { value: 'LocalBusiness', label: 'Negocio local (otro)', group: 'Otros' },
] as const
export type SchemaType = typeof SCHEMA_OPTIONS[number]['value']
export const SCHEMA_TYPES = SCHEMA_OPTIONS.map(o => o.value) as SchemaType[]
export const isSchemaType = (v: unknown): v is SchemaType => typeof v === 'string' && (SCHEMA_TYPES as string[]).includes(v)

const FOOD_TYPES = new Set<string>(['Restaurant', 'CafeOrCoffeeShop', 'BarOrPub', 'Bakery'])
const EDU_TYPES = new Set<string>(['EducationalOrganization', 'SportsActivityLocation'])

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
const DAY_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MAX_OFFERS = 50

type T = Record<Lang, Record<string, string | undefined>> | undefined
function tr(t: T, lang: Lang, key: string): string {
  return (t?.[lang]?.[key] || t?.es?.[key] || '').trim()
}

export interface Facts {
  name: string
  tagline: string
  description: string
  phone?: string
  email?: string
  address?: string
  mapUrl?: string
  whatsapp?: string
  sameAs: string[]
  hours: { day: number; open: string; close: string }[]
  timezone?: string
  offers: { name: string; description?: string; price?: number; currency?: string; durationMin?: number; category?: string }[]
  faqs: { q: string; a: string }[]
  menu: { name: string; items: { name: string; description?: string; price?: number }[] }[]
  hasBooking: boolean
  currency?: string
}

// Flatten what the owner built into plain facts about the business.
export function extractFacts(page: Page, lang: Lang = page.settings.defaultLang, knowledge: KnowledgeEntry[] = []): Facts {
  const blocks = (page.blocks as Block[]).filter(b => b.visible)
  const f: Facts = { name: page.name, tagline: page.settings.profile?.tagline?.trim() ?? '', description: '', sameAs: [], hours: [], offers: [], menu: [], faqs: faqPairs(knowledge).slice(0, 50), hasBooking: false }
  for (const b of blocks) {
    switch (b.type) {
      case 'contact_card':
        f.phone ||= b.data.phone; f.email ||= b.data.email; f.address ||= b.data.address; f.mapUrl ||= b.data.mapUrl
        if (b.data.whatsapp) f.whatsapp ||= b.data.whatsapp
        break
      case 'social_grid':
        for (const i of b.data.items) if (/^https?:\/\//.test(i.url) && i.url.length > 12) f.sameAs.push(i.url)
        break
      case 'business_hours':
        f.timezone ||= b.data.timezone
        f.hours = f.hours.length ? f.hours : b.data.schedule.filter(d => !d.closed).map(d => ({ day: d.day, open: d.open, close: d.close }))
        break
      case 'appointment_request':
        f.hasBooking = true; f.currency ||= b.data.currency; f.timezone ||= b.data.timezone
        if (b.data.whatsapp) f.whatsapp ||= b.data.whatsapp
        for (const s of b.data.services) { const n = tr(s.translations as T, lang, 'name'); if (n) f.offers.push({ name: n, description: tr(s.translations as T, lang, 'description') || undefined, price: s.price || undefined, currency: b.data.currency, durationMin: s.durationMin, category: 'Servicios' }) }
        break
      case 'order_menu':
        f.currency ||= b.data.currency
        if (b.data.whatsapp) f.whatsapp ||= b.data.whatsapp
        for (const c of b.data.categories) {
          const section = { name: tr(c.translations as T, lang, 'name') || 'Carta', items: [] as { name: string; description?: string; price?: number }[] }
          for (const i of c.items) if (i.available) {
            const n = tr(i.translations as T, lang, 'name')
            if (!n) continue
            const item = { name: n, description: tr(i.translations as T, lang, 'description') || undefined, price: i.price || undefined }
            section.items.push(item)
            f.offers.push({ ...item, currency: b.data.currency, category: section.name })
          }
          if (section.items.length) f.menu.push(section)
        }
        break
      case 'payment_button': { const n = tr(b.data.translations as T, lang, 'title'); if (n) f.offers.push({ name: n, description: tr(b.data.translations as T, lang, 'description') || undefined, price: b.data.price, currency: b.data.currency }); break }
      case 'menu':
        for (const sec of b.data.sections) {
          const section = { name: tr(sec.translations as T, lang, 'name') || 'Carta', items: [] as { name: string; description?: string; price?: number }[] }
          for (const i of sec.items) {
            const n = tr(i.translations as T, lang, 'name')
            if (!n) continue
            const price = Number(String(i.price).replace(/[^\d.,]/g, '').replace(',', '.')) || undefined
            section.items.push({ name: n, description: tr(i.translations as T, lang, 'description') || undefined, price })
            f.offers.push({ name: n, description: tr(i.translations as T, lang, 'description') || undefined, price, category: section.name })
          }
          if (section.items.length) f.menu.push(section)
        }
        break
      case 'text': if (!f.description) f.description = tr(b.data.translations as T, lang, 'content').slice(0, 300); break
      case 'link': case 'featured': {
        const t = tr(b.data.translations as T, lang, 'title')
        if (!f.description && b.type === 'featured') f.description = [t, tr(b.data.translations as T, lang, 'description')].filter(Boolean).join('. ')
        break
      }
      default: break
    }
  }
  f.sameAs = [...new Set(f.sameAs)]
  f.offers = f.offers.slice(0, MAX_OFFERS)
  return f
}

/** Title/description used when the owner left the SEO fields empty. */
export function defaultMeta(page: Page, facts: Facts = extractFacts(page)): { title: string; description: string } {
  const s = page.settings.seo
  const title = s.title?.trim() || (facts.tagline ? `${page.name} — ${facts.tagline}` : page.name)
  const bits = [facts.tagline, facts.offers.length ? `Servicios: ${facts.offers.slice(0, 4).map(o => o.name).join(', ')}` : '', facts.address ? `en ${facts.address}` : '', facts.hasBooking ? 'Pide tu cita online.' : ''].filter(Boolean)
  const description = s.description?.trim() || (bits.join('. ').slice(0, 158) || `Información, contacto y reservas de ${page.name}.`)
  return { title: title.slice(0, 70), description }
}

/** Best guess of the business type from what the owner built (used when none was chosen). */
export function inferSchemaType(page: Page): SchemaType {
  const blocks = (page.blocks as Block[]).filter(b => b.visible)
  const has = (t: string) => blocks.some(b => b.type === t)
  if (has('menu')) return 'Restaurant'
  if (has('appointment_request')) return 'ProfessionalService'
  if (has('loyalty_card')) return 'CafeOrCoffeeShop'
  if (has('order_menu')) return 'LocalBusiness'
  return 'LocalBusiness'
}
export function resolveSchemaType(page: Page): SchemaType {
  return isSchemaType(page.settings.seo.schemaType) ? page.settings.seo.schemaType : inferSchemaType(page)
}

const iso = (c?: string) => (c && /^[A-Z]{3}$/.test(c) ? c : undefined)

// schema.org JSON-LD. Deliberately NO aggregateRating from the owner's typed
// review score: Google treats self-serving reviews as spam.
export function buildStructuredData(page: Page, baseUrl: string, facts: Facts = extractFacts(page)) {
  const url = `${baseUrl}/p/${page.slug}`
  const meta = defaultMeta(page, facts)
  const type = resolveSchemaType(page)
  const langs = (page.settings.enabledLangs?.length ? page.settings.enabledLangs : [page.settings.defaultLang])
  const priced = facts.offers.filter(o => o.price && iso(o.currency))
  const offerOf = (o: Facts['offers'][number], as: string) => ({
    '@type': 'Offer',
    itemOffered: { '@type': as, name: o.name, ...(o.description ? { description: o.description } : {}), ...(o.category ? { category: o.category } : {}) },
    ...(o.price && iso(o.currency) ? { price: o.price, priceCurrency: iso(o.currency) } : {}),
  })
  const common: Record<string, unknown> = {
    '@id': `${url}#business`, name: page.name, url, description: meta.description,
    ...(page.settings.profile?.avatarUrl ? { logo: page.settings.profile.avatarUrl } : {}),
    ...(page.settings.profile?.coverUrl || page.settings.seo.ogImage ? { image: page.settings.seo.ogImage || page.settings.profile?.coverUrl } : {}),
    ...(facts.phone || facts.whatsapp ? { telephone: facts.phone || `+${facts.whatsapp!.replace(/\D/g, '')}` } : {}),
    ...(facts.email ? { email: facts.email } : {}),
    ...(facts.sameAs.length ? { sameAs: facts.sameAs } : {}),
    knowsLanguage: langs,
  }

  let business: Record<string, unknown>
  if (type === 'Person') {
    // A person (freelancer, creator): no opening hours / postal business fields.
    business = { '@type': 'Person', ...common, ...(facts.tagline ? { jobTitle: facts.tagline } : {}),
      ...(facts.offers.length ? { makesOffer: facts.offers.map(o => offerOf(o, o.durationMin ? 'Service' : 'Product')) } : {}) }
  } else {
    business = {
      '@type': type, ...common,
      ...(facts.address ? { address: { '@type': 'PostalAddress', streetAddress: facts.address } } : {}),
      ...(facts.mapUrl && /^https?:\/\//.test(facts.mapUrl) ? { hasMap: facts.mapUrl } : {}),
      ...(facts.hours.length ? { openingHoursSpecification: facts.hours.map(h => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: DAY_NAMES[h.day], opens: h.open, closes: h.close })) } : {}),
      ...(priced.length > 1 ? { priceRange: `${Math.min(...priced.map(o => o.price!))}–${Math.max(...priced.map(o => o.price!))} ${iso(priced[0].currency)}` } : {}),
      ...(facts.hasBooking ? { potentialAction: { '@type': 'ReserveAction', target: { '@type': 'EntryPoint', urlTemplate: url, actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'] }, result: { '@type': 'Reservation', name: 'Cita' } } } : {}),
    }
    if (FOOD_TYPES.has(type)) {
      // Restaurants & cafés: a real Menu (sections -> items -> price) and reservations.
      if (facts.menu.length) business.hasMenu = {
        '@type': 'Menu', name: 'Carta', url,
        hasMenuSection: facts.menu.map(sec => ({ '@type': 'MenuSection', name: sec.name,
          hasMenuItem: sec.items.map(i => ({ '@type': 'MenuItem', name: i.name, ...(i.description ? { description: i.description } : {}),
            ...(i.price && iso(facts.currency) ? { offers: { '@type': 'Offer', price: i.price, priceCurrency: iso(facts.currency) } } : {}) })) })),
      }
      if (facts.hasBooking) business.acceptsReservations = true
    } else if (facts.offers.length) {
      const as = EDU_TYPES.has(type) ? 'Course' : (type === 'Store' || type === 'ClothingStore' || type === 'Florist') ? 'Product' : null
      business.hasOfferCatalog = {
        '@type': 'OfferCatalog', name: 'Servicios y productos',
        itemListElement: facts.offers.map(o => offerOf(o, as ?? (o.durationMin ? 'Service' : 'Product'))),
      }
    }
  }
  const faqPage = facts.faqs.length ? { '@type': 'FAQPage', '@id': `${url}#faq`, mainEntity: facts.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) } : null
  return {
    '@context': 'https://schema.org',
    '@graph': [
      business,
      ...(faqPage ? [faqPage] : []),
      { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: meta.title, description: meta.description, inLanguage: page.settings.defaultLang, about: { '@id': `${url}#business` }, isPartOf: { '@type': 'WebSite', name: 'LinkHub', url: baseUrl } },
    ],
  }
}

function money(n: number, c?: string) { return `${n}${c ? ` ${c}` : ''}` }

/** Clean Markdown for AI assistants: who, what, where, when, how much, how to contact. */
export function buildLlmsText(page: Page, baseUrl: string, facts: Facts = extractFacts(page)): string {
  const url = `${baseUrl}/p/${page.slug}`
  const meta = defaultMeta(page, facts)
  const L: string[] = [`# ${page.name}`, '']
  if (facts.tagline) L.push(`> ${facts.tagline}`, '')
  L.push(meta.description, '')
  const contact = [
    facts.address && `- Dirección: ${facts.address}`, facts.phone && `- Teléfono: ${facts.phone}`,
    facts.whatsapp && `- WhatsApp: https://wa.me/${facts.whatsapp.replace(/\D/g, '')}`, facts.email && `- Email: ${facts.email}`,
    facts.mapUrl && `- Mapa: ${facts.mapUrl}`,
  ].filter(Boolean) as string[]
  if (contact.length) L.push('## Contacto', ...contact, '')
  if (facts.hours.length) L.push('## Horario', ...facts.hours.map(h => `- ${DAY_ES[h.day]}: ${h.open}–${h.close}`), ...(facts.timezone ? [`(zona horaria ${facts.timezone})`] : []), '')
  if (facts.offers.length) {
    L.push('## Servicios y productos')
    let cat: string | undefined
    for (const o of facts.offers) {
      if (o.category && o.category !== cat) { L.push('', `### ${o.category}`); cat = o.category }
      L.push(`- ${o.name}${o.price ? ` — ${money(o.price, o.currency)}` : ''}${o.durationMin ? ` (${o.durationMin} min)` : ''}${o.description ? `: ${o.description}` : ''}`)
    }
    L.push('')
  }
  if (facts.faqs.length) { L.push('## Preguntas frecuentes', ''); for (const f of facts.faqs) L.push(`**${f.q}**`, f.a, ''); }
  if (facts.hasBooking) L.push('## Reservas', `Se puede solicitar cita online en ${url} (la confirmación llega por WhatsApp).`, '')
  if (facts.sameAs.length) L.push('## Perfiles', ...facts.sameAs.map(u => `- ${u}`), '')
  L.push('## Enlace', `- ${url}`)
  return L.join('\n').trim() + '\n'
}
