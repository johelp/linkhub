import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { safeNextPath } from '@/lib/security'
import { classifyAuthFailure } from '@/lib/authErrors'
import { reportError } from '@/lib/observability'

// Landing point of the sign-in link (PKCE flow). Supabase redirects here with
// `?code=` on success, or with `?error=...&error_code=...` when the link is
// expired/used. Every failure goes back to /auth with a specific reason.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'))
  const fail = (reason: string) => NextResponse.redirect(`${origin}/auth?error=${reason}`)

  const upstream = searchParams.get('error')
  if (upstream) return fail(classifyAuthFailure({ error: upstream, errorCode: searchParams.get('error_code'), description: searchParams.get('error_description') }))
  if (!code) return fail('callback')

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
    const reason = classifyAuthFailure({ message: error.message })
    if (reason === 'callback') await reportError('auth:callback', error.message)   // unknown failure: worth a look
    return fail(reason)
  } catch (err) {
    await reportError('auth:callback', err)
    return fail('config')
  }
}
