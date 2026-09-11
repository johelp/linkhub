import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLAN_LIMITS, blockRequiresPro, type Block, type Plan } from '@/types'
import type { TablesUpdate } from '@/lib/supabase/database.types'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pageId, blocks, settings, name, published } = await request.json()
  if (!pageId) return NextResponse.json({ error: 'pageId required' }, { status: 400 })

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
  if (blocks !== undefined) update.blocks = blocks
  if (settings !== undefined) update.settings = settings
  if (name !== undefined) update.name = name
  if (published !== undefined) update.published = published

  const { error } = await supabase
    .from('pages')
    .update(update)
    .eq('id', pageId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
