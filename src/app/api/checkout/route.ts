import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { absoluteUrl } from '@/lib/utils'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const priceId = process.env.STRIPE_PRICE_ID_PRO
  if (!priceId) {
    return NextResponse.json({ error: 'Pagos no configurados todavía' }, { status: 503 })
  }

  const { data: profile } = await supabase
    .from('profiles').select('plan, stripe_customer_id').eq('id', user.id).single()

  if (profile?.plan === 'pro') {
    return NextResponse.json({ error: 'Ya tenés el plan Pro' }, { status: 400 })
  }

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      customer: profile?.stripe_customer_id || undefined,
      customer_email: profile?.stripe_customer_id ? undefined : (user.email ?? undefined),
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
