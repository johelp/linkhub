import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, audit } from '@/lib/admin.server'
import { isAdminEmail } from '@/lib/admin'

// Suspend = ban the login (Supabase Auth) and take the customer's pages offline
// (marked as moderated so they can't re-publish). Reversible.
export async function POST(request: NextRequest) {
  const a = await requireAdmin()
  if ('error' in a) return a.error
  const { userId, suspended } = await request.json().catch(() => ({})) as { userId?: string; suspended?: boolean }
  if (!userId || typeof suspended !== 'boolean') return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  const { data: profile } = await a.admin.from('profiles').select('email').eq('id', userId).maybeSingle()
  if (!profile) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  if (isAdminEmail(profile.email)) return NextResponse.json({ error: 'No se puede suspender a un administrador' }, { status: 400 })

  const { error } = await a.admin.auth.admin.updateUserById(userId, { ban_duration: suspended ? '876000h' : 'none' })
  if (error) { console.error('suspend error', error); return NextResponse.json({ error: 'No se pudo cambiar el estado' }, { status: 500 }) }
  if (suspended) await a.admin.from('pages').update({ published: false, moderated_at: new Date().toISOString() } as never).eq('user_id', userId)
  await audit(a.admin, a.email, suspended ? 'user.suspend' : 'user.unsuspend', profile.email)
  return NextResponse.json({ ok: true })
}
