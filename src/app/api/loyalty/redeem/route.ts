import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Page, LoyaltyCardBlock } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pageId, code } = await request.json()
  if (!pageId || !code) return NextResponse.json({ error: 'pageId and code required' }, { status: 400 })

  const { data: page } = await supabase.from('pages').select('id, user_id, blocks').eq('id', pageId).single()
  if (!page || page.user_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('id, block_id, stamps_count')
    .eq('page_id', pageId)
    .eq('code', code.trim())
    .single()
  if (!card) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const block = (page.blocks as unknown as Page['blocks'])
    .find(b => b.id === card.block_id && b.type === 'loyalty_card') as LoyaltyCardBlock | undefined
  const targetStamps = block?.data.targetStamps ?? 10

  // The target lives on the block (edited from the page, not from here), so
  // this re-checks it server-side rather than trusting the dashboard's own
  // copy of the number -- same reasoning as never trusting a client-sent price.
  if (card.stamps_count < targetStamps) {
    return NextResponse.json({ error: 'not_enough_stamps' }, { status: 400 })
  }

  const { data: updated } = await supabase
    .from('loyalty_cards')
    .update({ stamps_count: 0, last_redeemed_at: new Date().toISOString() })
    .eq('id', card.id)
    .eq('stamps_count', card.stamps_count)
    .select('id')
    .single()

  if (!updated) return NextResponse.json({ error: 'conflict' }, { status: 409 })
  return NextResponse.json({ ok: true })
}
