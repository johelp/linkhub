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

  // Conditional update -- only flips status if it's still 'issued'. This is
  // what makes double-scans (two staff scanning the same ticket at once)
  // safe: whichever request's UPDATE actually matches the WHERE clause wins,
  // the other gets zero rows back and reports "already used".
  const { data: updated } = await supabase
    .from('tickets')
    .update({ status: 'used', used_at: new Date().toISOString() })
    .eq('page_id', pageId)
    .eq('code', code.trim())
    .eq('status', 'issued')
    .select('tier_name, buyer_email')
    .single()

  if (updated) {
    return NextResponse.json({ ok: true, tier_name: updated.tier_name, buyer_email: updated.buyer_email })
  }

  // Distinguish "doesn't exist" from "already used" for a clearer message.
  const { data: existing } = await supabase
    .from('tickets')
    .select('status, tier_name')
    .eq('page_id', pageId)
    .eq('code', code.trim())
    .single()

  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ error: 'already_used', tier_name: existing.tier_name }, { status: 409 })
}
