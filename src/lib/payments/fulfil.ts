import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { generateId, absoluteUrl } from '@/lib/utils'
import { sendTicketEmail, emailConfigured } from '@/lib/email'

type Admin = SupabaseClient<Database>

export interface PaymentRow { id: string; page_id: string; status: string; tier_id: string | null; tier_name: string | null }

// Marks a payment approved and issues the ticket exactly once. Shared by every
// provider's webhook. Guarded on the *previous* status so a retried
// notification never issues a second ticket (tickets.payment_id is also unique).
export async function approvePayment(admin: Admin, payment: PaymentRow, patch: { providerPaymentId?: string; payerEmail?: string | null; pageName: string }) {
  await admin.from('payments').update({
    status: 'approved',
    ...(patch.providerPaymentId ? { provider_payment_id: patch.providerPaymentId } : {}),
    ...(patch.payerEmail ? { payer_email: patch.payerEmail } : {}),
  }).eq('id', payment.id)

  if (payment.status === 'approved' || !payment.tier_id) return
  try {
    const { data: ticket } = await admin.from('tickets').insert({
      payment_id: payment.id, page_id: payment.page_id, tier_id: payment.tier_id,
      tier_name: payment.tier_name || 'General', code: generateId(), buyer_email: patch.payerEmail ?? null,
    }).select('code').single()
    if (ticket && patch.payerEmail && emailConfigured()) {
      await sendTicketEmail({ to: patch.payerEmail, eventName: patch.pageName, tierName: payment.tier_name || 'General', ticketUrl: absoluteUrl(`/t/${ticket.code}`) })
    }
  } catch (err) {
    // The payment is already recorded as approved; support can reissue manually.
    console.error('ticket issuance error', err)
  }
}

export async function markPayment(admin: Admin, id: string, status: 'rejected' | 'pending' | 'refunded') {
  await admin.from('payments').update({ status }).eq('id', id)
}
