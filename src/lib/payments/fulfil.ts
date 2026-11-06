import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { generateId, absoluteUrl } from '@/lib/utils'
import { sendTicketEmail, emailConfigured } from '@/lib/email'
import { logPaymentEvent } from './events'

type Admin = SupabaseClient<Database>

export interface PaymentRow { id: string; page_id: string; status: string; tier_id: string | null; tier_name: string | null }

// Marks a payment approved and issues the ticket exactly once. Shared by every
// provider's webhook. Guarded on the *previous* status so a retried
// notification never issues a second ticket (tickets.payment_id is also unique).
export async function approvePayment(admin: Admin, payment: PaymentRow, patch: { providerPaymentId?: string; payerEmail?: string | null; pageName: string }) {
  const first = payment.status !== 'approved'
  await admin.from('payments').update({
    status: 'approved',
    ...(patch.providerPaymentId ? { provider_payment_id: patch.providerPaymentId } : {}),
    ...(patch.payerEmail ? { payer_email: patch.payerEmail } : {}),
  }).eq('id', payment.id)

  if (first) await logPaymentEvent(admin, { paymentId: payment.id, pageId: payment.page_id, type: 'payment.approved', message: 'Pago aprobado', detail: { providerPaymentId: patch.providerPaymentId ?? null } })
  if (payment.status === 'approved' || !payment.tier_id) return
  try {
    const { data: ticket } = await admin.from('tickets').insert({
      payment_id: payment.id, page_id: payment.page_id, tier_id: payment.tier_id,
      tier_name: payment.tier_name || 'General', code: generateId(), buyer_email: patch.payerEmail ?? null,
    }).select('code').single()
    await logPaymentEvent(admin, { paymentId: payment.id, pageId: payment.page_id, type: 'ticket.issued', message: `Entrada ${payment.tier_name || 'General'} emitida`, detail: { ticketCode: ticket?.code } })
    if (ticket && patch.payerEmail && emailConfigured()) {
      await sendTicketEmail({ to: patch.payerEmail, eventName: patch.pageName, tierName: payment.tier_name || 'General', ticketUrl: absoluteUrl(`/t/${ticket.code}`) })
      await logPaymentEvent(admin, { paymentId: payment.id, pageId: payment.page_id, type: 'ticket.email_sent', message: 'Entrada enviada al comprador' })
    }
  } catch (err) {
    // The payment is already recorded as approved; support can reissue manually.
    console.error('ticket issuance error', err)
    await logPaymentEvent(admin, { paymentId: payment.id, pageId: payment.page_id, type: 'ticket.failed', level: 'error', message: 'No se pudo emitir o enviar la entrada' })
  }
}

export async function markPayment(admin: Admin, id: string, status: 'rejected' | 'pending' | 'refunded', pageId?: string) {
  await admin.from('payments').update({ status }).eq('id', id)
  if (status !== 'pending') await logPaymentEvent(admin, { paymentId: id, pageId, type: status === 'rejected' ? 'payment.rejected' : 'payment.refunded', level: status === 'rejected' ? 'warn' : 'info', message: status === 'rejected' ? 'Pago rechazado' : 'Pago devuelto' })
}
