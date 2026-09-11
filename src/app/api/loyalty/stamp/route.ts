import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pageId, code } = await request.json()
  if (!pageId || !code) return NextResponse.json({ error: 'pageId and code required' }, { status: 400 })

  const { data: page } = await supabase.from('pages').select('id, user_id').eq('id', pageId).single()
  if (!page || page.user_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('id, stamps_count')
    .eq('page_id', pageId)
    .eq('code', code.trim())
    .single()
  if (!card) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // Optimistic-concurrency update -- only takes effect if stamps_count hasn't
  // moved since the read above. Whichever of two simultaneous scans wins the
  // race gets the real new count back; the other gets null and just retries,
  // same principle as the conditional ticket-validation update.
  const { data: updated } = await supabase
    .from('loyalty_cards')
    .update({ stamps_count: card.stamps_count + 1 })
    .eq('id', card.id)
    .eq('stamps_count', card.stamps_count)
    .select('stamps_count')
    .single()

  if (!updated) return NextResponse.json({ error: 'conflict' }, { status: 409 })
  return NextResponse.json({ ok: true, stamps_count: updated.stamps_count })
}
