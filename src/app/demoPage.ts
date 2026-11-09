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
    name, published: true, qr_url: null, custom_domain: null, views: 0,
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
export function buildSalonExample(): Page {
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

export function buildEventExample(): Page {
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

export function buildCafeExample(): Page {
  return {
    id: 'demo-cafe', user_id: 'demo', slug: 'cafe-de-la-esquina',
    name: 'Demo', published: true, qr_url: null, custom_domain: null, views: 0,
    created_at: '', updated_at: '',
    settings: {
      defaultLang: 'es', enabledLangs: ['es'], seasonMode: 'always',
      primaryColor: '#B45309', backgroundColor: '#FFFFFF', fontFamily: 'DM Sans', showPoweredBy: false,
      seo: { title: '', description: '', ogImage: null },
    },
    blocks: [
      {
        id: '1', type: 'featured', order: 0, visible: true, seasonFilter: 'always',
        data: {
          icon: '☕', colorScheme: 'orange',
          badge: { es: '', en: '', pt: '', fr: '', de: '', it: '' },
          translations: {
            es: { title: 'Café de la Esquina', description: 'Especialidad, medialunas y algo más' },
            ...emptyTranslations,
          },
          url: '#',
        },
      },
      {
        id: '2', type: 'loyalty_card', order: 1, visible: true, seasonFilter: 'always',
        data: {
          translations: {
            es: { title: 'Tu tarjeta de sellos', description: 'Sumá un sello por cada café' },
            ...emptyTranslations,
          },
          stampIcon: '☕', targetStamps: 8,
          rewardDescription: { es: 'Un café gratis', en: '', pt: '', fr: '', de: '', it: '' },
        },
      },
      {
        id: '3', type: 'contact_card', order: 2, visible: true, seasonFilter: 'always',
        data: { whatsapp: '5491100000000', address: 'Corrientes 1234' },
      },
      {
        id: '4', type: 'social_grid', order: 3, visible: true, seasonFilter: 'always',
        data: { items: [{ id: 's1', platform: 'instagram', url: '#', label: 'Instagram' }] },
      },
    ],
  }
}

// Restaurant example -- built for the "restaurantes" vertical landing page
// (/para/restaurantes), to show off the `menu` block specifically (its own
// differentiator vs. the cafe example above, which leans on `loyalty_card`).
export function buildRestaurantExample(): Page {
  return {
    id: 'demo-restaurant', user_id: 'demo', slug: 'la-parrilla-del-barrio',
    name: 'Demo', published: true, qr_url: null, custom_domain: null, views: 0,
    created_at: '', updated_at: '',
    settings: {
      defaultLang: 'es', enabledLangs: ['es'], seasonMode: 'always',
      primaryColor: '#B91C1C', backgroundColor: '#FFFFFF', fontFamily: 'DM Sans', showPoweredBy: false,
      seo: { title: '', description: '', ogImage: null },
    },
    blocks: [
      {
        id: '1', type: 'featured', order: 0, visible: true, seasonFilter: 'always',
        data: {
          icon: '🥩', colorScheme: 'dark',
          badge: { es: '', en: '', pt: '', fr: '', de: '', it: '' },
          translations: {
            es: { title: 'La Parrilla del Barrio', description: 'Cocina de barrio, todos los días' },
            ...emptyTranslations,
          },
          url: '#',
        },
      },
      {
        id: '2', type: 'menu', order: 1, visible: true, seasonFilter: 'always',
        data: {
          translations: { es: { title: 'Nuestra carta', description: '' }, ...emptyTranslations },
          sections: [
            {
              id: 'sec1',
              translations: { es: { name: 'Entradas' }, en: { name: '' }, pt: { name: '' }, fr: { name: '' }, de: { name: '' }, it: { name: '' } },
              items: [
                { id: 'i1', translations: { es: { name: 'Empanadas (x3)' }, en: { name: '' }, pt: { name: '' }, fr: { name: '' }, de: { name: '' }, it: { name: '' } }, price: '$3.900' },
                { id: 'i2', translations: { es: { name: 'Provoleta' }, en: { name: '' }, pt: { name: '' }, fr: { name: '' }, de: { name: '' }, it: { name: '' } }, price: '$5.200' },
              ],
            },
            {
              id: 'sec2',
              translations: { es: { name: 'Principales' }, en: { name: '' }, pt: { name: '' }, fr: { name: '' }, de: { name: '' }, it: { name: '' } },
              items: [
                { id: 'i3', translations: { es: { name: 'Bife de chorizo' }, en: { name: '' }, pt: { name: '' }, fr: { name: '' }, de: { name: '' }, it: { name: '' } }, price: '$12.500' },
              ],
            },
          ],
        },
      },
      {
        id: '3', type: 'business_hours', order: 2, visible: true, seasonFilter: 'always',
        data: {
          translations: { es: { title: 'Horario' }, en: { title: '' }, pt: { title: '' }, fr: { title: '' }, de: { title: '' }, it: { title: '' } },
          timezone: 'America/Argentina/Buenos_Aires',
          schedule: [
            { day: 0, closed: false, open: '12:00', close: '00:00' },
            { day: 1, closed: true, open: '12:00', close: '00:00' },
            { day: 2, closed: false, open: '12:00', close: '00:00' },
            { day: 3, closed: false, open: '12:00', close: '00:00' },
            { day: 4, closed: false, open: '12:00', close: '00:00' },
            { day: 5, closed: false, open: '12:00', close: '01:00' },
            { day: 6, closed: false, open: '12:00', close: '01:00' },
          ],
        },
      },
      {
        id: '4', type: 'contact_card', order: 3, visible: true, seasonFilter: 'always',
        data: { whatsapp: '5491100000000', whatsappMessage: 'Hola! Quería hacer una reserva', address: 'Av. Corrientes 3400' },
      },
    ],
  }
}

// A freelance professional (the core customer): services booked by WhatsApp,
// opening hours and her networks. Spanish market defaults.
export function buildProfessionalExample(): Page {
  const L = <T extends Record<string, string>>(es: T) => ({ es, en: { ...es, ...Object.fromEntries(Object.keys(es).map(k => [k, ''])) }, pt: Object.fromEntries(Object.keys(es).map(k => [k, ''])), fr: Object.fromEntries(Object.keys(es).map(k => [k, ''])), de: Object.fromEntries(Object.keys(es).map(k => [k, ''])), it: Object.fromEntries(Object.keys(es).map(k => [k, ''])) }) as never
  return {
    id: 'demo-pro', user_id: 'demo', slug: 'laura-gomez',
    name: 'Laura Gómez', published: true, qr_url: null, custom_domain: null, views: 0,
    created_at: '', updated_at: '',
    settings: {
      defaultLang: 'es', enabledLangs: ['es'], seasonMode: 'always',
      primaryColor: '#0F766E', backgroundColor: '#F7F7F5', fontFamily: 'DM Sans', showPoweredBy: false,
      profile: { tagline: 'Psicóloga sanitaria · Consulta online y presencial en Madrid' },
      seo: { title: '', description: '', ogImage: null },
    },
    blocks: [
      {
        id: 'p1', type: 'appointment_request', order: 0, visible: true, seasonFilter: 'always',
        data: {
          translations: L({ title: 'Pide tu cita', description: 'Elige el servicio y un horario libre' }),
          whatsapp: '34600000000', timezone: 'Europe/Madrid', currency: 'EUR',
          services: [
            { id: 'sv1', translations: L({ name: 'Primera consulta', description: '' }), durationMin: 60, price: 60 },
            { id: 'sv2', translations: L({ name: 'Sesión de seguimiento', description: '' }), durationMin: 50, price: 55 },
          ],
          schedule: [0, 1, 2, 3, 4, 5, 6].map(d => ({ day: d, closed: d === 0 || d === 6, open: '10:00', close: '19:00' })),
          slotMinutes: 60, daysAhead: 14, minNoticeHours: 12,
        },
      },
      {
        id: 'p2', type: 'business_hours', order: 1, visible: true, seasonFilter: 'always',
        data: {
          translations: { es: { title: 'Horario de consulta' }, en: { title: '' }, pt: { title: '' }, fr: { title: '' }, de: { title: '' }, it: { title: '' } },
          timezone: 'Europe/Madrid',
          schedule: [0, 1, 2, 3, 4, 5, 6].map(d => ({ day: d, closed: d === 0 || d === 6, open: '10:00', close: '19:00' })),
        },
      },
      {
        id: 'p3', type: 'contact_card', order: 2, visible: true, seasonFilter: 'always',
        data: { whatsapp: '34600000000', whatsappMessage: 'Hola Laura, me gustaría pedir cita', address: 'Calle de Alcalá 120, Madrid' },
      },
      {
        id: 'p4', type: 'social_grid', order: 3, visible: true, seasonFilter: 'always',
        data: { items: [{ id: 's1', platform: 'instagram', url: '#', label: 'Instagram' }, { id: 's2', platform: 'linkedin', url: '#', label: 'LinkedIn' }] },
      },
    ],
  } as Page
}

export const HERO_EXAMPLES: { label: string; page: Page }[] = [
  { label: 'Profesional', page: buildProfessionalExample() },
  { label: 'Estética', page: buildSalonExample() },
  { label: 'Cafetería', page: buildCafeExample() },
  { label: 'Eventos', page: buildEventExample() },
]
