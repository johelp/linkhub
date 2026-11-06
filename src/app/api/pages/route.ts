import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLAN_LIMITS, blockRequiresPro, type Block, type Plan } from '@/types'
import type { TablesUpdate, Json } from '@/lib/supabase/database.types'
import { HEX_COLOR, sanitizeBlocks } from '@/lib/security'

const MAX_BLOCKS = 100
const MAX_BODY_BYTES = 512 * 1024
const MAX_NAME = 80

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

// Server-side shape check: the editor is just one client of this endpoint,
// so nothing it sends is trusted. Returns an error string or null.
function validateBlocks(blocks: unknown): string | null {
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

function validateSettings(settings: unknown): string | null {
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

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ error: 'Payload demasiado grande' }, { status: 413 })
  let body: Record<string, unknown>
  try {
    const parsed = JSON.parse(raw)
    if (!isObject(parsed)) throw new Error()
    body = parsed
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { pageId, blocks, settings, name, published } = body
  if (typeof pageId !== 'string' || !pageId) return NextResponse.json({ error: 'pageId required' }, { status: 400 })
  if (name !== undefined && (typeof name !== 'string' || !name.trim() || name.length > MAX_NAME)) {
    return NextResponse.json({ error: 'Nombre inválido' }, { status: 400 })
  }
  if (published !== undefined && typeof published !== 'boolean') {
    return NextResponse.json({ error: 'published debe ser boolean' }, { status: 400 })
  }
  if (blocks !== undefined) {
    const err = validateBlocks(blocks)
    if (err) return NextResponse.json({ error: err }, { status: 400 })
  }
  if (settings !== undefined) {
    const err = validateSettings(settings)
    if (err) return NextResponse.json({ error: err }, { status: 400 })
  }

  // Verify ownership
  const { data: page } = await supabase
    .from('pages')
    .select('id, user_id')
    .eq('id', pageId)
    .single()

  if (!page || page.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (blocks !== undefined) {
    const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
    const plan = (profile?.plan || 'free') as Plan
    const limits = PLAN_LIMITS[plan]
    if (!limits.advancedBlocks) {
      const lockedBlock = (blocks as Block[]).find(b => blockRequiresPro(b.type))
      if (lockedBlock) {
        return NextResponse.json({ error: `El bloque "${lockedBlock.type}" requiere plan Pro` }, { status: 403 })
      }
    }
  }

  const update: TablesUpdate<'pages'> = {}
  // Unsafe URL schemes (javascript:, data:...) are stripped before persisting.
  if (blocks !== undefined) update.blocks = sanitizeBlocks(blocks as Block[]) as unknown as Json
  if (settings !== undefined) update.settings = settings as Json
  if (name !== undefined) update.name = (name as string).trim()
  if (published !== undefined) update.published = published

  const { error } = await supabase
    .from('pages')
    .update(update)
    .eq('id', pageId)

  if (error) {
    console.error('pages PATCH error', error)
    const planLimit = error.message?.includes('plan_limit_exceeded')
    return NextResponse.json(
      { error: planLimit ? 'Tu plan no permite este contenido' : 'No se pudo guardar' },
      { status: planLimit ? 403 : 500 }
    )
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const pageId = searchParams.get('pageId')
  if (!pageId) return NextResponse.json({ error: 'pageId required' }, { status: 400 })

  const { error } = await supabase
    .from('pages')
    .delete()
    .eq('id', pageId)
    .eq('user_id', user.id)

  if (error) {
    console.error('pages DELETE error', error)
    return NextResponse.json({ error: 'No se pudo eliminar' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
