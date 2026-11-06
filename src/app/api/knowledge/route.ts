import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateEntry } from '@/lib/knowledge'
import { refreshPublicPages } from '@/lib/knowledge.server'

// Owner's knowledge base. RLS (migration 019) already restricts every row to
// its owner; the checks here give friendly errors and validate page scope.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase.from('knowledge_entries').select('*').order('position')
  if (error) return NextResponse.json({ error: 'No se pudo cargar' }, { status: 500 })
  return NextResponse.json({ entries: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await request.json().catch(() => ({})) as Record<string, unknown>
  const problem = validateEntry(b)
  if (problem) return NextResponse.json({ error: problem }, { status: 400 })

  let pageId: string | null = null
  if (typeof b.page_id === 'string' && b.page_id) {
    const { data: page } = await supabase.from('pages').select('id').eq('id', b.page_id).eq('user_id', user.id).maybeSingle()
    if (!page) return NextResponse.json({ error: 'Página no encontrada' }, { status: 404 })
    pageId = page.id
  }
  const { data: last } = await supabase.from('knowledge_entries').select('position').order('position', { ascending: false }).limit(1).maybeSingle()
  const { data, error } = await supabase.from('knowledge_entries').insert({
    user_id: user.id, page_id: pageId, kind: (b.kind as 'faq' | 'info' | 'policy') ?? 'faq', title: (b.title as string).trim(), content: (b.content as string).trim(),
    visibility: (b.visibility as 'public' | 'private') ?? 'public', position: (last?.position ?? 0) + 1,
  }).select('*').single()
  if (error) {
    const limit = error.message?.includes('limit_exceeded')
    return NextResponse.json({ error: limit ? 'Has llegado al máximo de 300 entradas' : 'No se pudo guardar' }, { status: limit ? 403 : 500 })
  }
  await refreshPublicPages(supabase, user.id)
  return NextResponse.json({ entry: data }, { status: 201 })
}

