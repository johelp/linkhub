import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { absoluteUrl } from '@/lib/utils'

// Rewardful click IDs are UUIDs; this just guards against a malformed or
// tampered value reaching the Stripe API, not a security boundary (worst
// case of a garbage value here is a rejected/ignored referral, never
// anything the payment itself depends on).
const REFERRAL_ID_RE = /^[a-zA-Z0-9-]{1,64}$/

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const priceId = process.env.STRIPE_PRICE_ID_PRO
  if (!priceId) {
    return NextResponse.json({ error: 'Pagos no configurados todavía' }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const referralId = typeof body?.referralId === 'string' && REFERRAL_ID_RE.test(body.referralId) ? body.referralId : undefined

  const { data: profile } = await supabase
    .from('profiles').select('plan, stripe_customer_id').eq('id', user.id).single()

  if (profile?.plan === 'pro') {
    return NextResponse.json({ error: 'Ya tenés el plan Pro' }, { status: 400 })
  }

  try {
    const stripe = getStripe()

    // Rewardful (programa de afiliados, ver SETUP.md) reads the referral off
    // the Stripe *customer's* metadata -- not the Checkout Session, which
    // already uses client_reference_id for our own user id. When there's no
    // Stripe customer yet, create one explicitly (instead of letting
    // Checkout auto-create it from customer_email) so the metadata has
    // somewhere to land before the session exists.
    let customerId = profile?.stripe_customer_id || undefined
    if (referralId) {
      if (customerId) {
        await stripe.customers.update(customerId, { metadata: { referral: referralId } })
      } else {
        const customer = await stripe.customers.create({ email: user.email ?? undefined, metadata: { referral: referralId } })
        customerId = customer.id
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      customer: customerId,
      customer_email: customerId ? undefined : (user.email ?? undefined),
      success_url: absoluteUrl('/dashboard/upgrade?checkout=success'),
      cancel_url: absoluteUrl('/dashboard/upgrade?checkout=cancelled'),
    })
    if (!session.url) throw new Error('Stripe no devolvió una URL de checkout')
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error', err)
    return NextResponse.json({ error: 'No se pudo iniciar el pago' }, { status: 500 })
  }
}
