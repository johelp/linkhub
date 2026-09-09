import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMercadoPagoPayment, verifyMercadoPagoSignature } from '@/lib/mercadopago'

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
    .select('id, page_id')
    .eq('id', ref)
    .single()
  if (!paymentRow) return NextResponse.json({ error: 'Unknown payment' }, { status: 404 })

  const { data: page } = await admin.from('pages').select('user_id').eq('id', paymentRow.page_id).single()
  if (!page) return NextResponse.json({ error: 'Unknown page' }, { status: 404 })

  const { data: connection } = await admin
    .from('payment_connections')
    .select('access_token')
    .eq('user_id', page.user_id)
    .eq('provider', 'mercadopago')
    .single()
  if (!connection) return NextResponse.json({ error: 'No connection' }, { status: 404 })

  try {
    const payment = await getMercadoPagoPayment(connection.access_token, dataId)
    await admin.from('payments').update({
      status: STATUS_MAP[payment.status] || 'pending',
      provider_payment_id: dataId,
      payer_email: payment.payer?.email ?? null,
    }).eq('id', ref)
  } catch (err) {
    console.error('Mercado Pago webhook payment lookup error', err)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
