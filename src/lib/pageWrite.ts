// Shared page-write rules. EVERY writer of `pages.blocks` / `pages.settings`
// (the editor through PATCH /api/pages, the MCP server, any future API) goes
// through here, so the sanitizers, plan limits, feature flags and size limits
// can never drift apart. Pure and dependency-free (relative imports only) so it
// is unit-tested; the callers do the I/O (ownership check, loading plan/flags,
// the actual UPDATE).
import { PLAN_LIMITS, blockRequiresPro, type Block, type Plan } from '../types/index.ts'
import { HEX_COLOR, sanitizeBlocks, sanitizeSettings } from './security.ts'
import { BLOCK_FLAG, type FlagMap } from './flags.ts'

export const MAX_BLOCKS = 100
export const MAX_BODY_BYTES = 512 * 1024
export const MAX_NAME = 80

export interface PageWriteInput { blocks?: unknown; settings?: unknown; name?: unknown; published?: unknown }
export interface PageUpdate { blocks?: unknown; settings?: unknown; name?: string; published?: boolean }
export type PageWriteResult = { ok: true; update: PageUpdate } | { ok: false; status: 400 | 403 | 413; error: string }

export function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

// Server-side shape check: the editor is just one client of the write path, so
// nothing it sends is trusted. Returns an error string or null.
export function validateBlocks(blocks: unknown): string | null {
  if (!Array.isArray(blocks)) return 'blocks debe ser una lista'
  if (blocks.length > MAX_BLOCKS) return `Máximo ${MAX_BLOCKS} bloques por página`
  const ids = new Set<string>()
  for (const b of blocks) {
    if (!isObject(b) || typeof b.id !== 'string' || typeof b.type !== 'string' || !isObject(b.data)) {
      return 'Bloque con formato inválido'
    }
    if (ids.has(b.id)) return 'IDs de bloque duplicados'
    ids.add(b.id)
  }
  return null
}

export function validateSettings(settings: unknown): string | null {
  if (!isObject(settings)) return 'settings inválido'
  for (const key of ['primaryColor', 'backgroundColor'] as const) {
    const v = settings[key]
    if (v !== undefined && !(typeof v === 'string' && HEX_COLOR.test(v))) return `${key} debe ser un color hex (#RRGGBB)`
  }
  if (settings.fontFamily !== undefined && !(typeof settings.fontFamily === 'string' && /^[\w\s-]{1,40}$/.test(settings.fontFamily))) {
    return 'fontFamily inválido'
  }
  return null
}

/** Field-level validation (400s). Same messages and order the route always had. */
export function validatePageInput(input: PageWriteInput): string | null {
  const { blocks, settings, name, published } = input
  if (name !== undefined && (typeof name !== 'string' || !name.trim() || name.length > MAX_NAME)) return 'Nombre inválido'
  if (published !== undefined && typeof published !== 'boolean') return 'published debe ser boolean'
  if (blocks !== undefined) { const err = validateBlocks(blocks); if (err) return err }
  if (settings !== undefined) { const err = validateSettings(settings); if (err) return err }
  return null
}

/** Free plans may only use the free block types. */
export function checkPlanBlocks(plan: Plan, blocks: Block[]): string | null {
  if (PLAN_LIMITS[plan].advancedBlocks) return null
  const locked = blocks.find(b => blockRequiresPro(b.type))
  return locked ? `El bloque "${locked.type}" requiere plan Pro` : null
}

// Staged rollout: a customer can't ADD a block type whose feature isn't enabled
// for them. Types the page already had stay editable, so turning a flag off
// never locks anyone out of their page.
export function checkFlagBlocks(blocks: Block[], flags: FlagMap, existing: Block[]): string | null {
  const had = new Set(existing.map(b => b.type))
  const blocked = blocks.find(b => { const f = BLOCK_FLAG[b.type]; return f && !flags[f] && !had.has(b.type) })
  return blocked ? 'Esta función todavía no está disponible para tu cuenta' : null
}

/** Unsafe URL schemes (javascript:, data:...) are stripped before persisting. */
export function buildPageUpdate(input: PageWriteInput): PageUpdate {
  const update: PageUpdate = {}
  if (input.blocks !== undefined) update.blocks = sanitizeBlocks(input.blocks as Block[])
  if (input.settings !== undefined) update.settings = sanitizeSettings(input.settings as Parameters<typeof sanitizeSettings>[0])
  if (input.name !== undefined) update.name = (input.name as string).trim()
  if (input.published !== undefined) update.published = input.published as boolean
  return update
}

/** Maps a database error from the UPDATE to the status/message the API returns. */
export function pageWriteError(error: { message?: string }): { status: 403 | 500; error: string } {
  const planLimit = !!error.message?.includes('plan_limit_exceeded')
  return { status: planLimit ? 403 : 500, error: planLimit ? 'Tu plan no permite este contenido' : 'No se pudo guardar' }
}

export interface PageWriteContext {
  /** Blocks currently stored (to know which block types the page already had). */
  existingBlocks: Block[]
  /** Lazy: only called when `blocks` is being written (same queries as before). */
  getPlan: () => Promise<Plan>
  getFlags: () => Promise<FlagMap>
}

/** The whole pipeline: field validation -> size -> plan -> flags -> sanitized update. */
export async function evaluatePageWrite(input: PageWriteInput, ctx: PageWriteContext): Promise<PageWriteResult> {
  const bad = validatePageInput(input)
  if (bad) return { ok: false, status: 400, error: bad }
  if (JSON.stringify({ b: input.blocks, s: input.settings }).length > MAX_BODY_BYTES) return { ok: false, status: 413, error: 'Payload demasiado grande' }
  if (input.blocks !== undefined) {
    const blocks = input.blocks as Block[]
    const locked = checkPlanBlocks(await ctx.getPlan(), blocks)
    if (locked) return { ok: false, status: 403, error: locked }
    const flagged = checkFlagBlocks(blocks, await ctx.getFlags(), ctx.existingBlocks)
    if (flagged) return { ok: false, status: 403, error: flagged }
  }
  return { ok: true, update: buildPageUpdate(input) }
}
