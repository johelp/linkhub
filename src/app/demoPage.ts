import type { Page } from '@/types'

const R = '#E8150A'

const emptyTranslations = { en: { title: '', description: '' }, pt: { title: '', description: '' }, fr: { title: '', description: '' }, de: { title: '', description: '' }, it: { title: '', description: '' } }

// Sample page rendered inside the hero phone mockup and the homepage's live
// preview widget — it's the real PageView component with example data, not
// a screenshot, so it never goes stale.
//
// `businessName` personalizes the featured block's title. When it's set,
// `generic` should be true too so the rest of the copy isn't ski-specific —
// used by the live-preview widget where visitors type in their own business
// (a hair salon, a restaurant...), not just seasonal-sports shops.
export function buildDemoPage(businessName?: string, generic = false): Page {
  const name = businessName?.trim() || 'Sierra Nevada Ski'
  return {
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
          icon: generic ? '👋' : '⛷️', colorScheme: 'blue',
          badge: { es: 'Temporada 25/26', en: '', pt: '', fr: '', de: '', it: '' },
          translations: {
            es: {
              title: `Bienvenido a ${name}`,
              description: generic ? 'Reservá tu turno o consultá disponibilidad' : 'Reservá tu clase — grupos e individuales, todos los niveles',
            },
            ...emptyTranslations,
          },
          url: '#',
        },
      },
      {
        id: '2', type: 'link', order: 1, visible: true, seasonFilter: 'always',
        data: {
          icon: generic ? '🛠️' : '🎿', iconBg: 'blue', openInNewTab: false, url: '#',
          translations: {
            es: generic
              ? { title: 'Nuestros servicios', description: 'Todo lo que ofrecemos' }
              : { title: 'Alquiler de equipo', description: 'Esquís, botas y bastones' },
            ...emptyTranslations,
          },
        },
      },
      {
        id: '3', type: 'link', order: 2, visible: true, seasonFilter: 'always',
        data: {
          icon: generic ? '💳' : '🎫', iconBg: 'green', openInNewTab: false, url: '#',
          translations: {
            es: generic
              ? { title: 'Precios y promociones', description: 'Tarifas actualizadas' }
              : { title: 'Forfaits y precios', description: 'Día, medio día y temporada' },
            ...emptyTranslations,
          },
        },
      },
      {
        id: '4', type: 'contact_card', order: 3, visible: true, seasonFilter: 'always',
        data: { whatsapp: '34600000000' },
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
}

// A second and third example, shown alongside the ski shop in the hero's
// rotating showcase, so the mockup doesn't look like a one-trick pony built
// for a single niche. These are fictional examples, not real customers —
// LinkHub is pre-launch and has none yet. Swap these out for real,
// permissioned customer pages once they exist; don't dress up fictional
// ones as if they were real.
function buildSalonExample(): Page {
  return {
    id: 'demo-salon', user_id: 'demo', slug: 'bella-estetica',
    name: 'Demo', published: true, qr_url: null, custom_domain: null, views: 0,
    created_at: '', updated_at: '',
    settings: {
      defaultLang: 'es', enabledLangs: ['es'], seasonMode: 'always',
      primaryColor: '#DB2777', backgroundColor: '#FFFFFF', fontFamily: 'DM Sans', showPoweredBy: false,
      seo: { title: '', description: '', ogImage: null },
    },
    blocks: [
      {
        id: '1', type: 'featured', order: 0, visible: true, seasonFilter: 'always',
        data: {
          icon: '💇', colorScheme: 'dark',
          badge: { es: '', en: '', pt: '', fr: '', de: '', it: '' },
          translations: {
            es: { title: 'Bella Estética', description: 'Reservá tu turno online' },
            ...emptyTranslations,
          },
          url: '#',
        },
      },
      {
        id: '2', type: 'business_hours', order: 1, visible: true, seasonFilter: 'always',
        data: {
          translations: { es: { title: 'Horario' }, en: { title: '' }, pt: { title: '' }, fr: { title: '' }, de: { title: '' }, it: { title: '' } },
          timezone: 'America/Argentina/Buenos_Aires',
          schedule: [
            { day: 0, closed: true, open: '09:00', close: '18:00' },
            { day: 1, closed: false, open: '09:00', close: '19:00' },
            { day: 2, closed: false, open: '09:00', close: '19:00' },
            { day: 3, closed: false, open: '09:00', close: '19:00' },
            { day: 4, closed: false, open: '09:00', close: '19:00' },
            { day: 5, closed: false, open: '09:00', close: '20:00' },
            { day: 6, closed: false, open: '09:00', close: '14:00' },
          ],
        },
      },
      {
        id: '3', type: 'contact_card', order: 2, visible: true, seasonFilter: 'always',
        data: { whatsapp: '5491100000000', whatsappMessage: 'Hola! Quería reservar un turno', address: 'Av. Siempre Viva 742' },
      },
      {
        id: '4', type: 'social_grid', order: 3, visible: true, seasonFilter: 'always',
        data: { items: [{ id: 's1', platform: 'instagram', url: '#', label: 'Instagram' }] },
      },
    ],
  }
}

function buildEventExample(): Page {
  return {
    id: 'demo-event', user_id: 'demo', slug: 'fest-verano',
    name: 'Demo', published: true, qr_url: null, custom_domain: null, views: 0,
    created_at: '', updated_at: '',
    settings: {
      defaultLang: 'es', enabledLangs: ['es'], seasonMode: 'always',
      primaryColor: '#7C3AED', backgroundColor: '#FFFFFF', fontFamily: 'DM Sans', showPoweredBy: false,
      seo: { title: '', description: '', ogImage: null },
    },
    blocks: [
      {
        id: '1', type: 'featured', order: 0, visible: true, seasonFilter: 'always',
        data: {
          icon: '🎉', colorScheme: 'purple',
          badge: { es: '15 de febrero', en: '', pt: '', fr: '', de: '', it: '' },
          translations: {
            es: { title: 'Fest de Verano', description: 'Música en vivo, food trucks y más' },
            ...emptyTranslations,
          },
          url: '#',
        },
      },
      {
        id: '2', type: 'event_tickets', order: 1, visible: true, seasonFilter: 'always',
        data: {
          translations: { es: { title: 'Entradas', description: '' }, en: { title: '', description: '' }, pt: { title: '', description: '' }, fr: { title: '', description: '' }, de: { title: '', description: '' }, it: { title: '', description: '' } },
          tiers: [
            { id: 't1', name: 'General', price: 8000 },
            { id: 't2', name: 'VIP', price: 18000 },
          ],
          currency: 'ARS',
        },
      },
      {
        id: '3', type: 'social_grid', order: 2, visible: true, seasonFilter: 'always',
        data: { items: [{ id: 's1', platform: 'instagram', url: '#', label: 'Instagram' }, { id: 's2', platform: 'tiktok', url: '#', label: 'TikTok' }] },
      },
    ],
  }
}

export const HERO_EXAMPLES: { label: string; page: Page }[] = [
  { label: 'Esquí', page: buildDemoPage() },
  { label: 'Estética', page: buildSalonExample() },
  { label: 'Evento', page: buildEventExample() },
]
