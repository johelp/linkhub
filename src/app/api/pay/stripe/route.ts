import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { resolvePayable, validMoney, toMinorUnits } from '@/lib/payments/payable'
import { absoluteUrl } from '@/lib/utils'

// Stripe Checkout as a *direct charge* on the seller's connected account.
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const pageId = sp.get('pageId'), blockId = sp.get('blockId')
  if (!pageId || !blockId) return new NextResponse('Falta información para iniciar el pago.', { status: 400 })

  const { payable } = await resolvePayable(await createClient(), { pageId, blockId, tierId: sp.get('tierId') })
  if (!payable) return new NextResponse('Producto no disponible.', { status: 404 })
  const slug = payable.page.slug
  const fail = (r: string) => NextResponse.redirect(absoluteUrl(`/p/${slug}?payment_error=${r}`))
  if (!validMoney(payable.price, payable.currency)) return fail('failed')

  const admin = createAdminClient()
  const { data: conn } = await admin.from('payment_connections').select('provider_user_id').eq('user_id', payable.page.user_id).eq('provider', 'stripe').maybeSingle()
  if (!conn) return fail('not_configured')

  const { data: row, error: insertError } = await admin.from('payments').insert({
    page_id: pageId, block_id: blockId, provider: 'stripe', status: 'pending', amount: payable.price, currency: payable.currency,
    tier_id: payable.tier?.id ?? null, tier_name: payable.tier?.name ?? null,
  }).select('id').single()
  if (insertError || !row) return fail('failed')

  const feePct = Math.min(Math.max(Number(process.env.STRIPE_PLATFORM_FEE_PERCENT) || 0, 0), 100)
  const minor = toMinorUnits(payable.price, payable.currency)
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [{ quantity: 1, price_data: { currency: payable.currency.toLowerCase(), unit_amount: minor, product_data: { name: payable.title.slice(0, 120) } } }],
      client_reference_id: row.id,
      metadata: { payment_id: row.id },
      payment_intent_data: { metadata: { payment_id: row.id }, ...(feePct > 0 ? { application_fee_amount: Math.round(minor * feePct / 100) } : {}) },
      success_url: absoluteUrl(`/p/${slug}?paid=1`),
      cancel_url: absoluteUrl(`/p/${slug}`),
    }, { stripeAccount: conn.provider_user_id })
    if (!session.url) throw new Error('no checkout url')
    await admin.from('payments').update({ provider_preference_id: session.id }).eq('id', row.id)
    return NextResponse.redirect(session.url)
  } catch (err) {
    console.error('Stripe checkout error', err)
    return fail('failed')
  }
}
