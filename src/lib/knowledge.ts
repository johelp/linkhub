// Business knowledge base (see migration 019). Pure helpers shared by the
// dashboard, the public page, schema.org/llms.txt and the MCP server.
export type KnowledgeKind = 'faq' | 'info' | 'policy'
export type KnowledgeVisibility = 'public' | 'private'

export interface KnowledgeEntry {
  id: string
  user_id?: string
  page_id: string | null
  kind: KnowledgeKind
  title: string
  content: string
  visibility: KnowledgeVisibility
  position: number
  updated_at?: string
}

export const KIND_LABEL: Record<KnowledgeKind, string> = { faq: 'Pregunta frecuente', info: 'Información', policy: 'Política' }
export const MAX_TITLE = 200
export const MAX_CONTENT = 4000

/** Validates an entry coming from a form or an API call. */
export function validateEntry(e: { title?: unknown; content?: unknown; kind?: unknown; visibility?: unknown }): string | null {
  if (typeof e.title !== 'string' || !e.title.trim()) return 'Escribe la pregunta o el título'
  if (e.title.length > MAX_TITLE) return `El título admite hasta ${MAX_TITLE} caracteres`
  if (typeof e.content !== 'string' || !e.content.trim()) return 'Escribe la respuesta o el contenido'
  if (e.content.length > MAX_CONTENT) return `El contenido admite hasta ${MAX_CONTENT} caracteres`
  if (e.kind !== undefined && !['faq', 'info', 'policy'].includes(e.kind as string)) return 'Tipo no válido'
  if (e.visibility !== undefined && !['public', 'private'].includes(e.visibility as string)) return 'Visibilidad no válida'
  return null
}

/** Entries a given page may show publicly: its own + account-wide, public only, in order. */
export function publicEntriesForPage(entries: KnowledgeEntry[], pageId: string): KnowledgeEntry[] {
  return entries
    .filter(e => e.visibility === 'public' && (e.page_id === null || e.page_id === pageId))
    .sort((a, b) => a.position - b.position)
}

/** FAQs for schema.org FAQPage (only kind=faq, public). */
export function faqPairs(entries: KnowledgeEntry[]): { q: string; a: string }[] {
  return entries.filter(e => e.kind === 'faq').map(e => ({ q: e.title.trim(), a: e.content.trim() }))
}

/** Simple relevance search used by assistants/MCP: title hits weigh more than body hits. */
export function searchEntries(entries: KnowledgeEntry[], query: string, limit = 5): KnowledgeEntry[] {
  const terms = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\W+/).filter(t => t.length > 2)
  if (!terms.length) return []
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  return entries
    .map(e => ({ e, score: terms.reduce((n, t) => n + (norm(e.title).includes(t) ? 3 : 0) + (norm(e.content).includes(t) ? 1 : 0), 0) }))
    .filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map(x => x.e)
}
