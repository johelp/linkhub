import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { getMercadoPagoAuthorizeUrl } from '@/lib/mercadopago'
import { absoluteUrl } from '@/lib/utils'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(absoluteUrl('/auth'))

  if (!process.env.MERCADOPAGO_CLIENT_ID) {
    return NextResponse.redirect(absoluteUrl('/dashboard/settings?mp=not_configured'))
  }

  const state = crypto.randomBytes(24).toString('hex')
  const cookieStore = await cookies()
  cookieStore.set('mp_oauth_state', state, {
    httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/',
  })

  const redirectUri = absoluteUrl('/api/connect/mercadopago/callback')
  return NextResponse.redirect(getMercadoPagoAuthorizeUrl(redirectUri, state))
}
