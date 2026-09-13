import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMercadoPagoPayment, verifyMercadoPagoSignature } from '@/lib/mercadopago'
import { sendTicketEmail, emailConfigured } from '@/lib/email'
import { absoluteUrl, generateId } from '@/lib/utils'

const STATUS_MAP: Record<string, 'approved' | 'rejected' | 'pending' | 'refunded'> = {
  approved: 'approved',
  rejected: 'rejected',
  cancelled: 'rejected',
  refunded: 'refunded',
  charged_back: 'refunded',
  pending: 'pending',
  in_process: 'pending',
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!webhookSecret) return NextResponse.json({ error: 'Webhook no configurado' }, { status: 503 })

  const ref = request.nextUrl.searchParams.get('ref')
  const dataId = request.nextUrl.searchParams.get('data.id') || request.nextUrl.searchParams.get('id')
  const type = request.nextUrl.searchParams.get('type') || request.nextUrl.searchParams.get('topic')

  if (!ref || !dataId) return NextResponse.json({ error: 'Missing ref/data.id' }, { status: 400 })

  const valid = verifyMercadoPagoSignature({
    signatureHeader: request.headers.get('x-signature'),
    requestId: request.headers.get('x-request-id'),
    dataId,
    secret: webhookSecret,
  })
  if (!valid) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })

  // Only "payment" notifications carry a status we care about here.
  if (type && type !== 'payment') return NextResponse.json({ received: true })

  const admin = createAdminClient()

  const { data: paymentRow } = await admin
    .from('payments')
    .select('id, page_id, status, tier_id, tier_name')
    .eq('id', ref)
    .single()
  if (!paymentRow) return NextResponse.json({ error: 'Unknown payment' }, { status: 404 })

  const { data: page } = await admin.from('pages').select('user_id, slug, name').eq('id', paymentRow.page_id).single()
  if (!page) return NextResponse.json({ error: 'Unknown page' }, { status: 404 })

  const { data: connection } = await admin
    .from('payment_connections')
    .select('access_token')
    .eq('user_id', page.user_id)
    .eq('provider', 'mercadopago')
    .single()
  if (!connection) return NextResponse.json({ error: 'No connection' }, { status: 404 })

  let newStatus: 'approved' | 'rejected' | 'pending' | 'refunded'
  let payerEmail: string | null
  try {
    const payment = await getMercadoPagoPayment(connection.access_token, dataId)

    // `ref` (which payments row we're about to update) comes from the query
    // string, not from anything Mercado Pago signed -- so before trusting
    // it, cross-check it against the payment's own external_reference,
    // which we set to this exact payments.id when the preference was
    // created (src/app/api/pay/mercadopago/route.ts). This is what stops a
    // signed-but-mismatched notification from updating the wrong row.
    if (payment.external_reference !== ref) {
      console.error('Mercado Pago webhook ref/external_reference mismatch', { ref, external_reference: payment.external_reference })
      return NextResponse.json({ error: 'Reference mismatch' }, { status: 400 })
    }

    newStatus = STATUS_MAP[payment.status] || 'pending'
    payerEmail = payment.payer?.email ?? null
    await admin.from('payments').update({
      status: newStatus,
      provider_payment_id: dataId,
      payer_email: payerEmail,
    }).eq('id', ref)
  } catch (err) {
    console.error('Mercado Pago webhook payment lookup error', err)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }

  // Issue a ticket the moment a ticket-tier payment first becomes approved.
  // Guarded on the *previous* status so a webhook retry (Mercado Pago
  // resends notifications) never issues a second ticket for the same
  // payment -- `payment_id` is also unique on `tickets` as a second layer.
  const isNewlyApproved = newStatus === 'approved' && paymentRow.status !== 'approved'
  if (isNewlyApproved && paymentRow.tier_id) {
    try {
      const code = generateId()
      const { data: ticket } = await admin.from('tickets').insert({
        payment_id: paymentRow.id,
        page_id: paymentRow.page_id,
        tier_id: paymentRow.tier_id,
        tier_name: paymentRow.tier_name || 'General',
        code,
        buyer_email: payerEmail,
      }).select('code').single()

      if (ticket && payerEmail && emailConfigured()) {
        await sendTicketEmail({
          to: payerEmail,
          eventName: page.name,
          tierName: paymentRow.tier_name || 'General',
          ticketUrl: absoluteUrl(`/t/${ticket.code}`),
        })
      }
    } catch (err) {
      // Don't fail the webhook over the ticket/email step -- the payment is
      // already recorded as approved; the buyer can still be helped
      // manually via the payments/tickets tables if this part hiccups.
      console.error('Mercado Pago ticket issuance error', err)
    }
  }

  return NextResponse.json({ received: true })
}
