import type { Block, Lang } from '@/types'
import { blockRequiresPro } from '@/types'
import { generateId } from '@/lib/utils'

const LANGS: Lang[] = ['es', 'en', 'pt', 'fr', 'de', 'it']

// Fills `es` with the given fields, leaves every other language blank --
// same convention as demoPage.ts / BLOCK_REGISTRY's business_hours & co.
function esOnly<T extends Record<string, string>>(es: T): Record<Lang, T> {
  const blank = Object.fromEntries(Object.keys(es).map(k => [k, ''])) as T
  return Object.fromEntries(LANGS.map(l => [l, l === 'es' ? es : blank])) as Record<Lang, T>
}

function esOnlyStr(es: string): Record<Lang, string> {
  return Object.fromEntries(LANGS.map(l => [l, l === 'es' ? es : ''])) as Record<Lang, string>
}

export interface PageTemplate {
  id: string
  label: string
  description: string
  icon: string
  buildBlocks: (name: string) => Block[]
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'pricing',
    label: 'Catálogo de precios',
    description: 'Lista de servicios o productos con precio, lista para editar',
    icon: '💲',
    buildBlocks: () => [
      {
        id: generateId(), type: 'section_label', order: 0, visible: true, seasonFilter: 'always',
        data: { translations: esOnly({ text: 'Nuestros precios' }), seasonFilter: 'always' },
      },
      {
        id: generateId(), type: 'link', order: 1, visible: true, seasonFilter: 'always',
        data: {
          icon: '1️⃣', iconBg: 'red', openInNewTab: false, url: '#',
          translations: esOnly({ title: 'Servicio 1', description: 'Desde $ 0' }),
        },
      },
      {
        id: generateId(), type: 'link', order: 2, visible: true, seasonFilter: 'always',
        data: {
          icon: '2️⃣', iconBg: 'blue', openInNewTab: false, url: '#',
          translations: esOnly({ title: 'Servicio 2', description: 'Desde $ 0' }),
        },
      },
      {
        id: generateId(), type: 'link', order: 3, visible: true, seasonFilter: 'always',
        data: {
          icon: '3️⃣', iconBg: 'green', openInNewTab: false, url: '#',
          translations: esOnly({ title: 'Servicio 3', description: 'Desde $ 0' }),
        },
      },
      {
        id: generateId(), type: 'divider', order: 4, visible: true, seasonFilter: 'always',
        data: { style: 'line', spacing: 'md' },
      },
    ],
  },
  {
    id: 'contact',
    label: 'Ficha de contacto',
    description: 'Presentación, horario, carta/menú, contacto y redes',
    icon: '📇',
    buildBlocks: (name) => [
      {
        id: generateId(), type: 'featured', order: 0, visible: true, seasonFilter: 'always',
        data: {
          icon: '📇', colorScheme: 'dark', badge: esOnlyStr(''),
          translations: esOnly({ title: name || 'Tu Negocio', description: 'Estamos para ayudarte' }),
          url: '#',
        },
      },
      {
        id: generateId(), type: 'business_hours', order: 1, visible: true, seasonFilter: 'always',
        data: {
          translations: esOnly({ title: 'Horario de atención' }),
          timezone: 'America/Argentina/Buenos_Aires',
          schedule: [
            { day: 0, closed: true, open: '09:00', close: '18:00' },
            { day: 1, closed: false, open: '09:00', close: '18:00' },
            { day: 2, closed: false, open: '09:00', close: '18:00' },
            { day: 3, closed: false, open: '09:00', close: '18:00' },
            { day: 4, closed: false, open: '09:00', close: '18:00' },
            { day: 5, closed: false, open: '09:00', close: '18:00' },
            { day: 6, closed: false, open: '10:00', close: '14:00' },
          ],
        },
      },
      {
        id: generateId(), type: 'menu_pdf', order: 2, visible: true, seasonFilter: 'always',
        data: { translations: esOnly({ title: 'Nuestra carta', description: 'Ver menú completo' }), url: '' },
      },
      {
        id: generateId(), type: 'contact_card', order: 3, visible: true, seasonFilter: 'always',
        data: { phone: '', email: '', address: '', mapUrl: '', whatsapp: '', whatsappMessage: 'Hola! Quería hacerte una consulta' },
      },
      {
        id: generateId(), type: 'social_grid', order: 4, visible: true, seasonFilter: 'always',
        data: {
          items: [
            { id: generateId(), platform: 'instagram', url: 'https://instagram.com/', label: 'Instagram' },
            { id: generateId(), platform: 'facebook', url: 'https://facebook.com/', label: 'Facebook' },
          ],
        },
      },
    ],
  },
  {
    id: 'media_kit',
    label: 'Media kit',
    description: 'Presentación, bio, stats, contacto y redes para marcas',
    icon: '👤',
    buildBlocks: (name) => [
      {
        id: generateId(), type: 'featured', order: 0, visible: true, seasonFilter: 'always',
        data: {
          icon: '👤', colorScheme: 'purple', badge: esOnlyStr(''),
          translations: esOnly({ title: name || 'Tu Nombre', description: 'Creador/a de contenido' }),
          url: '#',
        },
      },
      {
        id: generateId(), type: 'text', order: 1, visible: true, seasonFilter: 'always',
        data: { translations: esOnly({ content: 'Contá quién sos y qué tipo de contenido creás.' }), align: 'left', size: 'md' },
      },
      {
        id: generateId(), type: 'text', order: 2, visible: true, seasonFilter: 'always',
        data: { translations: esOnly({ content: '📊 0 seguidores · 0% engagement · 0 vistas/mes' }), align: 'center', size: 'sm' },
      },
      {
        id: generateId(), type: 'social_grid', order: 3, visible: true, seasonFilter: 'always',
        data: {
          items: [
            { id: generateId(), platform: 'instagram', url: 'https://instagram.com/', label: 'Instagram' },
            { id: generateId(), platform: 'tiktok', url: 'https://tiktok.com/', label: 'TikTok' },
            { id: generateId(), platform: 'youtube', url: 'https://youtube.com/', label: 'YouTube' },
          ],
        },
      },
      {
        id: generateId(), type: 'contact_card', order: 4, visible: true, seasonFilter: 'always',
        data: { phone: '', email: '', address: '', mapUrl: '', whatsapp: '' },
      },
    ],
  },
]

export function templateRequiresPro(template: PageTemplate): boolean {
  return template.buildBlocks('').some(b => blockRequiresPro(b.type))
}
