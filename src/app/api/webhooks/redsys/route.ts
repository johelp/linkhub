import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptSecret } from '@/lib/crypto'
import { approvePayment, markPayment } from '@/lib/payments/fulfil'
import { logPaymentEvent } from '@/lib/payments/events'
import { decodeParameters, isAuthorised, param, toCents, verifyNotification } from '@/lib/payments/redsys'

// Redsys "online notification" (the MERCHANTURL we sent with the order). It
// is a form POST carrying Ds_MerchantParameters + Ds_Signature, signed with
// the seller's own key, so we look the seller up through the order number
// BEFORE verifying, then trust nothing until the signature checks out.
export async function POST(request: NextRequest) {
  let merchantParameters = '', signature = ''
  const type = request.headers.get('content-type') ?? ''
  try {
    if (type.includes('application/json')) {
      const j = await request.json() as Record<string, string>
      merchantParameters = j.Ds_MerchantParameters ?? ''; signature = j.Ds_Signature ?? ''
    } else {
      const f = await request.formData()
      merchantParameters = String(f.get('Ds_MerchantParameters') ?? ''); signature = String(f.get('Ds_Signature') ?? '')
    }
  } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }) }
  if (!merchantParameters || !signature) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  let order: string | undefined
  try { order = param(decodeParameters(merchantParameters), 'Ds_Order') } catch { /* handled below */ }
  if (!order) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const admin = createAdminClient()
  const { data: payment } = await admin.from('payments').select('id, page_id, status, tier_id, tier_name, amount, payer_email').eq('provider', 'redsys').eq('provider_preference_id', order).maybeSingle()
  if (!payment) return NextResponse.json({ error: 'Unknown order' }, { status: 404 })
  const { data: page } = await admin.from('pages').select('user_id, name').eq('id', payment.page_id).single()
  const { data: conn } = page ? await admin.from('payment_connections').select('provider_user_id, access_token').eq('user_id', page.user_id).eq('provider', 'redsys').maybeSingle() : { data: null }
  if (!page || !conn) return NextResponse.json({ error: 'No connection' }, { status: 404 })

  let secret: string
  try { secret = decryptSecret(conn.access_token) } catch { return NextResponse.json({ error: 'Key unavailable' }, { status: 500 }) }
  const { valid, params } = verifyNotification({ merchantParameters, signature, secretBase64: secret })
  if (!valid || !params) {
    await logPaymentEvent(admin, { paymentId: payment.id, pageId: payment.page_id, provider: 'redsys', type: 'notification.invalid', level: 'error', message: 'Firma inválida en la notificación' })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Bind the signed payload to OUR record: same merchant, same amount.
  if (param(params, 'Ds_MerchantCode') !== conn.provider_user_id || param(params, 'Ds_Amount') !== toCents(Number(payment.amount))) {
    console.error('Redsys notification mismatch', { order })
    await logPaymentEvent(admin, { paymentId: payment.id, pageId: payment.page_id, provider: 'redsys', type: 'notification.invalid', level: 'error', message: 'Comercio o importe no coinciden con el pedido' })
    return NextResponse.json({ error: 'Mismatch' }, { status: 400 })
  }

  await logPaymentEvent(admin, { paymentId: payment.id, pageId: payment.page_id, provider: 'redsys', type: 'notification.received', message: `Respuesta ${param(params, 'Ds_Response') ?? '?'}`, detail: { response: param(params, 'Ds_Response'), authorisation: param(params, 'Ds_AuthorisationCode') } })
  if (isAuthorised(params)) {
    await approvePayment(admin, payment, { providerPaymentId: param(params, 'Ds_AuthorisationCode'), payerEmail: payment.payer_email, pageName: page.name })
  } else if (payment.status !== 'approved') {
    await markPayment(admin, payment.id, 'rejected', payment.page_id)
  }
  return NextResponse.json({ received: true })
}
