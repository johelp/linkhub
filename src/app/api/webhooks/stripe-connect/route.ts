import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { approvePayment, markPayment } from '@/lib/payments/fulfil'
import { logPaymentEvent } from '@/lib/payments/events'

// Events from sellers' connected accounts (Stripe Dashboard → Developers →
// Webhooks → "Listen to events on Connected accounts"). Separate endpoint and
// secret from the platform-billing webhook (/api/webhooks/stripe).
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook no configurado' }, { status: 503 })
  const sig = request.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Falta la firma' }, { status: 400 })

  let event: Stripe.Event
  try { event = getStripe().webhooks.constructEvent(await request.text(), sig, secret) }
  catch { return NextResponse.json({ error: 'Firma inválida' }, { status: 400 }) }

  if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.expired' && event.type !== 'checkout.session.async_payment_succeeded' && event.type !== 'checkout.session.async_payment_failed') {
    return NextResponse.json({ received: true })
  }
  const session = event.data.object as Stripe.Checkout.Session
  const paymentId = session.metadata?.payment_id ?? session.client_reference_id
  if (!paymentId || !event.account) return NextResponse.json({ received: true })

  const admin = createAdminClient()
  const { dup } = await claimEvent(admin, event.id)
  if (dup) return NextResponse.json({ received: true, duplicate: true })

  try {
    const { data: payment } = await admin.from('payments').select('id, page_id, status, tier_id, tier_name, provider, provider_preference_id').eq('id', paymentId).maybeSingle()
    if (!payment || payment.provider !== 'stripe' || payment.provider_preference_id !== session.id) return NextResponse.json({ received: true })
    const { data: page } = await admin.from('pages').select('user_id, name').eq('id', payment.page_id).single()
    if (!page) return NextResponse.json({ received: true })
    // The event must come from the seller's own connected account.
    const { data: conn } = await admin.from('payment_connections').select('provider_user_id').eq('user_id', page.user_id).eq('provider', 'stripe').maybeSingle()
    if (!conn || conn.provider_user_id !== event.account) {
      await logPaymentEvent(admin, { paymentId: payment.id, pageId: payment.page_id, provider: 'stripe', type: 'notification.invalid', level: 'error', message: 'El evento no pertenece a la cuenta conectada del vendedor' })
      return NextResponse.json({ error: 'Account mismatch' }, { status: 400 })
    }
    await logPaymentEvent(admin, { paymentId: payment.id, pageId: payment.page_id, provider: 'stripe', type: 'notification.received', message: event.type, detail: { eventId: event.id, paymentStatus: session.payment_status } })

    if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
      if (payment.status !== 'approved') await markPayment(admin, payment.id, 'rejected', payment.page_id)
    } else if (session.payment_status === 'paid') {
      await approvePayment(admin, payment, {
        providerPaymentId: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
        payerEmail: session.customer_details?.email ?? null, pageName: page.name,
      })
    }
  } catch (err) {
    console.error('stripe-connect webhook error', err)
    await admin.from('processed_webhook_events' as never).delete().eq('id' as never, event.id as never)
    return NextResponse.json({ error: 'Error procesando el evento' }, { status: 500 })
  }
  return NextResponse.json({ received: true })
}

// Same idempotency scheme as the platform webhook (migration 013); fails open
// if the table doesn't exist yet.
async function claimEvent(admin: ReturnType<typeof createAdminClient>, id: string) {
  const { error } = await admin.from('processed_webhook_events' as never).insert({ id, provider: 'stripe-connect' } as never)
  return { dup: (error as { code?: string } | null)?.code === '23505' }
}
