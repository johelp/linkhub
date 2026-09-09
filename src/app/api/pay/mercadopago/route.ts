import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createMercadoPagoPreference } from '@/lib/mercadopago'
import { absoluteUrl } from '@/lib/utils'
import type { Page, PaymentButtonBlock } from '@/types'

// Public route: a visitor clicks a "payment_button" block on a published
// page and lands here. Creates a fresh Mercado Pago preference for that
// block's current price (not a stale pre-generated link) and redirects to
// Checkout Pro. No auth -- buyers aren't LinkHub users.
export async function GET(request: NextRequest) {
  const pageId = request.nextUrl.searchParams.get('pageId')
  const blockId = request.nextUrl.searchParams.get('blockId')
  if (!pageId || !blockId) {
    return NextResponse.json({ error: 'pageId and blockId required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: page } = await supabase.from('pages').select('*').eq('id', pageId).eq('published', true).single()
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const typedPage = page as unknown as Page
  const block = typedPage.blocks.find(b => b.id === blockId && b.type === 'payment_button') as PaymentButtonBlock | undefined
  if (!block) return NextResponse.json({ error: 'Block not found' }, { status: 404 })

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
    amount: block.data.price,
    currency: block.data.currency,
  }).select('id').single()

  if (insertError || !paymentRow) {
    return NextResponse.json({ error: 'No se pudo iniciar el pago' }, { status: 500 })
  }

  try {
    const t = block.data.translations[typedPage.settings.defaultLang] || block.data.translations['es']
    const preference = await createMercadoPagoPreference({
      accessToken: connection.access_token,
      title: t?.title || typedPage.name,
      price: block.data.price,
      currency: block.data.currency,
      externalReference: paymentRow.id,
      notificationUrl: absoluteUrl(`/api/webhooks/mercadopago?ref=${paymentRow.id}`),
      backUrl: absoluteUrl(`/p/${typedPage.slug}`),
    })

    await admin.from('payments').update({ provider_preference_id: preference.id }).eq('id', paymentRow.id)

    return NextResponse.redirect(preference.init_point)
  } catch (err) {
    console.error('Mercado Pago preference creation error', err)
    return NextResponse.json({ error: 'No se pudo iniciar el pago' }, { status: 500 })
  }
}
