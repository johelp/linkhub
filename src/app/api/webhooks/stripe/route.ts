import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

// Subscription statuses that mean "this user should have Pro access".
const ACTIVE_STATUSES = new Set(['active', 'trialing'])

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook no configurado' }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Falta la firma' }, { status: 400 })

  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature verification failed', err)
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Idempotency: Stripe retries deliveries, and events can arrive twice. The
  // unique primary key on event id makes the second delivery a no-op. If the
  // table isn't there yet (migration 013 pending) we fail open, as before.
  const { error: dupError } = await supabase.from('processed_webhook_events' as never).insert({ id: event.id, provider: 'stripe' } as never)
  if (dupError) {
    if ((dupError as { code?: string }).code === '23505') return NextResponse.json({ received: true, duplicate: true })
    if ((dupError as { code?: string }).code !== '42P01') console.error('webhook idempotency check failed', dupError)
  }

  try {
    switch (event.type) {
      // First payment confirmed — activate Pro and remember the Stripe IDs
      // so future subscription-lifecycle events can find this profile.
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
        if (userId && customerId) {
          await supabase.from('profiles').update({
            plan: 'pro',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId ?? null,
            stripe_subscription_status: 'active',
          }).eq('id', userId)
        }
        break
      }

      // Renewals, upgrades/downgrades, payment failures, cancellations —
      // Stripe is the source of truth for status; mirror it onto the profile.
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
        const isActive = event.type === 'customer.subscription.updated' && ACTIVE_STATUSES.has(subscription.status)
        await supabase.from('profiles').update({
          plan: isActive ? 'pro' : 'free',
          stripe_subscription_status: subscription.status,
        }).eq('stripe_customer_id', customerId)
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('Stripe webhook handler error', err)
    // Release the idempotency key so Stripe's retry is processed, not skipped.
    await supabase.from('processed_webhook_events' as never).delete().eq('id' as never, event.id as never)
    return NextResponse.json({ error: 'Error procesando el evento' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
