import type { Block, BlockType, Lang } from '@/types'
import { generateId } from '@/lib/utils'

export interface BlockDef {
  type: BlockType
  label: string
  description: string
  icon: string
  category: 'content' | 'navigation' | 'social' | 'layout'
  createDefault: (lang: Lang) => Block
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
    createDefault: (lang) => ({
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
    createDefault: (lang) => ({
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
    createDefault: (lang) => ({
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
    createDefault: (lang) => ({
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
    createDefault: (lang) => ({
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
    description: 'WhatsApp, email, dirección y horario',
    icon: '📞',
    category: 'content',
    createDefault: (lang) => ({
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
        showHours: false,
      },
    }),
  },
  {
    type: 'divider',
    label: 'Divisor',
    description: 'Línea o espacio separador',
    icon: '➖',
    category: 'layout',
    createDefault: (lang) => ({
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
    createDefault: (lang) => ({
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
    createDefault: (lang) => ({
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
