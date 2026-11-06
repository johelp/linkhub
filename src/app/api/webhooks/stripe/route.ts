import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { LAPSE_STATUSES } from '@/lib/billing'

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
          await setLapse(supabase, { userId }, false)
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
        // A failed payment (not a voluntary cancellation) starts the lapse clock;
        // a cancellation that follows a failed payment keeps it running.
        const { data: before } = await supabase.from('profiles').select('stripe_subscription_status').eq('stripe_customer_id', customerId).maybeSingle()
        const lapsed = LAPSE_STATUSES.has(subscription.status) || (event.type === 'customer.subscription.deleted' && LAPSE_STATUSES.has(before?.stripe_subscription_status ?? ''))
        await supabase.from('profiles').update({
          plan: isActive ? 'pro' : 'free',
          stripe_subscription_status: subscription.status,
        }).eq('stripe_customer_id', customerId)
        await setLapse(supabase, { customerId }, lapsed)
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

// Starts (once) or clears the lapse clock, then refreshes the owner's cached
// public pages so the pause / reactivation shows up immediately, not after ISR.
async function setLapse(db: ReturnType<typeof createAdminClient>, who: { userId?: string; customerId?: string }, lapsed: boolean) {
  try {
    let q = db.from('profiles').select('id, billing_lapsed_at')
    q = who.userId ? q.eq('id', who.userId) : q.eq('stripe_customer_id', who.customerId!)
    const { data: p } = await q.maybeSingle()
    if (!p) return
    const row = p as { id: string; billing_lapsed_at: string | null }
    if (lapsed && !row.billing_lapsed_at) await db.from('profiles').update({ billing_lapsed_at: new Date().toISOString() }).eq('id', row.id)
    if (!lapsed && row.billing_lapsed_at) await db.from('profiles').update({ billing_lapsed_at: null }).eq('id', row.id)
    const { data: pages } = await db.from('pages').select('slug').eq('user_id', row.id)
    for (const pg of pages ?? []) revalidatePath(`/p/${pg.slug}`)
  } catch (err) { console.error('setLapse failed (migration 017 pending?)', err) }
}
