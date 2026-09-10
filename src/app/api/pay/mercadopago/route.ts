import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createMercadoPagoPreference } from '@/lib/mercadopago'
import { absoluteUrl } from '@/lib/utils'
import type { Page, PaymentButtonBlock, EventTicketsBlock } from '@/types'

// Public route: a visitor clicks a "payment_button" or "event_tickets"
// block on a published page and lands here. Creates a fresh Mercado Pago
// preference for that block/tier's *current* price (never a stale
// pre-generated link) and redirects to Checkout Pro. No auth -- buyers
// aren't LinkHub users. Price and title always come from the page's own
// stored blocks (authored by the page owner), never from query params, so
// a visitor can't manipulate what they're charged.
export async function GET(request: NextRequest) {
  const pageId = request.nextUrl.searchParams.get('pageId')
  const blockId = request.nextUrl.searchParams.get('blockId')
  const tierId = request.nextUrl.searchParams.get('tierId')
  if (!pageId || !blockId) {
    return NextResponse.json({ error: 'pageId and blockId required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: page } = await supabase.from('pages').select('*').eq('id', pageId).eq('published', true).single()
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const typedPage = page as unknown as Page
  const block = typedPage.blocks.find(b => b.id === blockId && (b.type === 'payment_button' || b.type === 'event_tickets'))
  if (!block) return NextResponse.json({ error: 'Block not found' }, { status: 404 })

  let title: string
  let price: number
  let currency: string
  let tier: { id: string; name: string } | null = null

  if (block.type === 'payment_button') {
    const b = block as PaymentButtonBlock
    const t = b.data.translations[typedPage.settings.defaultLang] || b.data.translations['es']
    title = t?.title || typedPage.name
    price = b.data.price
    currency = b.data.currency
  } else {
    const b = block as EventTicketsBlock
    const found = b.data.tiers.find(x => x.id === tierId)
    if (!found) return NextResponse.json({ error: 'tierId required' }, { status: 400 })
    const t = b.data.translations[typedPage.settings.defaultLang] || b.data.translations['es']
    title = `${t?.title || typedPage.name} — ${found.name}`
    price = found.price
    currency = b.data.currency
    tier = { id: found.id, name: found.name }
  }

  const admin = createAdminClient()
  const { data: connection } = await admin
    .from('payment_connections')
    .select('access_token')
    .eq('user_id', typedPage.user_id)
    .eq('provider', 'mercadopago')
    .single()

  if (!connection) {
    return NextResponse.json({ error: 'Este negocio todavía no conectó Mercado Pago' }, { status: 503 })
  }

  const { data: paymentRow, error: insertError } = await admin.from('payments').insert({
    page_id: pageId,
    block_id: blockId,
    provider: 'mercadopago',
    status: 'pending',
    amount: price,
    currency,
    tier_id: tier?.id ?? null,
    tier_name: tier?.name ?? null,
  }).select('id').single()

  if (insertError || !paymentRow) {
    return NextResponse.json({ error: 'No se pudo iniciar el pago' }, { status: 500 })
  }

  // Optional platform commission, off by default -- see SETUP.md § Mercado Pago.
  // MERCADOPAGO_PLATFORM_FEE_PERCENT unset or 0 means no fee, no behavior change.
  const platformFeePercent = Math.min(Math.max(Number(process.env.MERCADOPAGO_PLATFORM_FEE_PERCENT) || 0, 0), 100)
  const marketplaceFee = platformFeePercent > 0
    ? Math.round(price * platformFeePercent) / 100
    : undefined

  try {
    const preference = await createMercadoPagoPreference({
      accessToken: connection.access_token,
      title,
      price,
      currency,
      externalReference: paymentRow.id,
      notificationUrl: absoluteUrl(`/api/webhooks/mercadopago?ref=${paymentRow.id}`),
      backUrl: absoluteUrl(`/p/${typedPage.slug}`),
      marketplaceFee,
    })

    await admin.from('payments').update({ provider_preference_id: preference.id }).eq('id', paymentRow.id)

    return NextResponse.redirect(preference.init_point)
  } catch (err) {
    console.error('Mercado Pago preference creation error', err)
    return NextResponse.json({ error: 'No se pudo iniciar el pago' }, { status: 500 })
  }
}
