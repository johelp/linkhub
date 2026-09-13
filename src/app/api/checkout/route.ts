import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { absoluteUrl } from '@/lib/utils'

// Endorsely referral IDs are UUIDs; this just guards against a malformed or
// tampered value, not a security boundary (worst case of a garbage value
// here is a rejected/ignored referral, never anything the payment itself
// depends on).
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

  // TODO(afiliados/Endorsely): referralId llega validado hasta acá pero
  // todavía no se reporta a Endorsely -- la forma real no es esto, es una
  // llamada server-to-server firmada con un API secret que solo existe una
  // vez que se crea la cuenta. No improvisarla acá: un endpoint o
  // parámetros equivocados fallarían en silencio y nunca se les pagaría
  // comisión a los afiliados, peor que no tener nada armado. Cuando exista
  // la cuenta, su dashboard da el snippet exacto para este punto (conectás
  // Stripe y te muestra la línea de código para el checkout) -- pegarlo tal
  // cual. Este log confirma mientras tanto que la captura del lado del
  // cliente (script + window.endorsely_referral) sí está llegando hasta acá.
  if (referralId) console.log('[endorsely] checkout iniciado con referral', referralId)

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
