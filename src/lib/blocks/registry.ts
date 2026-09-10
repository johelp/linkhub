import type { Block, BlockType, Lang } from '@/types'
import { generateId } from '@/lib/utils'

export interface BlockDef {
  type: BlockType
  label: string
  description: string
  icon: string
  category: 'content' | 'navigation' | 'social' | 'layout'
  createDefault: () => Block
}

const defaultLangs = (text: string, desc = '') =>
  Object.fromEntries(
    (['es', 'en', 'pt'] as Lang[]).map(l => [l, { title: text, description: desc }])
  ) as Record<Lang, { title: string; description: string }>

export const BLOCK_REGISTRY: BlockDef[] = [
  {
    type: 'link',
    label: 'Enlace',
    description: 'Botón de enlace con icono, título y descripción',
    icon: '🔗',
    category: 'navigation',
    createDefault: () => ({
      id: generateId(),
      type: 'link',
      order: 0,
      visible: true,
      seasonFilter: 'always',
      data: {
        icon: '🔗',
        iconBg: 'red',
        translations: defaultLangs('Mi enlace', 'Descripción del enlace'),
        url: 'https://',
        openInNewTab: true,
      },
    }),
  },
  {
    type: 'featured',
    label: 'Destacado',
    description: 'Tarjeta hero con color de fondo llamativo',
    icon: '⭐',
    category: 'content',
    createDefault: () => ({
      id: generateId(),
      type: 'featured',
      order: 0,
      visible: true,
      seasonFilter: 'always',
      data: {
        icon: '☀️',
        badge: { es: 'Novedad', en: 'New', pt: 'Novidade' } as Record<Lang, string>,
        translations: {
          es: { title: 'Mi destacado', description: 'Descripción del elemento destacado' },
          en: { title: 'My featured', description: 'Featured item description' },
          pt: { title: 'Meu destaque', description: 'Descrição do item em destaque' },
        } as Record<Lang, { title: string; description: string }>,
        url: 'https://',
        colorScheme: 'orange',
      },
    }),
  },
  {
    type: 'expandable',
    label: 'Desplegable',
    description: 'Acordeón con sub-opciones y precios',
    icon: '📂',
    category: 'navigation',
    createDefault: () => ({
      id: generateId(),
      type: 'expandable',
      order: 0,
      visible: true,
      seasonFilter: 'always',
      data: {
        icon: '🎿',
        translations: {
          es: { title: 'Categoría', subtitle: 'Descripción breve' },
          en: { title: 'Category', subtitle: 'Brief description' },
          pt: { title: 'Categoria', subtitle: 'Breve descrição' },
        } as Record<Lang, { title: string; subtitle: string }>,
        children: [
          {
            id: generateId(),
            icon: '▸',
            translations: {
              es: { label: 'Opción 1', price: 'desde 50 €' },
              en: { label: 'Option 1', price: 'from €50' },
              pt: { label: 'Opção 1', price: 'desde 50 €' },
            } as Record<Lang, { label: string; price?: string }>,
            url: 'https://',
          },
        ],
      },
    }),
  },
  {
    type: 'section_label',
    label: 'Etiqueta de sección',
    description: 'Separador con texto en mayúsculas',
    icon: '🏷️',
    category: 'layout',
    createDefault: () => ({
      id: generateId(),
      type: 'section_label',
      order: 0,
      visible: true,
      seasonFilter: 'always',
      data: {
        translations: {
          es: { text: 'Sección' },
          en: { text: 'Section' },
          pt: { text: 'Secção' },
        } as Record<Lang, { text: string }>,
        seasonFilter: 'always' as const,
      },
    }),
  },
  {
    type: 'social_grid',
    label: 'Redes sociales',
    description: 'Grid de iconos de redes sociales',
    icon: '📱',
    category: 'social',
    createDefault: () => ({
      id: generateId(),
      type: 'social_grid',
      order: 0,
      visible: true,
      seasonFilter: 'always',
      data: {
        items: [
          { id: generateId(), platform: 'instagram' as const, url: 'https://instagram.com/', label: 'Instagram' },
          { id: generateId(), platform: 'facebook' as const, url: 'https://facebook.com/', label: 'Facebook' },
        ],
      },
    }),
  },
  {
    type: 'contact_card',
    label: 'Contacto',
    description: 'WhatsApp, email y dirección',
    icon: '📞',
    category: 'content',
    createDefault: () => ({
      id: generateId(),
      type: 'contact_card',
      order: 0,
      visible: true,
      seasonFilter: 'always',
      data: {
        phone: '',
        email: '',
        address: '',
        mapUrl: '',
        whatsapp: '',
      },
    }),
  },
  {
    type: 'divider',
    label: 'Divisor',
    description: 'Línea o espacio separador',
    icon: '➖',
    category: 'layout',
    createDefault: () => ({
      id: generateId(),
      type: 'divider',
      order: 0,
      visible: true,
      seasonFilter: 'always',
      data: { style: 'line' as const, spacing: 'md' as const },
    }),
  },
  {
    type: 'text',
    label: 'Texto',
    description: 'Párrafo de texto con soporte multiidioma',
    icon: '📝',
    category: 'content',
    createDefault: () => ({
      id: generateId(),
      type: 'text',
      order: 0,
      visible: true,
      seasonFilter: 'always',
      data: {
        translations: {
          es: { content: 'Escribe tu texto aquí...' },
          en: { content: 'Write your text here...' },
          pt: { content: 'Escreva seu texto aqui...' },
        } as Record<Lang, { content: string }>,
        align: 'left' as const,
        size: 'md' as const,
      },
    }),
  },
  {
    type: 'image_banner',
    label: 'Banner de imagen',
    description: 'Imagen con enlace opcional',
    icon: '🖼️',
    category: 'content',
    createDefault: () => ({
      id: generateId(),
      type: 'image_banner',
      order: 0,
      visible: true,
      seasonFilter: 'always',
      data: {
        imageUrl: '',
        altText: '',
        url: '',
        aspectRatio: '16:9' as const,
      },
    }),
  },
  {
    type: 'video_embed',
    label: 'Video',
    description: 'YouTube, Vimeo o un video propio',
    icon: '🎬',
    category: 'content',
    createDefault: () => ({
      id: generateId(),
      type: 'video_embed',
      order: 0,
      visible: true,
      seasonFilter: 'always',
      data: {
        url: '',
        caption: '',
        aspectRatio: '16:9' as const,
      },
    }),
  },
  {
    type: 'email_capture',
    label: 'Captura de email',
    description: 'Sumá contactos a tu lista antes de que se vayan',
    icon: '📧',
    category: 'content',
    createDefault: () => ({
      id: generateId(),
      type: 'email_capture',
      order: 0,
      visible: true,
      seasonFilter: 'always',
      data: {
        translations: {
          es: { headline: 'Sumate a la lista', description: 'Enterate primero de novedades y promos', buttonLabel: 'Enviar' },
          en: { headline: '', description: '', buttonLabel: '' },
          pt: { headline: '', description: '', buttonLabel: '' },
          fr: { headline: '', description: '', buttonLabel: '' },
          de: { headline: '', description: '', buttonLabel: '' },
          it: { headline: '', description: '', buttonLabel: '' },
        },
      },
    }),
  },
  {
    type: 'payment_button',
    label: 'Cobrar (Mercado Pago)',
    description: 'Vendé un producto o servicio con Mercado Pago',
    icon: '💳',
    category: 'content',
    createDefault: () => ({
      id: generateId(),
      type: 'payment_button',
      order: 0,
      visible: true,
      seasonFilter: 'always',
      data: {
        translations: {
          es: { title: 'Mi producto', description: '' },
          en: { title: '', description: '' },
          pt: { title: '', description: '' },
          fr: { title: '', description: '' },
          de: { title: '', description: '' },
          it: { title: '', description: '' },
        },
        price: 0,
        currency: 'ARS',
      },
    }),
  },
  {
    type: 'event_tickets',
    label: 'Entradas a evento',
    description: 'Vendé 2-3 tipos de entrada con QR de validación por email',
    icon: '🎫',
    category: 'content',
    createDefault: () => ({
      id: generateId(),
      type: 'event_tickets',
      order: 0,
      visible: true,
      seasonFilter: 'always',
      data: {
        translations: {
          es: { title: 'Mi evento', description: '' },
          en: { title: '', description: '' },
          pt: { title: '', description: '' },
          fr: { title: '', description: '' },
          de: { title: '', description: '' },
          it: { title: '', description: '' },
        },
        tiers: [{ id: generateId(), name: 'General', price: 0 }],
        currency: 'ARS',
      },
    }),
  },
  {
    type: 'business_hours',
    label: 'Horario de atención',
    description: 'Mostrá si estás abierto ahora, con horario por día',
    icon: '🕒',
    category: 'content',
    createDefault: () => ({
      id: generateId(),
      type: 'business_hours',
      order: 0,
      visible: true,
      seasonFilter: 'always',
      data: {
        translations: {
          es: { title: 'Horario de atención' },
          en: { title: '' },
          pt: { title: '' },
          fr: { title: '' },
          de: { title: '' },
          it: { title: '' },
        },
        timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'America/Argentina/Buenos_Aires',
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
    }),
  },
  {
    type: 'google_reviews',
    label: 'Reseñas de Google',
    description: 'Mostrá tu puntaje y sumá más reseñas',
    icon: '⭐',
    category: 'content',
    createDefault: () => ({
      id: generateId(),
      type: 'google_reviews',
      order: 0,
      visible: true,
      seasonFilter: 'always',
      data: {
        translations: {
          es: { title: 'Nos calificaron en Google' },
          en: { title: '' },
          pt: { title: '' },
          fr: { title: '' },
          de: { title: '' },
          it: { title: '' },
        },
        rating: 5,
        reviewCount: 0,
        mapsUrl: '',
        placeId: '',
      },
    }),
  },
  {
    type: 'loyalty_card',
    label: 'Tarjeta de sellos',
    description: 'Fidelizá clientes: sumá un sello por visita y canjeá un premio',
    icon: '🎟️',
    category: 'content',
    createDefault: () => ({
      id: generateId(),
      type: 'loyalty_card',
      order: 0,
      visible: true,
      seasonFilter: 'always',
      data: {
        translations: {
          es: { title: 'Tarjeta de sellos', description: 'Sumá un sello en cada visita' },
          en: { title: '', description: '' },
          pt: { title: '', description: '' },
          fr: { title: '', description: '' },
          de: { title: '', description: '' },
          it: { title: '', description: '' },
        },
        stampIcon: '☕',
        targetStamps: 10,
        rewardDescription: { es: 'Un producto gratis', en: '', pt: '', fr: '', de: '', it: '' } as Record<Lang, string>,
      },
    }),
  },
]

export const BLOCK_BY_TYPE = Object.fromEntries(
  BLOCK_REGISTRY.map(b => [b.type, b])
) as Record<BlockType, BlockDef>

export const BLOCK_CATEGORIES = {
  navigation: BLOCK_REGISTRY.filter(b => b.category === 'navigation'),
  content:    BLOCK_REGISTRY.filter(b => b.category === 'content'),
  social:     BLOCK_REGISTRY.filter(b => b.category === 'social'),
  layout:     BLOCK_REGISTRY.filter(b => b.category === 'layout'),
}

export const COLOR_SCHEMES: Record<string, { bg: string; text: string; hover: string }> = {
  red:    { bg: '#E8150A', text: '#fff', hover: '#B50F07' },
  orange: { bg: '#FF8C00', text: '#fff', hover: '#CC6F00' },
  blue:   { bg: '#185FA5', text: '#fff', hover: '#134880' },
  green:  { bg: '#16A34A', text: '#fff', hover: '#15803D' },
  purple: { bg: '#7C3AED', text: '#fff', hover: '#6D28D9' },
  dark:   { bg: '#1A1B1C', text: '#fff', hover: '#000' },
}

export const ICON_BG_PRESETS: Record<string, string> = {
  red:    '#FEF0EF',
  orange: '#FFF4E6',
  blue:   '#EAF2FB',
  green:  '#ECFDF5',
  purple: '#F0ECFF',
  gray:   '#F2F3F4',
  dark:   '#1A1B1C',
}
