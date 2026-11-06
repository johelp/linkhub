import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { safeNextPath } from '@/lib/security'
import { classifyAuthFailure } from '@/lib/authErrors'

// Alternative landing point that does NOT depend on the browser that asked for
// the link: the email carries a one-time `token_hash` and we verify it here.
// Use it from the Supabase email templates
// ({{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink) when
// links get opened in another browser (mail apps' in-app browsers).
const TYPES: EmailOtpType[] = ['magiclink', 'email', 'signup', 'invite', 'recovery', 'email_change']

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = safeNextPath(searchParams.get('next'))
  if (!tokenHash || !type || !TYPES.includes(type)) return NextResponse.redirect(`${origin}/auth?error=callback`)
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(`${origin}${next}`)
    return NextResponse.redirect(`${origin}/auth?error=${classifyAuthFailure({ message: error.message })}`)
  } catch {
    return NextResponse.redirect(`${origin}/auth?error=config`)
  }
}
