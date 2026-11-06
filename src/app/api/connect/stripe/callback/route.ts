import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { absoluteUrl } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(absoluteUrl('/auth'))

  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const jar = await cookies()
  const expected = jar.get('stripe_oauth_state')?.value
  jar.delete('stripe_oauth_state')
  const back = (r: string) => NextResponse.redirect(absoluteUrl(`/dashboard/payments?result=${r}&provider=stripe`))
  if (!code || !state || !expected || state !== expected) return back('error')

  try {
    const token = await getStripe().oauth.token({ grant_type: 'authorization_code', code })
    if (!token.stripe_user_id) throw new Error('no account id')
    // Direct charges use the platform key + the connected account id, so no
    // seller token is stored. access_token/refresh_token are NOT NULL columns.
    const { error } = await createAdminClient().from('payment_connections').upsert({
      user_id: user.id, provider: 'stripe', provider_user_id: token.stripe_user_id,
      access_token: 'connect', refresh_token: 'connect', live_mode: !!token.livemode,
    }, { onConflict: 'user_id,provider' })
    if (error) throw error
    return back('connected')
  } catch (err) {
    console.error('Stripe Connect callback error', err)
    return back('error')
  }
}
