import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'

// Admin-only: publish/unpublish any page on the platform (basic moderation
// -- e.g. taking down something reported, without needing the owner's
// cooperation). Re-checks the caller is an admin server-side on every call,
// same reasoning as /api/admin/set-plan. Uses the service-role client since
// this acts on a page that isn't the caller's own (RLS would block it).
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { pageId, published } = body as { pageId?: string; published?: boolean }
  if (!pageId || typeof published !== 'boolean') {
    return NextResponse.json({ error: 'pageId y published (boolean) son requeridos' }, { status: 400 })
  }

  const admin = createAdminClient()
  // Unpublishing from here is moderation: it also blocks the owner from
  // re-publishing (migration 013). Publishing again clears the block.
  let { error } = await admin.from('pages').update({ published, moderated_at: published ? null : new Date().toISOString() } as never).eq('id', pageId)
  // Column missing (migration 013 not applied yet): fall back to the plain toggle.
  if (error && (error.code === '42703' || error.code === 'PGRST204')) {
    ;({ error } = await admin.from('pages').update({ published }).eq('id', pageId))
  }

  if (error) {
    console.error('admin toggle-page error', error)
    return NextResponse.json({ error: 'No se pudo actualizar la página' }, { status: 500 })
  }

  await admin.from('admin_audit_log' as never).insert({ actor_email: user.email, action: published ? 'page.publish' : 'page.unpublish', target: pageId } as never)
  return NextResponse.json({ ok: true })
}
