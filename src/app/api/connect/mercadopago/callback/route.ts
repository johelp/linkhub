import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { exchangeMercadoPagoCode } from '@/lib/mercadopago'
import { absoluteUrl } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(absoluteUrl('/auth'))

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const cookieStore = await cookies()
  const expectedState = cookieStore.get('mp_oauth_state')?.value
  cookieStore.delete('mp_oauth_state')

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(absoluteUrl('/dashboard/settings?mp=error'))
  }

  try {
    const redirectUri = absoluteUrl('/api/connect/mercadopago/callback')
    const token = await exchangeMercadoPagoCode(code, redirectUri)

    const admin = createAdminClient()
    const { error } = await admin.from('payment_connections').upsert({
      user_id: user.id,
      provider: 'mercadopago',
      provider_user_id: String(token.user_id),
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      public_key: token.public_key,
      live_mode: token.live_mode,
    }, { onConflict: 'user_id,provider' })
    if (error) throw error

    return NextResponse.redirect(absoluteUrl('/dashboard/settings?mp=connected'))
  } catch (err) {
    console.error('Mercado Pago OAuth callback error', err)
    return NextResponse.redirect(absoluteUrl('/dashboard/settings?mp=error'))
  }
}
