import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { absoluteUrl } from '@/lib/utils'

// Stripe Connect (Standard) OAuth: the seller authorises LinkHub on THEIR
// Stripe account; money goes straight to them. Needs STRIPE_CONNECT_CLIENT_ID
// (Stripe Dashboard → Settings → Connect → Onboarding options → OAuth).
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(absoluteUrl('/auth'))
  if (!process.env.STRIPE_CONNECT_CLIENT_ID || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.redirect(absoluteUrl('/dashboard/payments?result=not_configured&provider=stripe'))
  }
  const state = crypto.randomBytes(24).toString('hex')
  ;(await cookies()).set('stripe_oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/' })
  const params = new URLSearchParams({
    response_type: 'code', client_id: process.env.STRIPE_CONNECT_CLIENT_ID, scope: 'read_write', state,
    redirect_uri: absoluteUrl('/api/connect/stripe/callback'),
  })
  return NextResponse.redirect(`https://connect.stripe.com/oauth/authorize?${params}`)
}
