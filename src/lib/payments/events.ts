import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

export type EventLevel = 'info' | 'warn' | 'error'

// Appends to the payment audit trail. Best-effort by design: logging must
// never break a payment, and it silently no-ops if migration 015 isn't applied
// yet. `detail` must never contain secrets, keys or card data.
export async function logPaymentEvent(admin: SupabaseClient<Database>, e: {
  paymentId?: string | null; pageId?: string | null; provider?: string | null
  type: string; level?: EventLevel; message?: string; detail?: Record<string, unknown>
}): Promise<void> {
  try {
    await admin.from('payment_events' as never).insert({
      payment_id: e.paymentId ?? null, page_id: e.pageId ?? null, provider: e.provider ?? null,
      type: e.type, level: e.level ?? 'info', message: e.message ?? null, detail: e.detail ?? {},
    } as never)
  } catch { /* table missing or transient error: never block the payment flow */ }
}

export const EVENT_LABELS: Record<string, string> = {
  'checkout.started': 'Se inició el pago',
  'checkout.redirected': 'El comprador fue enviado a la pasarela',
  'checkout.failed': 'No se pudo iniciar el pago',
  'notification.received': 'La pasarela notificó el pago',
  'notification.invalid': 'Notificación rechazada (firma o datos inválidos)',
  'payment.approved': 'Pago aprobado',
  'payment.rejected': 'Pago rechazado',
  'payment.refunded': 'Pago devuelto',
  'ticket.issued': 'Entrada emitida',
  'ticket.email_sent': 'Entrada enviada por email',
  'ticket.failed': 'No se pudo emitir la entrada',
}
