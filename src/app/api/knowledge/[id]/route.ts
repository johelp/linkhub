import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateEntry } from '@/lib/knowledge'
import { refreshPublicPages } from '@/lib/knowledge.server'
import type { TablesUpdate } from '@/lib/supabase/database.types'

const UUID = /^[0-9a-f-]{36}$/i

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID.test(id)) return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await request.json().catch(() => ({})) as Record<string, unknown>
  const patch: TablesUpdate<'knowledge_entries'> = {}
  if ('title' in b || 'content' in b) {
    const problem = validateEntry({ title: b.title, content: b.content, kind: b.kind, visibility: b.visibility })
    if (problem) return NextResponse.json({ error: problem }, { status: 400 })
    patch.title = (b.title as string).trim(); patch.content = (b.content as string).trim()
  }
  if (b.kind !== undefined) patch.kind = b.kind as 'faq' | 'info' | 'policy'
  if (b.visibility !== undefined) patch.visibility = b.visibility as 'public' | 'private'
  if (typeof b.position === 'number') patch.position = Math.round(b.position)
  if (b.page_id !== undefined) {
    if (b.page_id === null || b.page_id === '') patch.page_id = null
    else {
      const { data: page } = await supabase.from('pages').select('id').eq('id', b.page_id as string).eq('user_id', user.id).maybeSingle()
      if (!page) return NextResponse.json({ error: 'Página no encontrada' }, { status: 404 })
      patch.page_id = page.id
    }
  }
  const { error } = await supabase.from('knowledge_entries').update(patch).eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 })
  await refreshPublicPages(supabase, user.id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID.test(id)) return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { error } = await supabase.from('knowledge_entries').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: 'No se pudo eliminar' }, { status: 500 })
  await refreshPublicPages(supabase, user.id)
  return NextResponse.json({ ok: true })
}
