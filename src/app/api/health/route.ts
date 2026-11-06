import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { appEnv } from '@/lib/env'

// For uptime monitors (UptimeRobot, Better Stack, Vercel checks). Public and
// deliberately boring: no secrets, no counts, no versions of dependencies.
export const dynamic = 'force-dynamic'

export async function GET() {
  let db = false
  try {
    const { error } = await createAdminClient().from('profiles').select('id', { head: true, count: 'estimated' }).limit(1)
    db = !error
  } catch { db = false }
  return NextResponse.json(
    { status: db ? 'ok' : 'degraded', env: appEnv(), commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? 'local').slice(0, 7), db },
    { status: db ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
  )
}
