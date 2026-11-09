// "Create my page with AI": pure helpers (no I/O) so they are unit-testable.
// The model only ever proposes TEXT. The server validates and clamps it here,
// and the app turns it into ordinary blocks: nothing the model returns is
// trusted as markup, URLs or settings.

export interface DraftInput { description: string; businessName: string }

export interface Draft {
  tagline: string
  bio: string
  services: { title: string; description: string }[]
  faq: { question: string; answer: string }[]
  schemaType: string
  color: string
}

export const MAX_DESCRIPTION = 800
const clip = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : ''

const HEX = /^#[0-9a-fA-F]{6}$/

/** Validates untrusted model output into a safe Draft (or null if unusable). */
export function sanitizeDraft(raw: unknown, isSchemaType: (v: unknown) => boolean): Draft | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const services = (Array.isArray(r.services) ? r.services : []).slice(0, 6)
    .map(s => ({ title: clip((s as Record<string, unknown>)?.title, 60), description: clip((s as Record<string, unknown>)?.description, 120) }))
    .filter(s => s.title)
  const faq = (Array.isArray(r.faq) ? r.faq : []).slice(0, 5)
    .map(q => ({ question: clip((q as Record<string, unknown>)?.question, 120), answer: clip((q as Record<string, unknown>)?.answer, 400) }))
    .filter(q => q.question && q.answer)
  const tagline = clip(r.tagline, 90)
  const bio = clip(r.bio, 500)
  if (!tagline && !bio && services.length === 0) return null
  return {
    tagline, bio, services, faq,
    schemaType: isSchemaType(r.schemaType) ? (r.schemaType as string) : 'LocalBusiness',
    color: typeof r.color === 'string' && HEX.test(r.color) ? r.color : '#E8150A',
  }
}

/** No-AI fallback: a sensible starting point built from what the user wrote. */
export function heuristicDraft(input: DraftInput): Draft {
  const text = clip(input.description, MAX_DESCRIPTION)
  const first = text.split(/(?<=[.!?])\s/)[0] ?? text
  return {
    tagline: clip(first, 90) || input.businessName,
    bio: clip(text, 500),
    services: [], faq: [], schemaType: 'LocalBusiness', color: '#E8150A',
  }
}

export interface DraftBlockOut { type: string; data: Record<string, unknown> }
type Tr<T> = Record<string, T>

const LANGS = ['es', 'en', 'pt', 'fr', 'de', 'it']
const onlyEs = <T extends Record<string, string>>(es: T): Tr<T> => {
  const blank = Object.fromEntries(Object.keys(es).map(k => [k, ''])) as T
  return Object.fromEntries(LANGS.map(l => [l, l === 'es' ? es : blank]))
}

const ICONS = ['✨', '💼', '📌', '🎯', '🛠️', '⭐']

/** Draft -> page content in the same shape the editor creates. */
export function draftToPage(draft: Draft, newId: () => string) {
  const mk = (type: string, data: Record<string, unknown>) => ({ id: newId(), type, order: 0, visible: true, seasonFilter: 'always', data })
  const blocks: ReturnType<typeof mk>[] = []
  if (draft.bio) blocks.push(mk('text', { translations: onlyEs({ content: draft.bio }), align: 'center', size: 'md' }))
  if (draft.services.length) {
    blocks.push(mk('section_label', { translations: onlyEs({ text: 'Servicios' }), seasonFilter: 'always' }))
    draft.services.forEach((s, i) => blocks.push(mk('link', {
      icon: ICONS[i % ICONS.length], iconBg: ['red', 'blue', 'green'][i % 3], openInNewTab: false, url: '#',
      translations: onlyEs({ title: s.title, description: s.description }),
    })))
  }
  if (draft.faq.length) blocks.push(mk('faq', { translations: onlyEs({ title: 'Preguntas frecuentes' }) }))
  blocks.push(mk('contact_card', { phone: '', email: '', address: '', mapUrl: '', whatsapp: '', whatsappMessage: 'Hola, quería hacerte una consulta' }))
  blocks.forEach((b, i) => { b.order = i })
  return {
    blocks,
    settings: { primaryColor: draft.color, tagline: draft.tagline, schemaType: draft.schemaType, description: draft.tagline || draft.bio.slice(0, 160) },
    knowledge: draft.faq,
  }
}

/** Small in-memory limiter (per server instance: a speed bump, not a quota). */
export function createLimiter(max: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, number[]>()
  return (key: string): boolean => {
    const t = now()
    const recent = (hits.get(key) ?? []).filter(x => t - x < windowMs)
    if (recent.length >= max) { hits.set(key, recent); return false }
    recent.push(t); hits.set(key, recent)
    if (hits.size > 500) for (const [k, v] of hits) if (v.every(x => t - x >= windowMs)) hits.delete(k)
    return true
  }
}
