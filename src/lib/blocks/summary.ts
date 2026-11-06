import type { Block, Lang } from '@/types'

export interface BlockSummary { title: string; detail: string }

type Translated = Partial<Record<Lang, Record<string, string | undefined>>>

// First non-empty string among the given keys, in the active language and
// then falling back to Spanish (the language every block is created with).
function pick(translations: Translated | undefined, lang: Lang, ...keys: string[]): string {
  for (const l of [lang, 'es' as Lang]) {
    for (const k of keys) {
      const v = translations?.[l]?.[k]
      if (v && v.trim()) return v.trim()
    }
  }
  return ''
}

function host(url?: string): string {
  if (!url) return ''
  try { return new URL(url).host.replace(/^www\./, '') } catch { return url }
}

// What the outline shows for a block: a real title and one line of context,
// so a list of fifteen "Enlace" rows becomes readable at a glance.
export function summarizeBlock(block: Block, lang: Lang): BlockSummary {
  switch (block.type) {
    case 'link':
    case 'featured':
      return { title: pick(block.data.translations, lang, 'title') || 'Sin título', detail: host(block.data.url) }
    case 'expandable':
      return { title: pick(block.data.translations, lang, 'title') || 'Sin título', detail: `${block.data.children.length} opciones` }
    case 'section_label':
      return { title: pick(block.data.translations, lang, 'text') || 'Sección', detail: 'Etiqueta' }
    case 'text':
      return { title: pick(block.data.translations, lang, 'content').slice(0, 60) || 'Texto vacío', detail: 'Texto' }
    case 'social_grid':
      return { title: block.data.items.map(i => i.label || i.platform).join(' · ') || 'Redes', detail: `${block.data.items.length} redes` }
    case 'contact_card':
      return { title: block.data.whatsapp || block.data.phone || block.data.email || 'Contacto', detail: 'Tarjeta de contacto' }
    case 'divider':
      return { title: 'Separador', detail: block.data.style }
    case 'image_banner':
      return { title: block.data.altText || 'Imagen', detail: block.data.imageUrl ? host(block.data.imageUrl) : 'Falta la imagen' }
    case 'video_embed':
      return { title: block.data.caption || 'Video', detail: block.data.url ? host(block.data.url) : 'Falta el enlace' }
    case 'email_capture':
      return { title: pick(block.data.translations, lang, 'headline') || 'Captura de email', detail: 'Newsletter' }
    case 'payment_button':
      return { title: pick(block.data.translations, lang, 'title') || 'Cobro', detail: `${block.data.price} ${block.data.currency}` }
    case 'event_tickets':
      return { title: pick(block.data.translations, lang, 'title') || 'Entradas', detail: `${block.data.tiers.length} tipos` }
    case 'business_hours':
      return { title: pick(block.data.translations, lang, 'title') || 'Horarios', detail: 'Abierto / cerrado' }
    case 'google_reviews':
      return { title: pick(block.data.translations, lang, 'title') || 'Reseñas', detail: `${block.data.rating}★ · ${block.data.reviewCount}` }
    case 'loyalty_card':
      return { title: pick(block.data.translations, lang, 'title') || 'Tarjeta de sellos', detail: `${block.data.targetStamps} sellos` }
    case 'menu':
      return { title: pick(block.data.translations, lang, 'title') || 'Menú', detail: `${block.data.sections.length} categorías` }
    case 'faq':
      return { title: pick(block.data.translations, lang, 'title') || 'Preguntas frecuentes', detail: 'Base de conocimiento' }
    case 'vcard':
      return { title: pick(block.data.translations, lang, 'label') || 'Guardar contacto', detail: 'vCard' }
    case 'map_embed':
      return { title: block.data.query ? block.data.query.slice(0, 50) : 'Mapa', detail: block.data.query ? 'Google Maps' : 'Falta la dirección' }
    case 'appointment_request':
      return { title: pick(block.data.translations, lang, 'title') || 'Citas', detail: `${block.data.services.length} servicios · WhatsApp` }
    case 'order_menu': {
      const count = block.data.categories.reduce((n, c) => n + c.items.length, 0)
      return { title: pick(block.data.translations, lang, 'title') || 'Pedidos', detail: `${count} productos · WhatsApp` }
    }
    default:
      return { title: (block as Block).type, detail: '' }
  }
}

export interface BlockIssue { blockId: string; message: string }

const PLACEHOLDER_URL = /^(https?:\/\/)?#?$/

// Problems worth flagging before publishing: links that still point nowhere,
// and empty titles. Pure and cheap, so it also drives the live badges.
export function findBlockIssues(blocks: Block[], lang: Lang, connectedProviders?: readonly string[]): BlockIssue[] {
  const issues: BlockIssue[] = []
  for (const b of blocks) {
    const name = summarizeBlock(b, lang).title
    if (b.type === 'link' || b.type === 'featured') {
      if (PLACEHOLDER_URL.test(b.data.url.trim())) issues.push({ blockId: b.id, message: `“${name}” no tiene un enlace` })
    }
    if ((b.type === 'payment_button' || b.type === 'event_tickets') && connectedProviders && connectedProviders.length === 0) {
      issues.push({ blockId: b.id, message: `“${name}” necesita una pasarela de cobro conectada (Cobros)` })
    }
    if (b.type === 'map_embed' && !b.data.query.trim()) issues.push({ blockId: b.id, message: `“${name}” necesita una dirección` })
    if (b.type === 'appointment_request' && b.data.whatsapp.replace(/\D/g, '').length < 8) {
      issues.push({ blockId: b.id, message: `“${name}” necesita tu número de WhatsApp para recibir solicitudes` })
    }
    if (b.type === 'order_menu' && b.data.whatsapp.replace(/\D/g, '').length < 8) {
      issues.push({ blockId: b.id, message: `“${name}” necesita tu número de WhatsApp para recibir pedidos` })
    }
    if ((b.type === 'image_banner' && !b.data.imageUrl) || (b.type === 'video_embed' && !b.data.url)) {
      issues.push({ blockId: b.id, message: `“${name}” está vacío` })
    }
  }
  return issues
}
