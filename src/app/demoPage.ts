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
}
