import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Block, PaymentProvider } from '@/types'

export const PAYMENT_BLOCK_TYPES = ['payment_button', 'event_tickets'] as const

export interface PaymentPage { id: string; name: string; published: boolean; paymentBlocks: number }
export interface RecentPayment {
  id: string; status: string; amount: number; currency: string; tier_name: string | null
  payer_email: string | null; created_at: string; page_id: string; provider: string
}

export interface ProviderStatus {
  /** The platform has what it needs for this gateway (OAuth app keys). Redsys needs none: credentials are per seller. */
  serverReady: boolean
  connected: boolean
  liveMode: boolean | null
  connectedAt: string | null
  /** Non-secret detail to show the seller, e.g. Redsys "comercio 999008881 · terminal 1". */
  detail: string | null
}

export interface PaymentsStatus {
  providers: Record<PaymentProvider, ProviderStatus>
  connectedProviders: PaymentProvider[]
  pages: PaymentPage[]
  hasPaymentBlock: boolean
  hasPublishedPaymentPage: boolean
  recent: RecentPayment[]
}

export const isPaymentBlock = (b: Pick<Block, 'type'>) => (PAYMENT_BLOCK_TYPES as readonly string[]).includes(b.type)

export function serverReadiness(): Record<PaymentProvider, boolean> {
  return {
    mercadopago: !!(process.env.MERCADOPAGO_CLIENT_ID && process.env.MERCADOPAGO_CLIENT_SECRET),
    stripe: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_CONNECT_CLIENT_ID),
    redsys: true,
  }
}

// Connected gateways for one seller (service role: tokens/secrets are never
// readable from the browser, and we only select non-secret columns here).
export async function getConnections(userId: string) {
  const admin = createAdminClient()
  const { data } = await admin.from('payment_connections').select('provider, live_mode, connected_at, provider_user_id, config').eq('user_id', userId)
  return data ?? []
}

// Everything the "Cobros" setup assistant needs, in one place.
export async function getPaymentsStatus(supabase: SupabaseClient<Database>, userId: string): Promise<PaymentsStatus> {
  const [connections, { data: pages }] = await Promise.all([
    getConnections(userId),
    supabase.from('pages').select('id, name, published, blocks').eq('user_id', userId).order('updated_at', { ascending: false }),
  ])
  const ready = serverReadiness()
  const providers = Object.fromEntries((['mercadopago', 'stripe', 'redsys'] as PaymentProvider[]).map(id => {
    const c = connections.find(x => x.provider === id)
    const cfg = (c?.config ?? {}) as { terminal?: string }
    return [id, {
      serverReady: ready[id], connected: !!c, liveMode: c?.live_mode ?? null, connectedAt: c?.connected_at ?? null,
      detail: id === 'redsys' && c ? `Comercio ${c.provider_user_id}${cfg.terminal ? ` · terminal ${cfg.terminal}` : ''}` : id === 'stripe' && c ? `Cuenta ${c.provider_user_id}` : null,
    } satisfies ProviderStatus]
  })) as Record<PaymentProvider, ProviderStatus>

  const list: PaymentPage[] = (pages ?? []).map(p => ({
    id: p.id, name: p.name, published: p.published,
    paymentBlocks: ((p.blocks as unknown as Block[]) ?? []).filter(isPaymentBlock).length,
  }))
  const ids = list.map(p => p.id)
  const { data: recent } = ids.length
    ? await supabase.from('payments').select('id, status, amount, currency, tier_name, payer_email, created_at, page_id, provider').in('page_id', ids).order('created_at', { ascending: false }).limit(8)
    : { data: [] }
  return {
    providers,
    connectedProviders: (Object.keys(providers) as PaymentProvider[]).filter(id => providers[id].connected),
    pages: list,
    hasPaymentBlock: list.some(p => p.paymentBlocks > 0),
    hasPublishedPaymentPage: list.some(p => p.paymentBlocks > 0 && p.published),
    recent: (recent ?? []) as RecentPayment[],
  }
}

export { computeSteps } from './payments/steps'
export type { StepState } from './payments/steps'
