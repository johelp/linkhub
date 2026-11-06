import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFlagsForUser } from '@/lib/flags.server'
import { MAX_KEYS_PER_ACCOUNT, generateApiKey, validateKeyInput } from '@/lib/mcp/apiKeys'

// Dashboard backend for /dashboard/developers: create and revoke API keys.
// Session-authenticated (cookies) and run under the customer's own RLS, so a
// customer can only ever touch their own rows. The secret is returned ONCE.

// Cookie-authenticated + state-changing: refuse cross-site browser requests.
function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return true // non-browser client
  try { return new URL(origin).host === req.headers.get('host') } catch { return false }
}

async function session() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 })
  const { supabase, user } = await session()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await getFlagsForUser(user.id, user.email)).developer_api) return NextResponse.json({ error: 'La API para desarrolladores todavía no está disponible para tu cuenta' }, { status: 403 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }
  const v = validateKeyInput(body)
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 })

  const { count } = await supabase.from('api_keys' as never).select('id', { count: 'exact', head: true }).eq('user_id' as never, user.id as never).is('revoked_at' as never, null as never)
  if ((count ?? 0) >= MAX_KEYS_PER_ACCOUNT) return NextResponse.json({ error: `Máximo ${MAX_KEYS_PER_ACCOUNT} claves activas: revoca alguna antes de crear otra` }, { status: 409 })

  const k = generateApiKey()
  const { error } = await supabase.from('api_keys' as never).insert({
    user_id: user.id, name: v.value.name, key_prefix: k.prefix, key_hash: k.hash, scopes: v.value.scopes, expires_at: v.value.expiresAt,
  } as never)
  if (error) {
    console.error('api key insert failed', error)
    return NextResponse.json({ error: String(error.message).includes('limit_exceeded') ? 'Has alcanzado el máximo de claves activas' : 'No se pudo crear la clave' }, { status: 500 })
  }
  // The only time the secret leaves the server.
  return NextResponse.json({ key: k.key, prefix: k.prefix }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 })
  const { supabase, user } = await session()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = new URL(request.url).searchParams.get('id')
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const { error } = await supabase.from('api_keys' as never).update({ revoked_at: new Date().toISOString() } as never)
    .eq('id' as never, id as never).eq('user_id' as never, user.id as never).is('revoked_at' as never, null as never)
  if (error) {
    console.error('api key revoke failed', error)
    return NextResponse.json({ error: 'No se pudo revocar' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
