// Authenticated tier: tools that act on the key owner's OWN data. Rules that
// hold for every tool here:
//   * the owner id comes from the verified API key (ctx.principal), never from
//     the arguments (a `user_id` argument is rejected by the schema);
//   * every store call receives that id; a row of another owner is
//     indistinguishable from a missing one ("no encontrada");
//   * every write goes through lib/pageWrite.ts (same sanitizers, plan limits,
//     flags and size limits as the editor) and is audited BEFORE it happens.
import type { Block, Page } from '../../types/index.ts'
import { PLAN_LIMITS } from '../../types/index.ts'
import { SCHEMA_TYPES } from '../seo.ts'
import { validateEntry } from '../knowledge.ts'
import { evaluatePageWrite, isObject } from '../pageWrite.ts'
import { plain, untrusted } from './results.ts'
import { ID_PATTERN, UUID_PATTERN, DATE_PATTERN, slugSchema, str, type Schema } from './validate.ts'
import { ToolError, type ToolContext, type ToolDef } from './types.ts'

const LANGS = ['es', 'en', 'pt', 'fr', 'de', 'it'] as const
const pageId: Schema = str('Id de la página (de list_my_pages).', { pattern: UUID_PATTERN, minLength: 36, maxLength: 36 })

// What update_page_settings may touch. Not here on purpose: slug, published,
// custom_domain, billing, moderation (publishing stays in the dashboard).
const settingsPatch: Extract<Schema, { type: 'object' }> = {
  type: 'object', description: 'Cambios parciales de los ajustes; solo se tocan las claves enviadas.',
  properties: {
    defaultLang: { type: 'string', enum: LANGS },
    enabledLangs: { type: 'array', items: { type: 'string', enum: LANGS }, minItems: 1, maxItems: 6 },
    seasonMode: { type: 'string', enum: ['winter', 'summer', 'off', 'always'] },
    primaryColor: str('Color #RRGGBB', { maxLength: 7 }),
    backgroundColor: str('Color #RRGGBB', { maxLength: 7 }),
    fontFamily: str('Nombre de fuente', { maxLength: 40 }),
    showPoweredBy: { type: 'boolean' },
    animations: { type: 'boolean' },
    seo: { type: 'object', properties: {
      title: str('Título SEO', { maxLength: 70 }), description: str('Descripción SEO', { maxLength: 300 }),
      ogImage: str('URL https de la imagen OG ("" para quitarla)', { maxLength: 500 }),
      schemaType: { type: 'string', enum: SCHEMA_TYPES }, noindex: { type: 'boolean' } } },
    profile: { type: 'object', properties: {
      avatarUrl: str('URL https', { maxLength: 500 }), coverUrl: str('URL https', { maxLength: 500 }), tagline: str('Lema', { maxLength: 160 }), whatsapp: str('WhatsApp por defecto para pedidos y citas', { maxLength: 24 }) } },
    pixels: { type: 'object', properties: {
      ga4Id: str('G-XXXXXXXX', { pattern: '^(G-[A-Z0-9]{4,20})?$', maxLength: 24 }), metaPixelId: str('ID numérico', { pattern: '^(\\d{10,20})?$', maxLength: 20 }) } },
  },
}

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

/** Objects merge recursively, arrays and scalars replace. Refuses prototype-pollution keys and absurd depth. */
export function deepMerge(base: unknown, patch: unknown, depth = 0): unknown {
  if (depth > 12) throw new ToolError('Estructura demasiado profunda')
  if (!isObject(patch) || !isObject(base)) return patch
  const out: Record<string, unknown> = { ...base }
  for (const [k, v] of Object.entries(patch)) {
    if (FORBIDDEN_KEYS.has(k)) throw new ToolError(`Clave no permitida: ${k}`)
    out[k] = k in base ? deepMerge(base[k], v, depth + 1) : v
  }
  return out
}

function owner(ctx: ToolContext) {
  if (!ctx.principal) throw new ToolError('Se necesita una API key.') // unreachable: the dispatcher gates by scope
  return ctx.principal
}

async function ownedPage(ctx: ToolContext, ref: { id?: unknown; slug?: unknown }): Promise<Page> {
  const p = owner(ctx)
  const page = await ctx.deps.owner.getPage(p.userId, { id: typeof ref.id === 'string' ? ref.id : undefined, slug: typeof ref.slug === 'string' ? ref.slug : undefined })
  if (!page) throw new ToolError('Página no encontrada.')
  return page
}

/** Records the write, then lets it happen. If the audit can't be written the write is refused. */
async function audited(ctx: ToolContext, action: string, target: string, detail: Record<string, unknown>) {
  const p = owner(ctx)
  try { await ctx.deps.audit({ userId: p.userId, keyId: p.keyId, action, target, detail, ip: ctx.ip }) }
  catch { throw new ToolError('Escritura rechazada: no se pudo registrar en la bitácora de auditoría. Inténtalo de nuevo.') }
}

async function writePage(ctx: ToolContext, page: Page, input: { name?: string; settings?: unknown; blocks?: unknown }, audit: { action: string; detail: Record<string, unknown> }) {
  const p = owner(ctx)
  const res = await evaluatePageWrite(input, {
    existingBlocks: page.blocks as Block[],
    getPlan: () => ctx.deps.owner.getPlan(p.userId),
    getFlags: () => ctx.deps.getFlags(p.userId),
  })
  if (!res.ok) throw new ToolError(res.error)
  await audited(ctx, audit.action, page.id, audit.detail)
  const { error } = await ctx.deps.owner.savePage(p.userId, page.id, res.update as Record<string, unknown>)
  if (error) throw new ToolError(error.message.includes('plan_limit_exceeded') ? 'Tu plan no permite este contenido.' : 'No se pudo guardar.')
}

const summary = (b: Block) => ({ id: b.id, type: b.type, visible: b.visible, order: b.order })

export const privateTools: ToolDef[] = [
  {
    name: 'list_my_pages', title: 'Mis páginas', scope: 'pages:read', readOnly: true,
    description: 'Lista las páginas de la cuenta dueña de la API key (id, slug, nombre, publicada, visitas).',
    inputSchema: { type: 'object', properties: {} },
    async run(_a, ctx) {
      const pages = await ctx.deps.owner.listPages(owner(ctx).userId)
      return untrusted({ pages: pages.map(p => ({ ...p, url: `${ctx.deps.baseUrl}/p/${p.slug}` })) }, `${pages.length} página(s).`)
    },
  },
  {
    name: 'get_my_page', title: 'Ver una de mis páginas', scope: 'pages:read', readOnly: true,
    description: 'Devuelve una página propia: ajustes y bloques. view=summary (por defecto) lista solo id/tipo/visibilidad de cada bloque; view=full incluye los datos completos de los bloques (necesario antes de update_block).',
    inputSchema: { type: 'object', properties: { page_id: pageId, slug: slugSchema, view: { type: 'string', enum: ['summary', 'full'] } } },
    async run(a, ctx) {
      if (!a.page_id && !a.slug) throw new ToolError('Indica page_id o slug.')
      const page = await ownedPage(ctx, { id: a.page_id, slug: a.slug })
      const blocks = (page.blocks as Block[])
      return untrusted({
        id: page.id, slug: page.slug, name: page.name, published: page.published, url: `${ctx.deps.baseUrl}/p/${page.slug}`, updated_at: page.updated_at,
        settings: page.settings, blocks: a.view === 'full' ? blocks : blocks.map(summary),
      }, `Página con ${blocks.length} bloques.`)
    },
  },
  {
    name: 'update_page_settings', title: 'Cambiar nombre o ajustes de una página', scope: 'pages:write', readOnly: false, idempotent: true,
    description: 'Cambia el nombre y/o ajustes (colores, idiomas, SEO, perfil, píxeles) de una página propia. Solo se modifican las claves enviadas. No publica ni despublica ni cambia el slug. Pasa por las mismas validaciones que el editor.',
    inputSchema: { type: 'object', required: ['page_id'], properties: { page_id: pageId, name: str('Nombre de la página', { minLength: 1, maxLength: 80 }), settings: settingsPatch } },
    async run(a, ctx) {
      if (a.name === undefined && a.settings === undefined) throw new ToolError('Indica name o settings.')
      const page = await ownedPage(ctx, { id: a.page_id })
      let settings: unknown
      if (a.settings !== undefined) {
        const patch = a.settings as Record<string, unknown>
        const cur = page.settings as unknown as Record<string, unknown>
        const merged: Record<string, unknown> = { ...cur, ...patch }
        for (const k of ['seo', 'profile', 'pixels']) if (patch[k] !== undefined) merged[k] = { ...(cur[k] as object | undefined), ...(patch[k] as object) }
        const langs = (merged.enabledLangs as string[] | undefined) ?? [merged.defaultLang as string]
        if (!langs.includes(merged.defaultLang as string)) throw new ToolError('enabledLangs debe incluir defaultLang.')
        if (patch.enabledLangs !== undefined && langs.length > 1 && !PLAN_LIMITS[await ctx.deps.owner.getPlan(owner(ctx).userId)].multiLanguage) throw new ToolError('Varios idiomas requieren plan Pro.')
        settings = merged
      }
      await writePage(ctx, page, { name: a.name as string | undefined, settings }, {
        action: 'page.update_settings', detail: { fields: [...(a.name !== undefined ? ['name'] : []), ...Object.keys((a.settings as object) ?? {}).map(k => `settings.${k}`)] },
      })
      return plain({ ok: true, page_id: page.id, updated: [...(a.name !== undefined ? ['name'] : []), ...(a.settings !== undefined ? ['settings'] : [])] }, 'Página actualizada (los cambios públicos pueden tardar hasta 60 s en verse).')
    },
  },
  {
    name: 'update_block', title: 'Modificar un bloque', scope: 'pages:write', readOnly: false, idempotent: true,
    description: 'Modifica un bloque existente de una página propia: `visible` y/o `data` (los objetos se fusionan, las listas se reemplazan enteras: para cambiar un servicio reenvía la lista completa de services). Lee antes get_my_page con view=full. No cambia el tipo del bloque ni crea bloques nuevos.',
    inputSchema: { type: 'object', required: ['page_id', 'block_id'], properties: { page_id: pageId, block_id: str('Id del bloque.', { pattern: ID_PATTERN }), visible: { type: 'boolean' }, data: { type: 'object', description: 'Cambios parciales de block.data (misma forma que en get_my_page).', additionalProperties: true } } },
    async run(a, ctx) {
      if (a.visible === undefined && a.data === undefined) throw new ToolError('Indica visible o data.')
      const page = await ownedPage(ctx, { id: a.page_id })
      const blocks = page.blocks as Block[]
      const idx = blocks.findIndex(b => b.id === a.block_id)
      if (idx < 0) throw new ToolError('Bloque no encontrado en esa página.')
      const old = blocks[idx]
      const next = { ...old, ...(a.visible !== undefined ? { visible: a.visible as boolean } : {}), ...(a.data !== undefined ? { data: deepMerge(old.data, a.data) } : {}) } as Block
      await writePage(ctx, page, { blocks: blocks.map((b, i) => (i === idx ? next : b)) }, {
        action: 'page.update_block', detail: { block_id: old.id, block_type: old.type, fields: [...(a.visible !== undefined ? ['visible'] : []), ...Object.keys((a.data as object) ?? {}).map(k => `data.${k}`)] },
      })
      return plain({ ok: true, page_id: page.id, block_id: old.id, block_type: old.type }, 'Bloque actualizado (los cambios públicos pueden tardar hasta 60 s en verse).')
    },
  },
  {
    name: 'list_knowledge', title: 'Mi base de conocimiento', scope: 'knowledge:read', readOnly: true,
    description: 'Lista las entradas de conocimiento de la cuenta (públicas y privadas). page_id opcional: esa página + las de toda la cuenta.',
    inputSchema: { type: 'object', properties: { page_id: pageId, kind: { type: 'string', enum: ['faq', 'info', 'policy'] }, visibility: { type: 'string', enum: ['public', 'private'] } } },
    async run(a, ctx) {
      const p = owner(ctx)
      if (a.page_id) await ownedPage(ctx, { id: a.page_id })
      const rows = await ctx.deps.owner.listKnowledge(p.userId, { pageId: a.page_id as string | undefined, kind: a.kind as string | undefined, visibility: a.visibility as string | undefined })
      return untrusted({ entries: rows.map(e => ({ id: e.id, page_id: e.page_id, kind: e.kind, title: e.title, content: e.content, visibility: e.visibility, position: e.position, updated_at: e.updated_at })) }, `${rows.length} entrada(s).`)
    },
  },
  {
    name: 'upsert_knowledge', title: 'Crear o editar conocimiento', scope: 'knowledge:write', readOnly: false, idempotent: true,
    description: 'Crea una entrada (sin `id`) o reemplaza una existente (con `id`). visibility=public alimenta la página, schema.org FAQ y a los asistentes públicos; private solo lo ven tus propias integraciones. page_id=null/omitido = aplica a todas tus páginas.',
    inputSchema: { type: 'object', required: ['title', 'content'], properties: {
      id: str('Id de la entrada a reemplazar.', { pattern: UUID_PATTERN, minLength: 36, maxLength: 36 }), page_id: pageId,
      kind: { type: 'string', enum: ['faq', 'info', 'policy'] }, title: str('Pregunta o tema.', { minLength: 1, maxLength: 200 }),
      content: str('Respuesta o detalle.', { minLength: 1, maxLength: 4000 }), visibility: { type: 'string', enum: ['public', 'private'] },
      position: { type: 'integer', minimum: 0, maximum: 10000 } } },
    async run(a, ctx) {
      const p = owner(ctx)
      const bad = validateEntry(a)
      if (bad) throw new ToolError(bad)
      if (a.page_id) await ownedPage(ctx, { id: a.page_id })
      await audited(ctx, a.id ? 'knowledge.update' : 'knowledge.create', String(a.id ?? 'new'), { kind: a.kind ?? 'faq', visibility: a.visibility ?? 'public', page_id: a.page_id ?? null, title_chars: String(a.title).length, content_chars: String(a.content).length })
      const r = await ctx.deps.owner.upsertKnowledge(p.userId, {
        id: a.id as string | undefined, page_id: (a.page_id as string | undefined) ?? null, kind: (a.kind as 'faq') ?? 'faq',
        title: String(a.title).trim(), content: String(a.content).trim(), visibility: (a.visibility as 'public') ?? 'public', position: (a.position as number | undefined) ?? 0,
      })
      if (r.error || !r.entry) throw new ToolError(r.error ?? 'No se pudo guardar.')
      return plain({ ok: true, id: r.entry.id }, a.id ? 'Entrada actualizada.' : 'Entrada creada.')
    },
  },
  {
    name: 'delete_knowledge', title: 'Borrar conocimiento', scope: 'knowledge:write', readOnly: false, destructive: true, idempotent: true,
    description: 'Borra una entrada de conocimiento propia por id. No se puede deshacer.',
    inputSchema: { type: 'object', required: ['id'], properties: { id: str('Id de la entrada.', { pattern: UUID_PATTERN, minLength: 36, maxLength: 36 }) } },
    async run(a, ctx) {
      const p = owner(ctx)
      await audited(ctx, 'knowledge.delete', String(a.id), {})
      if (!(await ctx.deps.owner.deleteKnowledge(p.userId, String(a.id)))) throw new ToolError('Entrada no encontrada.')
      return plain({ ok: true, id: a.id }, 'Entrada borrada.')
    },
  },
  {
    name: 'get_analytics_summary', title: 'Resumen de analíticas', scope: 'analytics:read', readOnly: true,
    description: 'Visitas y clics de tus páginas en los últimos N días, y los bloques más pulsados (muestra de los últimos eventos).',
    inputSchema: { type: 'object', properties: { page_id: pageId, days: { type: 'integer', description: 'Ventana en días (1-90, por defecto 30).', minimum: 1, maximum: 90 } } },
    async run(a, ctx) {
      const p = owner(ctx)
      const ids = a.page_id ? [(await ownedPage(ctx, { id: a.page_id })).id] : (await ctx.deps.owner.listPages(p.userId)).map(x => x.id)
      const s = await ctx.deps.owner.analytics(p.userId, ids.slice(0, 50), (a.days as number | undefined) ?? 30)
      return plain({ ...s }, `Analíticas de ${s.days} días.`)
    },
  },
  {
    name: 'list_payments', title: 'Historial de cobros', scope: 'payments:read', readOnly: true,
    description: 'Cobros recibidos en tus páginas (solo lectura): estado, proveedor, importe, concepto. Nunca incluye credenciales de pasarela ni datos de tarjeta; el email del pagador sale enmascarado.',
    inputSchema: { type: 'object', properties: {
      page_id: pageId, status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'refunded'] }, provider: { type: 'string', enum: ['mercadopago', 'stripe', 'redsys'] },
      from: { type: 'string', pattern: DATE_PATTERN, format: 'date', maxLength: 10 }, to: { type: 'string', pattern: DATE_PATTERN, format: 'date', maxLength: 10 },
      limit: { type: 'integer', minimum: 1, maximum: 50 } } },
    async run(a, ctx) {
      const p = owner(ctx)
      if (a.page_id) await ownedPage(ctx, { id: a.page_id })
      const rows = await ctx.deps.owner.listPayments(p.userId, { pageId: a.page_id as string | undefined, status: a.status as string | undefined, provider: a.provider as string | undefined, from: a.from as string | undefined, to: a.to as string | undefined, limit: (a.limit as number | undefined) ?? 20 })
      return untrusted({ payments: rows.map(r => ({ id: r.id, created_at: r.created_at, status: r.status, provider: r.provider, amount: r.amount, currency: r.currency, concept: r.tier_name, page_id: r.page_id, provider_payment_id: r.provider_payment_id, payer: maskEmail(r.payer_email) })) }, `${rows.length} cobro(s).`)
    },
  },
]

export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null
  const [user, domain] = email.split('@')
  return domain ? `${user.slice(0, 1)}***@${domain}` : '***'
}
