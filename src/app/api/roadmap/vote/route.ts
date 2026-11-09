import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isRoadmapKey } from '@/lib/roadmap'

// Cast or withdraw the signed-in customer's vote. Runs under the customer's own
// session, so row-level security guarantees they can only touch their votes.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { key?: unknown; voted?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }
  if (!isRoadmapKey(body.key) || typeof body.voted !== 'boolean') return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 })

  const table = supabase.from('roadmap_votes' as never)
  const { error } = body.voted
    ? await table.upsert({ user_id: user.id, item_key: body.key } as never, { onConflict: 'user_id,item_key', ignoreDuplicates: true })
    : await table.delete().eq('user_id' as never, user.id as never).eq('item_key' as never, body.key as never)
  if (error) {
    const limit = /limit_exceeded/.test(error.message)
    return NextResponse.json({ error: limit ? 'Puedes votar hasta 10 funciones. Quita alguna para votar otra.' : 'No se pudo guardar tu voto.' }, { status: limit ? 409 : 500 })
  }
  return NextResponse.json({ ok: true })
}
