import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Block, Plan } from '@/types'
import type { TablesUpdate } from '@/lib/supabase/database.types'
import { getFlagsForUser } from '@/lib/flags.server'
// Validation, plan limits, flags and sanitizers live in lib/pageWrite.ts so the
// MCP server and this route share exactly the same rules.
import { MAX_BODY_BYTES, evaluatePageWrite, isObject, pageWriteError, validatePageInput } from '@/lib/pageWrite'

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
  const inputError = validatePageInput({ name, published, blocks, settings })
  if (inputError) return NextResponse.json({ error: inputError }, { status: 400 })

  // Verify ownership
  const { data: page } = await supabase
    .from('pages')
    .select('id, user_id, blocks')
    .eq('id', pageId)
    .single()

  if (!page || page.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Plan limits, staged-rollout flags and sanitizers (shared with the MCP server).
  const result = await evaluatePageWrite({ blocks, settings, name, published }, {
    existingBlocks: (page.blocks as unknown as Block[]) ?? [],
    getPlan: async () => ((await supabase.from('profiles').select('plan').eq('id', user.id).single()).data?.plan || 'free') as Plan,
    getFlags: () => getFlagsForUser(user.id, user.email),
  })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  const update = result.update as TablesUpdate<'pages'>

  const { error } = await supabase
    .from('pages')
    .update(update)
    .eq('id', pageId)

  if (error) {
    console.error('pages PATCH error', error)
    const mapped = pageWriteError(error)
    return NextResponse.json({ error: mapped.error }, { status: mapped.status })
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
